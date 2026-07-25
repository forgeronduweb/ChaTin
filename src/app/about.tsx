import Constants from 'expo-constants';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { t } from '@/lib/i18n';

export default function AboutScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

        <Text style={styles.title}>{t('settingsAbout')}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutAppName}>ChaTin</Text>
          <Text style={styles.aboutTagline}>{t('settingsAboutTagline')}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settingsVersion')}</Text>
          <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '—'}</Text>
        </View>

        <Pressable onPress={() => router.push('/terms')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Text style={styles.rowLabel}>{t('aboutTermsRow')}</Text>
          <SymbolView
            tintColor={Brand.textMuted}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
          />
        </Pressable>

        <Pressable onPress={() => router.push('/privacy')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Text style={styles.rowLabel}>{t('aboutPrivacyRow')}</Text>
          <SymbolView
            tintColor={Brand.textMuted}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
          />
        </Pressable>

        <Pressable onPress={() => router.push('/license')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Text style={styles.rowLabel}>{t('aboutLicenseRow')}</Text>
          <SymbolView
            tintColor={Brand.textMuted}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
          />
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
      gap: Spacing.two,
    },
    aboutCard: {
      backgroundColor: colors.surface,
      borderRadius: Spacing.four,
      padding: Spacing.four,
      gap: Spacing.one,
      marginBottom: Spacing.three,
    },
    aboutAppName: {
      color: colors.text,
      fontSize: 20,
      fontFamily: Fonts.bold,
    },
    aboutTagline: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: Fonts.regular,
      lineHeight: 19,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },
    rowValue: {
      color: Brand.textMuted,
      fontSize: 14,
      fontFamily: Fonts.regular,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
