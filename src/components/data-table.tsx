import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';

type DataTableProps = {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
};

export function DataTable({ headers, alignments, rows }: DataTableProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      <View>
        <View style={[styles.row, styles.headerRow]}>
          {headers.map((header, index) => (
            <Text key={index} style={[styles.cell, styles.headerCell, { textAlign: alignments[index] ?? 'left' }]}>
              {header}
            </Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.row, rowIndex === rows.length - 1 && styles.lastRow]}>
            {row.map((cell, cellIndex) => (
              <Text key={cellIndex} style={[styles.cell, { textAlign: alignments[cellIndex] ?? 'left' }]}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Spacing.three,
      marginVertical: Spacing.one,
    },
    row: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerRow: {
      backgroundColor: colors.surface,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    cell: {
      minWidth: 110,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
      color: colors.text,
      fontSize: 13,
      fontFamily: Fonts.regular,
    },
    headerCell: {
      color: colors.textSecondary,
      fontFamily: Fonts.bold,
      fontSize: 11.5,
      textTransform: 'uppercase',
    },
  });
}
