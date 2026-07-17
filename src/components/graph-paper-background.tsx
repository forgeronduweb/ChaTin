import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewProps } from 'react-native';

import { Brand } from '@/constants/theme';

const LINE_COLOR = '#E3DCC2';
const GRID_SIZE = 28;

export function GraphPaperBackground({ style, ...rest }: ViewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }

  const columns = Math.ceil(size.width / GRID_SIZE);
  const rows = Math.ceil(size.height / GRID_SIZE);

  return (
    <View style={[styles.grid, style]} onLayout={handleLayout} {...rest}>
      {Array.from({ length: columns }, (_, index) => (
        <View key={`v-${index}`} style={[styles.verticalLine, { left: index * GRID_SIZE }]} />
      ))}
      {Array.from({ length: rows }, (_, index) => (
        <View key={`h-${index}`} style={[styles.horizontalLine, { top: index * GRID_SIZE }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.cream,
    overflow: 'hidden',
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: LINE_COLOR,
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE_COLOR,
  },
});
