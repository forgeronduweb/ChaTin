import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { GENERATORS } from '@/lib/generators';
import { t } from '@/lib/i18n';

export default function ToolsScreen() {
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

        <Text style={styles.title}>{t('toolsTitle')}</Text>
        <Text style={styles.subtitle}>{t('toolsSubtitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {GENERATORS.map((generator) => (
          <Pressable
            key={generator.id}
            onPress={() => router.push({ pathname: '/tool/[id]', params: { id: generator.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.cardEmoji}>
              <Text style={styles.cardEmojiText}>{generator.emoji}</Text>
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>{generator.title}</Text>
              <Text style={styles.cardDescription}>{generator.description}</Text>
            </View>
            <SymbolView
              tintColor={colors.textSecondary}
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={16}
            />
          </Pressable>
        ))}
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
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: Fonts.regular,
    },
    list: {
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.six,
      gap: Spacing.two,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
      backgroundColor: colors.surfaceElevated,
      borderRadius: Spacing.four,
      padding: Spacing.three,
    },
    cardEmoji: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardEmojiText: {
      fontSize: 20,
    },
    cardTextGroup: {
      flex: 1,
      gap: Spacing.half,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 15,
      fontFamily: Fonts.bold,
    },
    cardDescription: {
      color: colors.textSecondary,
      fontSize: 13,
      fontFamily: Fonts.regular,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
