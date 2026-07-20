import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { UpdatePrompt } from '@/components/update-prompt';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { type AuthUser, getSession } from '@/lib/auth';
import { listStoredConversations, type StoredConversation } from '@/lib/conversations-store';
import { t } from '@/lib/i18n';
import { usePrompts } from '@/lib/prompts';
import { usePendingUpdate } from '@/lib/update-check';

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SeeAllLink({ onPress, styles }: { onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.seeAllRow}>
        <Text style={styles.seeAllText}>{t('homeSeeAll')}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [historyPreview, setHistoryPreview] = useState<StoredConversation[]>([]);
  const { prompts } = usePrompts();
  const featuredPrompts = prompts.filter((prompt) => prompt.featured).slice(0, 2);
  const pendingUpdate = usePendingUpdate();
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSession().then((session) => setUser(session?.user ?? null));
      setHistoryPreview(listStoredConversations().slice(0, 3));
    }, []),
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.gridSection}>
          <GraphPaperBackground />

          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.avatar}>
              {user ? (
                <Text style={styles.avatarInitials}>{initialsFor(user.name)}</Text>
              ) : (
                <Text style={styles.avatarEmoji}>🙂</Text>
              )}
            </View>
          </Pressable>

          <Text style={styles.title}>{t('homeTitle')}</Text>

          <AnimatedPressable onPress={() => router.push('/chat')} style={styles.newChat}>
            <Text style={styles.newChatText}>{t('homeNewChat')}</Text>
            <View style={styles.newChatArrow}>
              <SymbolView
                tintColor={Brand.yellow}
                name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                size={16}
              />
            </View>
          </AnimatedPressable>

          {historyPreview.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('homeChatHistory')}</Text>
                <SeeAllLink onPress={() => router.push('/history')} styles={styles} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.historyScroll}
                contentContainerStyle={styles.tagRow}>
                {historyPreview.map((conversation, index) => (
                  <Animated.View key={conversation.id} entering={FadeInUp.duration(300).delay(index * 60)}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/chat', params: { id: conversation.id } })}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText} numberOfLines={1}>
                          {conversation.title}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.promptSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('homePopularPrompt')}</Text>
            <SeeAllLink onPress={() => router.push('/prompts')} styles={styles} />
          </View>
          <View style={styles.promptRow}>
            {featuredPrompts.map((prompt, index) => (
              <Animated.View
                key={prompt.id}
                entering={FadeInUp.duration(320).delay(index * 80)}
                style={[styles.promptCard, { backgroundColor: prompt.color }]}>
                <View style={styles.promptCardBody}>
                  <Text style={styles.promptTitle} numberOfLines={3} ellipsizeMode="tail">
                    {prompt.title}
                  </Text>
                  <Text style={styles.promptAuthor}>{t('homeGeneratedBy', { author: prompt.author })}</Text>
                </View>
                <AnimatedPressable
                  onPress={() => router.push({ pathname: '/chat', params: { title: prompt.title } })}
                  style={styles.promptButton}>
                  <Text style={styles.promptButtonText}>{t('homeUsePrompt')}</Text>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {pendingUpdate && !updateDismissed && (
        <UpdatePrompt update={pendingUpdate} onDismiss={() => setUpdateDismissed(true)} />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    gridSection: {
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.three,
      paddingBottom: Spacing.four,
      gap: Spacing.four,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Brand.pink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarEmoji: {
      fontSize: 20,
    },
    avatarInitials: {
      color: Brand.ink,
      fontSize: 16,
      fontFamily: Fonts.bold,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      lineHeight: 34,
      fontFamily: Fonts.bold,
    },
    newChat: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Brand.yellow,
      borderRadius: 999,
      paddingLeft: Spacing.four,
      paddingRight: Spacing.two,
      paddingVertical: Spacing.two,
    },
    newChatText: {
      color: Brand.ink,
      fontSize: 16,
      fontFamily: Fonts.bold,
    },
    newChatArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Brand.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontFamily: Fonts.bold,
    },
    seeAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    seeAllText: {
      color: Brand.textMuted,
      fontSize: 14,
      fontFamily: Fonts.medium,
    },
    // Bleeds past gridSection's horizontal padding so the row's scrollable
    // viewport spans the full screen width - otherwise the last tag gets
    // stuck at the section's inset edge instead of scrolling clear of the
    // physical screen edge.
    historyScroll: {
      marginHorizontal: -Spacing.four,
    },
    tagRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      paddingHorizontal: Spacing.four,
    },
    tag: {
      maxWidth: 220,
      backgroundColor: colors.iconChipBackground,
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    tagText: {
      color: Brand.white,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
    },
    promptSection: {
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    promptRow: {
      flexDirection: 'row',
      gap: Spacing.three,
    },
    // Prompt cards use a per-prompt pastel accent background (unrelated to
    // page theme), so their text stays fixed ink, not the theme's `text`.
    promptCard: {
      flex: 1,
      height: 220,
      borderRadius: Spacing.four,
      padding: Spacing.three,
      justifyContent: 'space-between',
    },
    promptCardBody: {
      gap: Spacing.two,
    },
    promptTitle: {
      color: Brand.ink,
      fontSize: 16,
      lineHeight: 21,
      fontFamily: Fonts.bold,
    },
    promptAuthor: {
      color: Brand.inkMuted,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: Fonts.regular,
    },
    promptButton: {
      backgroundColor: Brand.white,
      borderRadius: 999,
      paddingVertical: Spacing.two,
      alignItems: 'center',
    },
    promptButtonText: {
      color: Brand.ink,
      fontSize: 13,
      fontFamily: Fonts.bold,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
