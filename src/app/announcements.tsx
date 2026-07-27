import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { MessageContent } from '@/components/message-content';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { type Announcement, getAnnouncements } from '@/lib/api';
import { announcementTypeEmoji, announcementTypeLabel } from '@/lib/announcement-types';
import { t } from '@/lib/i18n';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AnnouncementsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  useEffect(() => {
    getAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, []);

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

        <Text style={styles.title}>{t('announcementsTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {announcements?.length === 0 && <Text style={styles.emptyText}>{t('announcementsEmpty')}</Text>}
        {announcements?.map((announcement) => (
          <View key={announcement.id} style={styles.card}>
            {announcement.imageUrl && (
              <Image source={{ uri: announcement.imageUrl }} style={styles.cardImage} contentFit="cover" />
            )}
            <View style={styles.cardMetaRow}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>
                  {announcementTypeEmoji(announcement.type)} {announcementTypeLabel(announcement.type)}
                </Text>
              </View>
              <Text style={styles.cardDate}>{fmtDate(announcement.publishAt)}</Text>
            </View>
            <Text style={styles.cardTitle}>{announcement.title}</Text>
            <MessageContent text={announcement.content} />
          </View>
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
    scrollContent: {
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.six,
      gap: Spacing.three,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Spacing.four,
      padding: Spacing.four,
      gap: Spacing.one,
    },
    cardImage: {
      width: '100%',
      height: 160,
      borderRadius: Spacing.three,
      marginBottom: Spacing.two,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typePill: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 4,
    },
    typePillText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontFamily: Fonts.bold,
    },
    cardDate: {
      color: Brand.textMuted,
      fontSize: 12,
      fontFamily: Fonts.medium,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 17,
      fontFamily: Fonts.bold,
      marginTop: Spacing.one,
      marginBottom: Spacing.half,
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
