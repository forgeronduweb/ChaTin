import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { t } from '@/lib/i18n';

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <GraphPaperBackground />

      <View style={styles.content}>
        <Text style={styles.title}>{t('loginTitle')}</Text>
        <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>

        <SocialAuthButtons onSignedIn={() => router.back()} />

        <Pressable onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.later}>{t('loginMaybeLater')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
      gap: Spacing.five,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      lineHeight: 36,
      fontFamily: Fonts.bold,
      textAlign: 'center',
    },
    subtitle: {
      color: Brand.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: Fonts.regular,
      textAlign: 'center',
      marginTop: -Spacing.three,
    },
    later: {
      color: Brand.textMuted,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
