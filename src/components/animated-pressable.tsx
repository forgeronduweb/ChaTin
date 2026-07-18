import { type PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    style?: StyleProp<ViewStyle>;
  }
>;

// A Pressable with a small spring "press down" scale, for the handful of
// primary calls-to-action where tactile feedback is worth the extra polish.
export function AnimatedPressable({ style, onPressIn, onPressOut, children, ...props }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        scale.value = withSpring(0.94, { damping: 16, stiffness: 320 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        onPressOut?.(event);
      }}
      {...props}>
      {children}
    </AnimatedPressableBase>
  );
}
