import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Brand } from '@/constants/theme';

const PETAL_CREAM = '#FAF3DC';

// 8 petals, evenly spaced but rotated a half-step off the cardinal axes so a
// gap always sits dead center at top (and bottom/left/right) instead of a
// petal tip - the same asymmetric 3-color accent placement as the brand mark.
const PETALS: { angle: number; color: string }[] = [
  { angle: -22.5, color: PETAL_CREAM },
  { angle: 22.5, color: PETAL_CREAM },
  { angle: 67.5, color: Brand.green },
  { angle: 112.5, color: Brand.yellow },
  { angle: 157.5, color: PETAL_CREAM },
  { angle: 202.5, color: PETAL_CREAM },
  { angle: 247.5, color: Brand.pink },
  { angle: 292.5, color: PETAL_CREAM },
];

// One petal, tip pointing straight up, drawn in a 100x100 box centered on
// (50,50) - reused for the full ring by rotating this same path per petal.
const PETAL_PATH = 'M50 48 C41 42 36 26 40 15 C42 8 46 4 50 4 C54 4 58 8 60 15 C64 26 59 42 50 48 Z';

export function OutlinedFlower({ size, spin }: { size: number; spin?: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!spin) return;
    rotation.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1);
  }, [spin, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: spin ? `${rotation.value}deg` : '0deg' }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
        {PETALS.map(({ angle, color }) => (
          <Path
            key={angle}
            d={PETAL_PATH}
            fill={color}
            stroke={Brand.ink}
            strokeWidth={2.5}
            strokeLinejoin="round"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}
