import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { MessageContent } from '@/components/message-content';
import { UpdatePrompt } from '@/components/update-prompt';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { type Announcement, getAnnouncements } from '@/lib/api';
import { announcementTypeEmoji } from '@/lib/announcement-types';
import { hasSeenAnnouncement, markAnnouncementSeen } from '@/lib/announcements-seen-store';
import { type AuthUser, getSession } from '@/lib/auth';
import { listStoredConversations, type StoredConversation } from '@/lib/conversations-store';
import { t } from '@/lib/i18n';
import { syncCityFromLocation } from '@/lib/location';
import { usePrompts } from '@/lib/prompts';
import { usePendingUpdate } from '@/lib/update-check';

// Only ever check once per cold start - useFocusEffect below re-runs every
// time Home regains focus (e.g. coming back from Chat), which would
// otherwise re-show the same "what's new" modal on every single visit.
let hasCheckedLaunchAnnouncement = false;

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

// Dragging the list up past this (px) snaps the sheet fully open; dragging
// back down past this snaps it closed again. Direction-based (not tied to an
// absolute scroll position) so closing responds immediately to a downward
// drag no matter where the list happens to be scrolled to.
const EXPAND_TRIGGER_DISTANCE = 24;

// Leaves the settings/avatar button visible above the sheet instead of the
// sheet covering all the way up to the status bar.
const AVATAR_CLEARANCE = Spacing.three + 44 + Spacing.three;

// Hand-drawn decorative doodles, mixed across prompt cards.
const PROMPT_CARD_DOODLES = [require('@/assets/images/Dessin (1).png'), require('@/assets/images/Dessin (2).png')];

