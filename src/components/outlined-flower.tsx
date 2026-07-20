import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// The flower mark's petals are mostly a pale cream - fine on the solid dark
// badge it used to sit on, but invisible once that fill is removed. There's
// no vector source to add a per-petal stroke to, so this fakes one: several
// offset black silhouettes (via `tintColor`, which recolors the opaque
// pixels while keeping the alpha shape) stacked under the original art,
// tracing a dark edge around every petal - including the gaps between them.
const OUTLINE_OFFSETS: [number, number][] = [
  [-1.3, 0],
  [1.3, 0],
  [0, -1.3],
  [0, 1.3],
  [-0.9, -0.9],
  [0.9, -0.9],
  [-0.9, 0.9],
  [0.9, 0.9],
];

export function OutlinedFlower({ size, spin }: { size: number; spin?: boolean }) {
  const rotation = useSharedValue(0);
  const flowerSize = size * 0.7;

  useEffect(() => {
    if (!spin) return;
    rotation.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1);
  }, [spin, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: spin ? `${rotation.value}deg` : '0deg' }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <View style={{ width: flowerSize, height: flowerSize }}>
        {OUTLINE_OFFSETS.map(([dx, dy], index) => (
          <Image
            key={index}
            source={require('@/assets/images/flower_only_1024.png')}
            resizeMode="contain"
            tintColor="#161616"
            style={{ position: 'absolute', left: dx, top: dy, width: flowerSize, height: flowerSize }}
          />
        ))}
        <Image
          source={require('@/assets/images/flower_only_1024.png')}
          resizeMode="contain"
          style={{ position: 'absolute', left: 0, top: 0, width: flowerSize, height: flowerSize }}
        />
      </View>
    </Animated.View>
  );
}
