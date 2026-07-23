import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { exportTableAsExcel } from '@/lib/export';
import { t } from '@/lib/i18n';

type DataTableProps = {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
};

export function DataTable({ headers, alignments, rows }: DataTableProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportTableAsExcel(headers, rows);
    } catch (error) {
      console.error('Failed to export table as Excel:', error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <View>
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

      <Pressable
        onPress={handleExport}
        disabled={exporting}
        accessibilityLabel={t('chatActionExportExcel')}
        style={({ pressed }) => [styles.exportButton, pressed && styles.exportButtonPressed]}>
        {exporting ? (
          <ActivityIndicator size="small" color={Brand.textMuted} />
        ) : (
          <SymbolView tintColor={Brand.textMuted} name={{ ios: 'square.and.arrow.down', android: 'download', web: 'download' }} size={13} />
        )}
        <Text style={styles.exportButtonText}>{t('chatActionExportExcel')}</Text>
      </Pressable>
    </View>
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
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      marginTop: Spacing.one,
      paddingVertical: 4,
    },
    exportButtonPressed: {
      opacity: 0.6,
    },
    exportButtonText: {
      color: Brand.textMuted,
      fontSize: 12,
      fontFamily: Fonts.semiBold,
    },
  });
}