// Stable per-prompt pick (not tied to grid position, unlike index % n, which
// would always put the same doodle in the same left/right column) - the
// same prompt always gets the same doodle across re-renders, but which
// doodle that is doesn't correlate with where it lands in the grid.
function doodleForPrompt(id: string): (typeof PROMPT_CARD_DOODLES)[number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PROMPT_CARD_DOODLES[Math.abs(hash) % PROMPT_CARD_DOODLES.length];
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [historyPreview, setHistoryPreview] = useState<StoredConversation[]>([]);
  const { prompts } = usePrompts();
  const featuredPrompts = prompts.filter((prompt) => prompt.featured);
  const pendingUpdate = usePendingUpdate();
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<Announcement | null>(null);
  const [launchAnnouncement, setLaunchAnnouncement] = useState<Announcement | null>(null);
  // Seeded with a realistic estimate so the prompt sheet already sits in
  // roughly the right place before the header's first onLayout measurement.
  const [headerHeight, setHeaderHeight] = useState(420);
  // 0 = resting below the header, 1 = fully expanded to cover the screen.
  const expanded = useSharedValue(0);
  const dragAccum = useSharedValue(0);
  const prevScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    const y = event.contentOffset.y;
    const delta = y - prevScrollY.value;
    prevScrollY.value = y;

    // Accumulate a running "drag so far in the current direction" distance,
    // resetting whenever the drag reverses - so it takes a real, deliberate
    // drag past the trigger distance in one direction to flip state, not
    // just a single noisy onScroll frame.
    dragAccum.value = Math.sign(delta) === Math.sign(dragAccum.value) || dragAccum.value === 0 ? dragAccum.value + delta : delta;

    if (dragAccum.value > EXPAND_TRIGGER_DISTANCE && expanded.value === 0) {
      expanded.value = withTiming(1, { duration: 320 });
      dragAccum.value = 0;
    } else if (dragAccum.value < -EXPAND_TRIGGER_DISTANCE && expanded.value === 1) {
      expanded.value = withTiming(0, { duration: 320 });
      dragAccum.value = 0;
    }
  });

  const collapsedTop = insets.top + headerHeight;
  const expandedTop = insets.top + AVATAR_CLEARANCE;
  const promptSheetStyle = useAnimatedStyle(() => ({
    top: interpolate(expanded.value, [0, 1], [collapsedTop, expandedTop], Extrapolation.CLAMP),
  }));

  // A plain drag on the "Popular Prompt" title itself - not routed through
  // the list's onScroll, so it works even once everything already fits
  // on screen and the list has nothing left to scroll (which is exactly
  // when closing-by-scrolling can't detect a downward drag at all).
  const headerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_event, gesture) => {
        if (gesture.dy < -EXPAND_TRIGGER_DISTANCE && expanded.value === 0) {
          expanded.value = withTiming(1, { duration: 320 });
        } else if (gesture.dy > EXPAND_TRIGGER_DISTANCE && expanded.value === 1) {
          expanded.value = withTiming(0, { duration: 320 });
        }
      },
    }),
  ).current;

  useFocusEffect(
    useCallback(() => {
      getSession().then((session) => {
        setUser(session?.user ?? null);
        if (session?.user) void syncCityFromLocation();
      });
      setHistoryPreview(listStoredConversations().slice(0, 3));
      // Coming back from another screen (e.g. Settings) should always find
      // the prompt sheet back in its resting position, not wherever it was
      // left expanded to before navigating away.
      expanded.value = 0;

      getAnnouncements()
        .then((items) => {
          setPinnedAnnouncement(items.find((item) => item.pinned) ?? null);
          if (!hasCheckedLaunchAnnouncement) {
            hasCheckedLaunchAnnouncement = true;
            const unseen = items.find((item) => !hasSeenAnnouncement(item.id));
            if (unseen) setLaunchAnnouncement(unseen);
          }
        })
        .catch(() => {});
    }, []),
  );

  function dismissLaunchAnnouncement() {
    if (launchAnnouncement) markAnnouncementSeen(launchAnnouncement.id);
    setLaunchAnnouncement(null);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.gridSection} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
          <GraphPaperBackground />

          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressed]}>
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

          {pinnedAnnouncement && (
            <Pressable
              onPress={() => router.push('/announcements')}
              style={({ pressed }) => [styles.pinnedBanner, pressed && styles.pressed]}>
              <Text style={styles.pinnedBannerEmoji}>{announcementTypeEmoji(pinnedAnnouncement.type)}</Text>
              <Text style={styles.pinnedBannerText} numberOfLines={1}>
                {pinnedAnnouncement.title}
              </Text>
              <SymbolView
                tintColor={Brand.textMuted}
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={14}
              />
            </Pressable>
          )}

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
      </SafeAreaView>

      <Animated.View style={[styles.promptSheet, promptSheetStyle]}>
        <View style={styles.sectionHeader} {...headerPanResponder.panHandlers}>
          <Text style={styles.sectionTitle}>{t('homePopularPrompt')}</Text>
        </View>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.promptScrollContent, { paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={styles.promptRow}>
            {featuredPrompts.map((prompt, index) => (
              <Animated.View
                key={prompt.id}
                entering={FadeInUp.duration(320).delay(index * 80)}
                style={[styles.promptCard, { backgroundColor: prompt.color }]}>
                <Image
                  style={styles.promptCardDoodle}
                  contentFit="contain"
                  source={doodleForPrompt(prompt.id)}
                />
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
        </Animated.ScrollView>
      </Animated.View>

      {pendingUpdate && !updateDismissed && (
        <UpdatePrompt update={pendingUpdate} onDismiss={() => setUpdateDismissed(true)} />
      )}

      <Modal visible={launchAnnouncement !== null} transparent animationType="slide" onRequestClose={dismissLaunchAnnouncement}>
        <View style={styles.launchOverlay}>
          <View style={[styles.launchSheet, { paddingBottom: Spacing.five + insets.bottom }]}>
            {launchAnnouncement && (
              <>
                <Text style={styles.launchEmoji}>{announcementTypeEmoji(launchAnnouncement.type)}</Text>
                <Text style={styles.launchTitle}>{launchAnnouncement.title}</Text>
                <MessageContent text={launchAnnouncement.content} />
              </>
            )}
            <Pressable onPress={dismissLaunchAnnouncement} style={({ pressed }) => [styles.launchButton, pressed && styles.pressed]}>
              <Text style={styles.launchButtonText}>{t('settingsOk')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    // Without this, the Pressable wrapping the avatar defaults to stretching
    // to the full width of `gridSection` (a flex column) instead of hugging
    // its 44x44 content, making the whole row tappable instead of just the
    // circle.
    avatarPressable: {
      alignSelf: 'flex-start',
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
    pinnedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two + 2,
    },
    pinnedBannerEmoji: {
      fontSize: 15,
    },
    pinnedBannerText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
    },
    launchOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    launchSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: Spacing.five,
      borderTopRightRadius: Spacing.five,
      paddingTop: Spacing.five,
      paddingHorizontal: Spacing.five,
      gap: Spacing.two,
    },
    launchEmoji: {
      fontSize: 28,
    },
    launchTitle: {
      color: colors.text,
      fontSize: 20,
      fontFamily: Fonts.bold,
      marginBottom: Spacing.one,
    },
    launchButton: {
      backgroundColor: Brand.yellow,
      borderRadius: 999,
      paddingVertical: Spacing.three,
      alignItems: 'center',
      marginTop: Spacing.two,
    },
    launchButtonText: {
      color: Brand.ink,
      fontSize: 16,
      fontFamily: Fonts.bold,
    },
    // Absolutely positioned over `gridSection` (not a normal flex sibling) -
    // its animated `top` (see promptSheetStyle) rises as its inner ScrollView
    // scrolls, so the sheet grows to cover the whole screen instead of
    // staying confined below the header.
    promptSheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      elevation: 10,
      backgroundColor: colors.background,
      borderTopLeftRadius: Spacing.five,
      borderTopRightRadius: Spacing.five,
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    promptScrollContent: {
      paddingBottom: Spacing.four,
    },
    promptRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
    },
    // Prompt cards use a per-prompt pastel accent background (unrelated to
    // page theme), so their text stays fixed ink, not the theme's `text`.
    // Fixed ~47% width (not flex: 1) so they always wrap two-per-row instead
    // of all sharing one row shrunk to fit once there are more than two -
    // and stay that width even alone on a trailing row, for consistency.
    promptCard: {
      width: '47%',
      height: 220,
      borderRadius: Spacing.four,
      padding: Spacing.three,
      justifyContent: 'space-between',
    },
    // Sits around the card's vertical middle, behind the "Generated by"
    // line and above the button - not pinned to the top corner.
    promptCardDoodle: {
      position: 'absolute',
      top: 92,
      right: Spacing.two,
      width: 64,
      height: 64,
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
