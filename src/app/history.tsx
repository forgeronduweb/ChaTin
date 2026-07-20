import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { listStoredConversations, type StoredConversation } from '@/lib/conversations-store';
import { t } from '@/lib/i18n';

export default function HistoryScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);

  useFocusEffect(
    useCallback(() => {
      setConversations(listStoredConversations());
    }, []),
  );

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

        <Text style={styles.title}>{t('homeChatHistory')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <Text style={styles.emptyText}>{t('historyEmpty')}</Text>
        ) : (
          conversations.map((conversation, index) => (
            <Animated.View key={conversation.id} entering={FadeInUp.duration(280).delay(index * 40)}>
              <Pressable
                onPress={() => router.push({ pathname: '/chat', params: { id: conversation.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Text style={styles.rowText}>{conversation.title}</Text>
                <SymbolView
                  tintColor={Brand.white}
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={16}
                />
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
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
    list: {
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.six,
      gap: Spacing.two,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.iconChipBackground,
      borderRadius: 999,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.three,
    },
    rowText: {
      color: Brand.white,
      fontSize: 15,
      fontFamily: Fonts.semiBold,
      flex: 1,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: Fonts.regular,
      textAlign: 'center',
      marginTop: Spacing.six,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
