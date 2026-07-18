import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Brand, Spacing } from '@/constants/theme';
import { t } from '@/lib/i18n';

export type Reaction = 'like' | 'dislike' | null;

export function MessageActionBar({
  text,
  reaction,
  onReact,
  isSpeaking,
  onToggleSpeak,
}: {
  text: string;
  reaction: Reaction;
  onReact: (reaction: Reaction) => void;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function handleShare() {
    Share.share({ message: text }).catch(() => {});
  }

  return (
    <View style={styles.row}>
      <AnimatedPressable
        accessibilityLabel={copied ? t('chatActionCopied') : t('chatActionCopy')}
        onPress={handleCopy}
        style={styles.button}>
        <SymbolView
          tintColor={Brand.textMuted}
          name={copied ? { ios: 'checkmark', android: 'check', web: 'check' } : { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
          size={15}
        />
      </AnimatedPressable>

      <AnimatedPressable accessibilityLabel={t('chatActionShare')} onPress={handleShare} style={styles.button}>
        <SymbolView
          tintColor={Brand.textMuted}
          name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
          size={15}
        />
      </AnimatedPressable>

      <AnimatedPressable
        accessibilityLabel={isSpeaking ? t('chatActionStopReading') : t('chatActionReadAloud')}
        onPress={onToggleSpeak}
        style={styles.button}>
        <SymbolView
          tintColor={isSpeaking ? Brand.ink : Brand.textMuted}
          name={
            isSpeaking
              ? { ios: 'stop.fill', android: 'stop', web: 'stop' }
              : { ios: 'speaker.wave.2', android: 'volume_up', web: 'volume_up' }
          }
          size={15}
        />
      </AnimatedPressable>

      <AnimatedPressable
        accessibilityLabel={t('chatActionLike')}
        onPress={() => onReact(reaction === 'like' ? null : 'like')}
        style={styles.button}>
        <SymbolView
          tintColor={reaction === 'like' ? Brand.green : Brand.textMuted}
          name={
            reaction === 'like'
              ? { ios: 'hand.thumbsup.fill', android: 'thumb_up', web: 'thumb_up' }
              : { ios: 'hand.thumbsup', android: 'thumb_up_off_alt', web: 'thumb_up_off_alt' }
          }
          size={15}
        />
      </AnimatedPressable>

      <AnimatedPressable
        accessibilityLabel={t('chatActionDislike')}
        onPress={() => onReact(reaction === 'dislike' ? null : 'dislike')}
        style={styles.button}>
        <SymbolView
          tintColor={reaction === 'dislike' ? Brand.red : Brand.textMuted}
          name={
            reaction === 'dislike'
              ? { ios: 'hand.thumbsdown.fill', android: 'thumb_down', web: 'thumb_down' }
              : { ios: 'hand.thumbsdown', android: 'thumb_down_off_alt', web: 'thumb_down_off_alt' }
          }
          size={15}
        />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
