import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { type AuthUser, getSession } from '@/lib/auth';
import { listStoredConversations, type StoredConversation } from '@/lib/conversations-store';
import { t } from '@/lib/i18n';
import { usePrompts } from '@/lib/prompts';

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SeeAllLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.seeAllRow}>
        <Text style={styles.seeAllText}>{t('homeSeeAll')}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [historyPreview, setHistoryPreview] = useState<StoredConversation[]>([]);
  const { prompts } = usePrompts();
  const featuredPrompts = prompts.filter((prompt) => prompt.featured).slice(0, 2);

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

          <Pressable
            onPress={() => router.push('/chat')}
            style={({ pressed }) => [styles.newChat, pressed && styles.pressed]}>
            <Text style={styles.newChatText}>{t('homeNewChat')}</Text>
            <View style={styles.newChatArrow}>
              <SymbolView
                tintColor={Brand.yellow}
                name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                size={16}
              />
            </View>
          </Pressable>

          {historyPreview.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('homeChatHistory')}</Text>
                <SeeAllLink onPress={() => router.push('/history')} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagRow}>
                {historyPreview.map((conversation) => (
                  <Pressable
                    key={conversation.id}
                    onPress={() => router.push({ pathname: '/chat', params: { id: conversation.id } })}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>
                        {conversation.title}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.promptSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('homePopularPrompt')}</Text>
            <SeeAllLink onPress={() => router.push('/prompts')} />
          </View>
          <View style={styles.promptRow}>
            {featuredPrompts.map((prompt) => (
              <View key={prompt.id} style={[styles.promptCard, { backgroundColor: prompt.color }]}>
                <View style={styles.promptCardBody}>
                  <Text style={styles.promptTitle} numberOfLines={3} ellipsizeMode="tail">
                    {prompt.title}
                  </Text>
                  <Text style={styles.promptAuthor}>{t('homeGeneratedBy', { author: prompt.author })}</Text>
                </View>
                <Pressable
                  onPress={() => router.push({ pathname: '/chat', params: { title: prompt.title } })}
                  style={({ pressed }) => [styles.promptButton, pressed && styles.pressed]}>
                  <Text style={styles.promptButtonText}>{t('homeUsePrompt')}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.cream,
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
    color: Brand.ink,
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
    color: Brand.ink,
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
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tag: {
    maxWidth: 220,
    backgroundColor: Brand.ink,
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
