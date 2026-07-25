import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Fonts, Spacing } from '@/constants/theme';
import { t, type TranslationKey } from '@/lib/i18n';
import type { WeatherCondition, WeatherSpec } from '@/lib/message-content';

// Idle loop applied to the condition icon, keyed by condition so each
// weather type reads with its own motion (spin, drift, fall, sway, flash).
type IconMotion = (rotate: ReturnType<typeof useSharedValue<number>>, translateY: ReturnType<typeof useSharedValue<number>>, translateX: ReturnType<typeof useSharedValue<number>>, opacity: ReturnType<typeof useSharedValue<number>>) => void;

const ICON_MOTION: Record<WeatherCondition, IconMotion> = {
  clear: (rotate) => {
    // 0 -> 360 with no reverse looks like a continuous spin since the two ends are visually identical.
    rotate.value = withRepeat(withTiming(360, { duration: 16000, easing: Easing.linear }), -1, false);
  },
  'partly-cloudy': (_rotate, translateY) => {
    translateY.value = withRepeat(withTiming(-3, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
  },
  cloudy: (_rotate, _translateY, translateX) => {
    translateX.value = withRepeat(withTiming(4, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
  },
  fog: (_rotate, _translateY, translateX) => {
    translateX.value = withRepeat(withTiming(3, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  },
  drizzle: (_rotate, translateY) => {
    translateY.value = withRepeat(withSequence(withTiming(2, { duration: 400, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 0 })), -1, false);
  },
  rain: (_rotate, translateY) => {
    translateY.value = withRepeat(withSequence(withTiming(3, { duration: 280, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 0 })), -1, false);
  },
  snow: (rotate) => {
    rotate.value = withRepeat(withTiming(10, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  },
  thunderstorm: (_rotate, _translateY, _translateX, opacity) => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 90 }),
        withTiming(1, { duration: 90 }),
        withTiming(0.35, { duration: 90 }),
        withTiming(1, { duration: 90 }),
        withTiming(1, { duration: 1800 }),
      ),
      -1,
      false,
    );
  },
};

function AnimatedWeatherIcon({ condition, foreground, icon }: { condition: WeatherCondition; foreground: string; icon: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol } }) {
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    ICON_MOTION[condition](rotate, translateY, translateX, opacity);
  }, [condition, rotate, translateY, translateX, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotateZ: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <SymbolView tintColor={foreground} name={icon} size={48} />
    </Animated.View>
  );
}

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: ReturnType<typeof requestAnimationFrame>;
    const start = Date.now();

    function tick() {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const cardEntrance = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 12 }, { scale: 0.94 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(420);

const CONDITION_STYLE: Record<
  WeatherCondition,
  { background: string; foreground: string; labelKey: TranslationKey; icon: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol } }
> = {
  clear: {
    background: '#FBD873',
    foreground: Brand.ink,
    labelKey: 'weatherConditionClear',
    icon: { ios: 'sun.max.fill', android: 'sunny', web: 'sunny' },
  },
  'partly-cloudy': {
    background: '#BFDCF2',
    foreground: Brand.ink,
    labelKey: 'weatherConditionPartlyCloudy',
    icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
  },
  cloudy: {
    background: '#D3D3CB',
    foreground: Brand.ink,
    labelKey: 'weatherConditionCloudy',
    icon: { ios: 'cloud.fill', android: 'cloud', web: 'cloud' },
  },
  fog: {
    background: '#CCCFC9',
    foreground: Brand.ink,
    labelKey: 'weatherConditionFog',
    icon: { ios: 'cloud.fog.fill', android: 'foggy', web: 'foggy' },
  },
  drizzle: {
    background: '#9CC2DE',
    foreground: Brand.ink,
    labelKey: 'weatherConditionDrizzle',
    icon: { ios: 'cloud.drizzle.fill', android: 'rainy_light', web: 'rainy_light' },
  },
  rain: {
    background: '#5C86AD',
    foreground: Brand.white,
    labelKey: 'weatherConditionRain',
    icon: { ios: 'cloud.rain.fill', android: 'rainy', web: 'rainy' },
  },
  snow: {
    background: '#EAF3FB',
    foreground: Brand.ink,
    labelKey: 'weatherConditionSnow',
    icon: { ios: 'snowflake', android: 'weather_snowy', web: 'weather_snowy' },
  },
  thunderstorm: {
    background: '#4A4E69',
    foreground: Brand.white,
    labelKey: 'weatherConditionThunderstorm',
    icon: { ios: 'cloud.bolt.rain.fill', android: 'thunderstorm', web: 'thunderstorm' },
  },
};

export function WeatherCard({ weather }: { weather: WeatherSpec }) {
  const style = CONDITION_STYLE[weather.condition];
  const styles = useMemo(() => createStyles(style.background, style.foreground), [style.background, style.foreground]);
  const temperature = useCountUp(weather.temperatureC);

  return (
    <Animated.View entering={cardEntrance} style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.city} numberOfLines={1}>
            {weather.city}
          </Text>
          <Text style={styles.condition}>{t(style.labelKey)}</Text>
        </View>
        <AnimatedWeatherIcon condition={weather.condition} foreground={style.foreground} icon={style.icon} />
      </View>

      <Text style={styles.temperature}>{Math.round(temperature)}°</Text>

      {(weather.windKph !== undefined || weather.humidityPct !== undefined) && (
        <View style={styles.detailsRow}>
          {weather.windKph !== undefined && (
            <View style={styles.detailItem}>
              <SymbolView tintColor={style.foreground} name={{ ios: 'wind', android: 'air', web: 'air' }} size={14} />
              <Text style={styles.detailText}>
                {t('weatherWind')} {Math.round(weather.windKph)} km/h
              </Text>
            </View>
          )}
          {weather.humidityPct !== undefined && (
            <View style={styles.detailItem}>
              <SymbolView tintColor={style.foreground} name={{ ios: 'humidity.fill', android: 'water_drop', web: 'water_drop' }} size={14} />
              <Text style={styles.detailText}>
                {t('weatherHumidity')} {Math.round(weather.humidityPct)}%
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

function createStyles(background: string, foreground: string) {
  return StyleSheet.create({
    card: {
      backgroundColor: background,
      borderRadius: Spacing.four,
      padding: Spacing.four,
      gap: Spacing.one,
      marginVertical: Spacing.one,
      maxWidth: 280,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    city: {
      color: foreground,
      fontSize: 16,
      fontFamily: Fonts.bold,
    },
    condition: {
      color: foreground,
      fontSize: 13,
      fontFamily: Fonts.medium,
      opacity: 0.85,
    },
    temperature: {
      color: foreground,
      fontSize: 48,
      lineHeight: 54,
      fontFamily: Fonts.extraBold,
    },
    detailsRow: {
      flexDirection: 'row',
      gap: Spacing.three,
      marginTop: Spacing.one,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailText: {
      color: foreground,
      fontSize: 12,
      fontFamily: Fonts.medium,
      opacity: 0.9,
    },
  });
}
