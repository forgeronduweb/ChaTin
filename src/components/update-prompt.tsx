import { useMemo } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import type { PendingUpdate } from '@/lib/update-check';

type UpdatePromptProps = {
  update: PendingUpdate;
  onDismiss: () => void;
};

export function UpdatePrompt({ update, onDismiss }: UpdatePromptProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={update.mandatory ? undefined : onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Spacing.five + insets.bottom }]}>
          <Text style={styles.title}>Nouvelle version disponible</Text>
          <Text style={styles.version}>Version {update.version}</Text>
          {update.notes ? <Text style={styles.notes}>{update.notes}</Text> : null}

          <Pressable
            onPress={() => Linking.openURL(update.apkUrl)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Mettre à jour</Text>
          </Pressable>

          {!update.mandatory && (
            <Pressable onPress={onDismiss} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.laterText}>Plus tard</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: Spacing.five,
      borderTopRightRadius: Spacing.five,
      paddingTop: Spacing.five,
      paddingHorizontal: Spacing.five,
      gap: Spacing.two,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontFamily: Fonts.bold,
    },
    version: {
      color: Brand.textMuted,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },
    notes: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: Fonts.regular,
      marginBottom: Spacing.two,
    },
    primaryButton: {
      backgroundColor: Brand.yellow,
      borderRadius: 999,
      paddingVertical: Spacing.three,
      alignItems: 'center',
      marginTop: Spacing.two,
    },
    primaryButtonText: {
      color: Brand.ink,
      fontSize: 16,
      fontFamily: Fonts.bold,
    },
    laterText: {
      color: Brand.textMuted,
      fontSize: 14,
      fontFamily: Fonts.semiBold,
      textAlign: 'center',
      paddingVertical: Spacing.two,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
