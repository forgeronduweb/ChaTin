import Constants from 'expo-constants';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppDialog } from '@/components/app-dialog';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { submitFeedback } from '@/lib/api';
import { t } from '@/lib/i18n';

export default function FeedbackScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);

  async function handleSend() {
    if (!message.trim()) {
      setShowEmptyDialog(true);
      return;
    }
    setStatus('sending');
    try {
      await submitFeedback(message.trim(), Constants.expoConfig?.version);
      setMessage('');
      setStatus('sent');
    } catch (error) {
      console.error('Failed to send feedback:', error);
      setStatus('error');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.headerSection}>
        <GraphPaperBackground />

        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.iconButton}>
              <SymbolView
                tintColor={Brand.white}
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={18}
              />
            </View>
          </Pressable>
        </View>

        <Text style={styles.title}>{t('settingsFeedback')}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <TextInput
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder={t('settingsFeedbackPlaceholder')}
            placeholderTextColor={Brand.textMuted}
            style={styles.input}
            multiline
            numberOfLines={6}
            autoFocus
          />
          <AnimatedPressable
            onPress={handleSend}
            style={[styles.sendButton, status === 'sending' && styles.sendButtonDisabled]}>
            <Text style={styles.sendButtonText}>
              {status === 'sending' ? t('settingsFeedbackSending') : t('settingsFeedbackSend')}
            </Text>
          </AnimatedPressable>
          {status === 'sent' && <Text style={styles.success}>{t('settingsFeedbackSuccess')}</Text>}
          {status === 'error' && <Text style={styles.error}>{t('settingsFeedbackError')}</Text>}
        </View>
      </View>

      <AppDialog
        visible={showEmptyDialog}
        title={t('settingsFeedbackEmpty')}
        primaryAction={{ label: t('settingsOk'), onPress: () => setShowEmptyDialog(false) }}
        onRequestClose={() => setShowEmptyDialog(false)}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerSection: {
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.two,
      paddingBottom: Spacing.three,
      gap: Spacing.three,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.iconChipBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 28,
      lineHeight: 34,
      fontFamily: Fonts.bold,
    },
    body: {
      flex: 1,
      paddingHorizontal: Spacing.four,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Spacing.four,
      padding: Spacing.three,
      gap: Spacing.three,
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Spacing.three,
      padding: Spacing.three,
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.regular,
      minHeight: 160,
      textAlignVertical: 'top',
    },
    sendButton: {
      borderRadius: 999,
      paddingVertical: Spacing.three,
      alignItems: 'center',
      backgroundColor: colors.iconChipBackground,
    },
    sendButtonDisabled: {
      opacity: 0.6,
    },
    sendButtonText: {
      color: Brand.white,
      fontSize: 15,
      fontFamily: Fonts.semiBold,
    },
    success: {
      color: Brand.green,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
      textAlign: 'center',
    },
    error: {
      color: Brand.red,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
