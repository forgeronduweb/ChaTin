import { Fragment, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line as SvgLine, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { t } from '@/lib/i18n';
import type { ChartSpec } from '@/lib/message-content';

// Validated colorblind-safe categorical order (same one used server-side for
// the admin dashboard's charts) - assigned by fixed slot, never cycled/reordered.
const PALETTE = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948'];

const CHART_W = 300;
const CHART_H = 160;
const PAD = 26;

function shouldShowLabel(index: number, total: number) {
  if (total <= 7) return true;
  const step = Math.ceil(total / 6);
  return index % step === 0 || index === total - 1;
}

export function ChatChart({ chart }: { chart: ChartSpec }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      {chart.title ? <Text style={styles.title}>{chart.title}</Text> : null}
      {chart.type === 'bar' && <BarChart chart={chart} colors={colors} />}
      {chart.type === 'line' && <LineChart chart={chart} colors={colors} />}
      {chart.type === 'pie' && <PieChart chart={chart} colors={colors} styles={styles} />}
      {chart.type !== 'pie' && chart.series.length > 1 && (
        <View style={styles.legendRow}>
          {chart.series.map((series, index) => (
            <View key={series.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PALETTE[index % PALETTE.length] }]} />
              <Text style={styles.legendText}>{series.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function BarChart({ chart, colors }: { chart: ChartSpec; colors: ThemeColors }) {
  const allValues = chart.series.flatMap((series) => series.values);
  const max = Math.max(1, ...allValues, 0);
  const groupWidth = (CHART_W - PAD * 2) / Math.max(1, chart.labels.length);
  const barWidth = Math.min(28, (groupWidth - 8) / chart.series.length);

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
      <SvgLine x1={PAD} y1={CHART_H - PAD} x2={CHART_W - 4} y2={CHART_H - PAD} stroke={colors.border} strokeWidth={1} />
      {chart.labels.map((label, labelIndex) => {
        const groupX = PAD + labelIndex * groupWidth;
        return (
          <Fragment key={label}>
            {chart.series.map((series, seriesIndex) => {
              const value = series.values[labelIndex] ?? 0;
              const barHeight = (value / max) * (CHART_H - PAD * 2 - 8);
              const x = groupX + seriesIndex * barWidth + (groupWidth - barWidth * chart.series.length) / 2;
              const y = CHART_H - PAD - barHeight;
              return (
                <Rect
                  key={series.label}
                  x={x}
                  y={y}
                  width={Math.max(2, barWidth - 3)}
                  height={Math.max(1, barHeight)}
                  rx={3}
                  fill={PALETTE[seriesIndex % PALETTE.length]}
                />
              );
            })}
            <SvgText
              x={groupX + groupWidth / 2}
              y={CHART_H - PAD + 14}
              fontSize={9}
              fill={colors.textSecondary}
              textAnchor="middle">
              {label}
            </SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
}

function LineChart({ chart, colors }: { chart: ChartSpec; colors: ThemeColors }) {
  const allValues = chart.series.flatMap((series) => series.values);
  const max = Math.max(1, ...allValues);
  const min = Math.min(0, ...allValues);
  const stepX = (CHART_W - PAD * 2) / Math.max(1, chart.labels.length - 1);

  function pointFor(value: number, index: number) {
    const x = PAD + index * stepX;
    const y = CHART_H - PAD - ((value - min) / (max - min || 1)) * (CHART_H - PAD * 2);
    return { x, y };
  }

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
      <SvgLine x1={PAD} y1={CHART_H - PAD} x2={CHART_W - 4} y2={CHART_H - PAD} stroke={colors.border} strokeWidth={1} />
      {chart.series.map((series, seriesIndex) => {
        const points = series.values.map((value, index) => pointFor(value, index));
        const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
        const color = PALETTE[seriesIndex % PALETTE.length];
        return (
          <Fragment key={series.label}>
            <Path d={d} fill="none" stroke={color} strokeWidth={2.5} />
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />
            ))}
          </Fragment>
        );
      })}
      {chart.labels.map((label, index) =>
        shouldShowLabel(index, chart.labels.length) ? (
          <SvgText
            key={label}
            x={PAD + index * stepX}
            y={CHART_H - PAD + 14}
            fontSize={9}
            fill={colors.textSecondary}
            textAnchor="middle">
            {label}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

function PieChart({
  chart,
  colors,
  styles,
}: {
  chart: ChartSpec;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const values = chart.series[0]?.values ?? [];
  let entries = chart.labels.map((label, index) => ({ label, value: values[index] ?? 0 }));
  // The categorical palette only validates up to 8 slots - fold the rest
  // into "Other" rather than repeating/cycling colors.
  if (entries.length > 8) {
    const top = entries.slice(0, 7);
    const restSum = entries.slice(7).reduce((sum, entry) => sum + entry.value, 0);
    entries = [...top, { label: t('chatChartOther'), value: restSum }];
  }

  const total = entries.reduce((sum, entry) => sum + entry.value, 0) || 1;
  const r = 44;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * r;
  const cx = 58;
  const cy = 58;
  const lengths = entries.map((entry) => (entry.value / total) * circumference);
  const segments = entries.map((entry, index) => ({
    ...entry,
    length: lengths[index],
    offset: lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
    color: PALETTE[index % PALETTE.length],
  }));

  return (
    <View style={styles.pieRow}>
      <Svg width={116} height={116} viewBox="0 0 116 116">
        {segments.map((segment) => (
          <Circle
            key={segment.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.length.toFixed(1)} ${(circumference - segment.length).toFixed(1)}`}
            strokeDashoffset={-segment.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
      </Svg>
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {segment.label} — {Math.round((segment.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Spacing.three,
      padding: Spacing.three,
      marginVertical: Spacing.one,
      gap: Spacing.two,
    },
    title: {
      color: colors.text,
      fontSize: 13,
      fontFamily: Fonts.bold,
    },
    pieRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
    },
    legend: {
      flexDirection: 'column',
      gap: Spacing.one,
      flexShrink: 1,
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.one,
    },
    legendDot: {
      width: 9,
      height: 9,
      borderRadius: 3,
      flexShrink: 0,
    },
    legendText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.medium,
      flexShrink: 1,
    },
  });
}
