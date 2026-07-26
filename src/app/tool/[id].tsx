import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import { getGenerator } from '@/lib/generators';
import { t } from '@/lib/i18n';

export default function ToolFormScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const generator = getGenerator(id ?? '');
  const [values, setValues] = useState<Record<string, string>>({});

  if (!generator) {
    router.back();
    return null;
  }

  const isComplete = generator.fields.every((field) => (values[field.key] ?? '').trim().length > 0);

  function handleGenerate() {
    if (!generator || !isComplete) return;
    const prompt = generator.buildPrompt(values);
    router.push({ pathname: '/chat', params: { title: prompt } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.headerSection}>
        <GraphPaperBackground />

        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.iconButton}>
              <SymbolView
                tintColor={Brand.white}
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={18}
              />
            </View>
          </Pressable>
        </View>

        <Text style={styles.title}>
          {generator.emoji} {generator.title}
        </Text>
        <Text style={styles.subtitle}>{generator.description}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {generator.fields.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            {field.type === 'text' ? (
              <TextInput
                value={values[field.key] ?? ''}
                onChangeText={(text) => setValues((prev) => ({ ...prev, [field.key]: text }))}
                placeholder={field.placeholder}
                placeholderTextColor={Brand.textMuted}
                style={[styles.input, field.multiline && styles.inputMultiline]}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 4 : 1}
              />
            ) : (
              <View style={styles.chipRow}>
                {field.options.map((option) => {
                  const selected = values[field.key] === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setValues((prev) => ({ ...prev, [field.key]: option }))}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        <AnimatedPressable
          onPress={handleGenerate}
          disabled={!isComplete}
          style={[styles.generateButton, !isComplete && styles.generateButtonDisabled]}>
          <Text style={styles.generateButtonText}>{t('toolsGenerate')}</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerSection: {
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.two,
      paddingBottom: Spacing.three,
      gap: Spacing.three,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.iconChipBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: Fonts.bold,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: Fonts.regular,
    },
    body: {
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.six,
      gap: Spacing.four,
    },
    fieldGroup: {
      gap: Spacing.two,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Spacing.three,
      padding: Spacing.three,
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.regular,
    },
    inputMultiline: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    chip: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    chipSelected: {
      backgroundColor: Brand.green,
    },
    chipText: {
      color: colors.text,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
    },
    chipTextSelected: {
      color: Brand.ink,
    },
    generateButton: {
      marginTop: Spacing.two,
      backgroundColor: Brand.green,
      borderRadius: 999,
      paddingVertical: Spacing.three,
      alignItems: 'center',
    },
    generateButtonDisabled: {
      opacity: 0.5,
    },
    generateButtonText: {
      color: Brand.ink,
      fontSize: 15,
      fontFamily: Fonts.bold,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
