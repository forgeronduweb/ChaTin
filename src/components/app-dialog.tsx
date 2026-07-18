import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Fonts, Spacing } from '@/constants/theme';

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  primaryAction: AppDialogAction;
  secondaryAction?: AppDialogAction;
  onRequestClose?: () => void;
};

// A bottom-sheet dialog styled like the rest of the app, used in place of
// the native Alert.alert for anything the user actually sees rendered
// on-screen (confirmations, update-check results).
export function AppDialog({ visible, title, message, primaryAction, secondaryAction, onRequestClose }: AppDialogProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Spacing.five + insets.bottom }]}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            onPress={primaryAction.onPress}
            style={({ pressed }) => [
              styles.primaryButton,
              primaryAction.destructive && styles.destructiveButton,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.primaryButtonText, primaryAction.destructive && styles.destructiveButtonText]}>
              {primaryAction.label}
            </Text>
          </Pressable>

          {secondaryAction && (
            <Pressable onPress={secondaryAction.onPress} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.secondaryText}>{secondaryAction.label}</Text>
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
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  title: {
    color: Brand.ink,
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  message: {
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
  destructiveButton: {
    backgroundColor: Brand.red,
  },
  destructiveButtonText: {
    color: Brand.white,
  },
  secondaryText: {
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
