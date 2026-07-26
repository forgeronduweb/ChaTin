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
import { locale, t } from '@/lib/i18n';

const localeTag = locale === 'fr' ? 'fr-FR' : 'en-US';
const timeFormatter = new Intl.DateTimeFormat(localeTag, { hour: '2-digit', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'short' });

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatConversationDate(updatedAt: number): string {
  const date = new Date(updatedAt);
  const now = new Date();
  const time = timeFormatter.format(date);
  if (isSameDay(date, now)) return `${t('historyToday')} · ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `${t('historyYesterday')} · ${time}`;
  return `${dateFormatter.format(date)} · ${time}`;
}

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
                <View style={styles.rowIcon}>
                  <SymbolView
                    tintColor={Brand.white}
                    name={{ ios: 'bubble.left.fill', android: 'chat_bubble', web: 'chat_bubble' }}
                    size={16}
                  />
                </View>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowTitle} numberOfLines={1} ellipsizeMode="tail">
                    {conversation.title}
                  </Text>
                  <Text style={styles.rowDate}>{formatConversationDate(conversation.updatedAt)}</Text>
                </View>
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
      gap: Spacing.three,
      backgroundColor: colors.iconChipBackground,
      borderRadius: Spacing.four,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTextGroup: {
      flex: 1,
      gap: Spacing.half,
    },
    rowTitle: {
      color: Brand.white,
      fontSize: 15,
      fontFamily: Fonts.semiBold,
    },
    rowDate: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: 12,
      fontFamily: Fonts.regular,
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
