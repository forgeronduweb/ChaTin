import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { usePrompts } from '@/lib/prompts';

export default function PromptsScreen() {
  const { prompts } = usePrompts();

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

        <Text style={styles.title}>{t('homePopularPrompt')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {prompts.map((prompt) => (
          <View key={prompt.id} style={[styles.card, { backgroundColor: prompt.color }]}>
            <Text style={styles.cardTitle}>{prompt.title}</Text>
            <Text style={styles.cardAuthor}>{t('homeGeneratedBy', { author: prompt.author })}</Text>
            <Pressable
              onPress={() => router.push({ pathname: '/chat', params: { title: prompt.title } })}
              style={({ pressed }) => [styles.cardButton, pressed && styles.pressed]}>
              <Text style={styles.cardButtonText}>{t('homeUsePrompt')}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.cream,
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
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Brand.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.bold,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardTitle: {
    color: Brand.ink,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Fonts.bold,
  },
  cardAuthor: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  cardButton: {
    marginTop: Spacing.two,
    backgroundColor: Brand.white,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cardButtonText: {
    color: Brand.ink,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  pressed: {
    opacity: 0.8,
  },
});
