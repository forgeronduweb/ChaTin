import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Fonts, Spacing } from '@/constants/theme';
import type { PendingUpdate } from '@/lib/update-check';

type UpdatePromptProps = {
  update: PendingUpdate;
  onDismiss: () => void;
};

export function UpdatePrompt({ update, onDismiss }: UpdatePromptProps) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={update.mandatory ? undefined : onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(22,22,22,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.cream,
    borderTopLeftRadius: Spacing.five,
    borderTopRightRadius: Spacing.five,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  title: {
    color: Brand.ink,
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  version: {
    color: Brand.textMuted,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  notes: {
    color: Brand.inkMuted,
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
