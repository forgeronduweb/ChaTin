import { Redirect, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Dimensions, Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { hasCompletedOnboarding, markOnboardingComplete } from '@/lib/onboarding';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_WIDTH = (SCREEN_WIDTH - Spacing.four * 2 - Spacing.three) / 2;

function stickerSize(ratio: number) {
  return { width: COLUMN_WIDTH, height: COLUMN_WIDTH / ratio };
}

const STICKERS_LEFT = [
  { key: 'clapperboard', source: require('@/assets/images/sticker-clapperboard.png'), ratio: 404 / 341 },
  { key: 'cat', source: require('@/assets/images/sticker-cat.png'), ratio: 413 / 477 },
];

const STICKERS_RIGHT = [
  { key: 'vinyl', source: require('@/assets/images/sticker-vinyl.png'), ratio: 425 / 304 },
  { key: 'mountain', source: require('@/assets/images/sticker-mountain.png'), ratio: 553 / 301 },
  { key: 'books', source: require('@/assets/images/sticker-books.png'), ratio: 303 / 283 },
];

function FloatingSticker({
  source,
  ratio,
  index,
}: {
  source: ImageSourcePropType;
  ratio: number;
  index: number;
}) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const delay = index * 220;
    const duration = 1600 + (index % 3) * 250;
    const tilt = index % 2 === 0 ? 3 : -3;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-7, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(7, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(tilt, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
          withTiming(-tilt, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [index, translateY, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Image source={source} style={stickerSize(ratio)} resizeMode="contain" />
    </Animated.View>
  );
}

function goToHome() {
  markOnboardingComplete();
  router.replace('/home');
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [alreadyOnboarded] = useState(hasCompletedOnboarding);

  if (alreadyOnboarded) {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.gridSection}>
        <GraphPaperBackground />

        <Image
          source={require('@/assets/images/chatin-logo.png')}
          style={styles.logoBadge}
          resizeMode="contain"
        />

        <Text style={styles.title}>{t('welcomeTitle')}</Text>

        <View style={styles.stickerColumns}>
          <View style={styles.stickerColumn}>
            {STICKERS_LEFT.map((sticker, index) => (
              <FloatingSticker
                key={sticker.key}
                source={sticker.source}
                ratio={sticker.ratio}
                index={index}
              />
            ))}
          </View>
          <View style={styles.stickerColumn}>
            {STICKERS_RIGHT.map((sticker, index) => (
              <FloatingSticker
                key={sticker.key}
                source={sticker.source}
                ratio={sticker.ratio}
                index={STICKERS_LEFT.length + index}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.bottomOverlay}>
        <View style={styles.bottomFade} />
        <View style={[styles.bottomSection, { paddingBottom: Spacing.three + insets.bottom }]}>
          <SocialAuthButtons onSignedIn={goToHome} />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('welcomeOr')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={goToHome}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaText}>{t('welcomeSkip')}</Text>
            <View style={styles.ctaArrow}>
              <SymbolView
                tintColor={Brand.cream}
                name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                size={16}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.cream,
  },
  gridSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  logoBadge: {
    alignSelf: 'flex-start',
    width: 132,
    height: 44,
  },
  title: {
    color: Brand.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: Fonts.bold,
  },
  stickerColumns: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stickerColumn: {
    flex: 1,
    gap: Spacing.three,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -Spacing.six,
    bottom: 0,
    experimental_backgroundImage: `linear-gradient(180deg, transparent, ${Brand.cream} 55%)`,
  },
  bottomSection: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.textMuted,
  },
  dividerText: {
    color: Brand.textMuted,
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.yellow,
    borderRadius: 999,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  ctaText: {
    color: Brand.ink,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  ctaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
