import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  interpolate,
  interpolateColor,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppDialog } from '@/components/app-dialog';
import { MessageActionBar, type Reaction } from '@/components/message-action-bar';
import { MessageContent } from '@/components/message-content';
import { OutlinedFlower } from '@/components/outlined-flower';
import { Brand, Fonts, lightColors, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/contexts/theme-context';
import {
  type ChatMessage,
  createConversation,
  type PickedFile,
  sendMessage,
  sendMessageWithFile,
  setMessageReaction,
  transcribeAudio,
} from '@/lib/api';
import { ensureChatSession, updateChatSession, useChatSession } from '@/lib/chat-session-store';
import { createLocalConversationId, getStoredConversation, saveStoredConversation } from '@/lib/conversations-store';
import { locale, t } from '@/lib/i18n';

// expo-speech is a native module - guarded with require() (catchable, unlike a
// static import) so opening the chat doesn't crash on a dev client that
// hasn't been rebuilt with it yet; read-aloud just no-ops until it has.
let Speech: typeof import('expo-speech') | null = null;
try {
  Speech = require('expo-speech');
} catch {
  Speech = null;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

function SpinningFlower({ size }: { size: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <AnimatedImage
      source={require('@/assets/images/flower_only_1024.png')}
      style={[{ width: size, height: size }, animatedStyle]}
      resizeMode="contain"
    />
  );
}

const LOADING_STATUS_KEYS = ['chatLoadingThinking', 'chatLoadingGenerating', 'chatLoadingAlmost'] as const;

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// The chat input's height grows with its content between these two bounds,
// then scrolls internally past the max instead of growing further.
const INPUT_MIN_HEIGHT = 48;
const INPUT_MAX_HEIGHT = 220;
const INPUT_ANIM_CONFIG = { duration: 240, easing: Easing.out(Easing.cubic) };

// A sent message longer than this collapses behind a "Show more" toggle.
const MESSAGE_TEXT_MAX_LINES = 12;

// Cycles through a few status phrases with a soft cross-fade, like ChatGPT's
// "Thinking…" / "Generating…" hints - just enough motion to read as a live
// process rather than a frozen spinner, without claiming any real progress.
function LoadingStatusText({ style }: { style?: object }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % LOADING_STATUS_KEYS.length);
    }, 1900);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.Text
      key={index}
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(280)}
      style={style}>
      {t(LOADING_STATUS_KEYS[index])}
    </Animated.Text>
  );
}

function ChatInputBar({
  draft,
  onChangeDraft,
  onSend,
  bottomPadding,
  isRecording,
  isTranscribing,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  attachedFile,
  onAttach,
  onRemoveAttachment,
}: {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  bottomPadding: number;
  isRecording: boolean;
  isTranscribing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  attachedFile: PickedFile | null;
  onAttach: () => void;
  onRemoveAttachment: () => void;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Plain CSS maxHeight on a multiline TextInput isn't reliably enforced on
  // Android - the field just keeps growing with the content. Measuring the
  // actual content height and clamping it in JS works everywhere.
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
  // Only the wide, shadowed "ChatGPT" card once the message has wrapped to
  // more than one line - a short message keeps the original compact row
  // (separate small attach/send circles either side of a slim pill).
  //
  // This is deliberately NOT a plain `inputHeight > threshold` expression.
  // Right around the 1-to-2-line boundary that comparison flip-flops on
  // every keystroke: entering the second line, isExpanded would go true,
  // and (before the fix below) that in turn used to shrink the field's own
  // horizontal padding, which widened the wrappable area enough to pull the
  // text back onto one line, flipping isExpanded false again - an actual
  // layout feedback loop, not just measurement noise, and it read as the
  // whole bar trembling. Two changes fix it: the input's horizontal padding
  // no longer depends on expand state (see inputAnimatedStyle) so resizing
  // the bar can no longer change how the text wraps, and enter/exit use
  // different thresholds (hysteresis) so being exactly on the boundary
  // can't toggle the state back and forth by itself.
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const hasText = draft.trim().length > 0;
    if (!hasText) {
      setIsExpanded(false);
    } else if (!isExpanded && inputHeight > INPUT_MIN_HEIGHT + 14) {
      setIsExpanded(true);
    } else if (isExpanded && inputHeight <= INPUT_MIN_HEIGHT + 6) {
      setIsExpanded(false);
    }
  }, [draft, inputHeight, isExpanded]);

  // Drives the compact <-> expanded cross-fade/resize, and smooths out the
  // field's own height growth so it eases into place instead of snapping
  // with every keystroke. Both share the same duration/easing (see
  // INPUT_ANIM_CONFIG) on purpose - when they run out of sync (e.g. the
  // field's height settling faster than the card's background/padding
  // growing around it) the card visibly "catches up" a beat later, which
  // reads as a jarring double-motion instead of one smooth resize.
  const expandProgress = useSharedValue(0);
  const animatedHeight = useSharedValue(INPUT_MIN_HEIGHT);
  useEffect(() => {
    expandProgress.value = withTiming(isExpanded ? 1 : 0, INPUT_ANIM_CONFIG);
  }, [isExpanded, expandProgress]);
  useEffect(() => {
    animatedHeight.value = withTiming(inputHeight, INPUT_ANIM_CONFIG);
  }, [inputHeight, animatedHeight]);

  // Nothing here may touch a width-affecting property (paddingHorizontal,
  // gap, or any child's width) - see the isExpanded comment above. Even a
  // few px there changes how much room the text has to wrap in, which used
  // to feed back into the very measurement that decides isExpanded. Only
  // height/vertical padding/color/radius/shadow animate; every horizontal
  // dimension in this row is a fixed constant in both states.
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(expandProgress.value, [0, 1], ['rgba(0,0,0,0)', colors.surfaceElevated]),
    borderRadius: Spacing.five,
    paddingVertical: interpolate(expandProgress.value, [0, 1], [0, Spacing.two]),
    shadowOpacity: interpolate(expandProgress.value, [0, 1], [0, 0.1]),
    shadowRadius: interpolate(expandProgress.value, [0, 1], [0, 12]),
    elevation: interpolate(expandProgress.value, [0, 1], [0, 4]),
  }));
  const attachAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [44, 40]),
    borderRadius: interpolate(expandProgress.value, [0, 1], [22, 20]),
    backgroundColor: interpolateColor(expandProgress.value, [0, 1], [colors.surface, 'rgba(0,0,0,0)']),
  }));
  const sendAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [48, 40]),
    borderRadius: interpolate(expandProgress.value, [0, 1], [24, 20]),
  }));
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    backgroundColor: interpolateColor(expandProgress.value, [0, 1], [colors.surfaceElevated, 'rgba(0,0,0,0)']),
    borderRadius: interpolate(expandProgress.value, [0, 1], [Spacing.five, 0]),
    // Horizontal padding stays fixed (not interpolated) on purpose - see the
    // isExpanded comment above. Letting it shrink with expandProgress used
    // to change the text's wrappable width, which fed back into the very
    // measurement that decides isExpanded.
    paddingHorizontal: Spacing.three,
    paddingVertical: interpolate(expandProgress.value, [0, 1], [Spacing.three, Spacing.two + 2]),
  }));

  if (isRecording) {
    return (
      <View style={[styles.inputRow, { gap: Spacing.two, paddingBottom: Spacing.three + bottomPadding }]}>
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>{t('chatRecording')}</Text>
        </View>
        <Pressable
          onPress={onCancelRecording}
          style={({ pressed }) => [styles.recordingCancelButton, pressed && styles.pressed]}>
          <SymbolView tintColor={Brand.textMuted} name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} />
        </Pressable>
        <AnimatedPressable onPress={onStopRecording} style={[styles.sendButton, styles.sendButtonSize]}>
          <SymbolView tintColor={Brand.ink} name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={18} />
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={{ paddingBottom: Spacing.three + bottomPadding }}>
      {attachedFile && (
        <View style={styles.attachmentChipRow}>
          <View style={styles.attachmentChip}>
            <SymbolView
              tintColor={Brand.ink}
              name={{ ios: 'doc.fill', android: 'description', web: 'description' }}
              size={14}
            />
            <Text style={styles.attachmentChipText} numberOfLines={1}>
              {attachedFile.name}
            </Text>
            <Pressable onPress={onRemoveAttachment} hitSlop={8}>
              <SymbolView
                tintColor={Brand.textMuted}
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                size={16}
              />
            </Pressable>
          </View>
        </View>
      )}
      <View style={styles.inputRow}>
        <Animated.View style={[styles.inputContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.attachButtonSizer, attachAnimatedStyle]}>
            <Pressable
              onPress={onAttach}
              style={({ pressed }) => [styles.attachButtonFill, pressed && styles.pressed]}>
              <SymbolView tintColor={colors.text} name={{ ios: 'paperclip', android: 'attach_file', web: 'attach_file' }} size={18} />
            </Pressable>
          </Animated.View>
          <AnimatedTextInput
            value={draft}
            onChangeText={onChangeDraft}
            placeholder={t('chatPlaceholder')}
            placeholderTextColor={Brand.textMuted}
            style={[styles.input, inputAnimatedStyle]}
            multiline
            // numberOfLines maps directly to Android's native maxLines - the
            // reliable way to cap a multiline EditText's height there; the
            // style.height clamp (from onContentSizeChange) covers iOS, where
            // numberOfLines doesn't bound multiline TextInput the same way.
            numberOfLines={8}
            returnKeyType="default"
            onContentSizeChange={(event) =>
              setInputHeight(
                Math.round(Math.min(Math.max(event.nativeEvent.contentSize.height, INPUT_MIN_HEIGHT), INPUT_MAX_HEIGHT)),
              )
            }
          />
          {draft.trim() || attachedFile ? (
            <AnimatedPressable onPress={onSend} style={[styles.sendButton, sendAnimatedStyle]}>
              <SymbolView
                tintColor={Brand.ink}
                name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
                size={18}
              />
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              onPress={onStartRecording}
              disabled={isTranscribing}
              style={[styles.sendButton, sendAnimatedStyle, isTranscribing && styles.sendButtonDisabled]}>
              {isTranscribing ? (
                <SpinningFlower size={20} />
              ) : (
                <SymbolView tintColor={Brand.ink} name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }} size={18} />
              )}
            </AnimatedPressable>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

function MessageActionPopover({
  anchor,
  showEdit,
  onModify,
  onCopy,
  onDismiss,
}: {
  anchor: { y: number } | null;
  showEdit: boolean;
  onModify: () => void;
  onCopy: () => void;
  onDismiss: () => void;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!anchor) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <Animated.View
          entering={FadeInUp.duration(140)}
          style={[styles.popover, { top: anchor.y, right: Spacing.four }]}>
          {showEdit && (
            <>
              <Pressable
                onPress={onModify}
                style={({ pressed }) => [styles.popoverRow, pressed && styles.pressed]}>
                <SymbolView tintColor={Brand.ink} name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={15} />
                <Text style={styles.popoverRowText}>{t('chatEditMessage')}</Text>
              </Pressable>
              <View style={styles.popoverDivider} />
            </>
          )}
          <Pressable
            onPress={onCopy}
            style={({ pressed }) => [styles.popoverRow, pressed && styles.pressed]}>
            <SymbolView
              tintColor={Brand.ink}
              name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
              size={15}
            />
            <Text style={styles.popoverRowText}>{t('chatCopyMessage')}</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  isEditing,
  editDraft,
  onChangeEditDraft,
  onConfirmEdit,
  onCancelEdit,
  editInputRef,
  canLongPress,
  onLongPress,
  reaction,
  onReact,
  isSpeaking,
  onToggleSpeak,
}: {
  message: ChatMessage;
  isEditing: boolean;
  editDraft: string;
  onChangeEditDraft: (text: string) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  editInputRef: React.RefObject<TextInput | null>;
  canLongPress: boolean;
  onLongPress: (y: number) => void;
  reaction: Reaction;
  onReact: (reaction: Reaction) => void;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  // RN gives no direct truncation callback - the standard trick is checking
  // whether the clamped render actually reached the numberOfLines cap.
  const [isTextTruncated, setIsTextTruncated] = useState(false);

  if (message.from === 'bot') {
    return (
      <Animated.View entering={FadeInUp.duration(260).springify().damping(18)} style={styles.botMessageBlock}>
        <View style={styles.botLabelRow}>
          <View style={styles.botLabelLogoBadge}>
            <Image
              source={require('@/assets/images/flower_only_1024.png')}
              style={styles.botLabelLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.botLabel}>ChaTin</Text>
        </View>
        <Pressable
          onLongPress={canLongPress ? (event) => onLongPress(event.nativeEvent.pageY) : undefined}
          delayLongPress={350}>
          <MessageContent text={message.text} />
        </Pressable>
        <MessageActionBar
          text={message.text}
          reaction={reaction}
          onReact={onReact}
          isSpeaking={isSpeaking}
          onToggleSpeak={onToggleSpeak}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(220).springify().damping(18)} style={styles.meMessageBlock}>
      {isEditing ? (
        <View style={styles.meBubble}>
          <TextInput
            ref={editInputRef}
            value={editDraft}
            onChangeText={onChangeEditDraft}
            style={styles.meEditInput}
            multiline
          />
          <View style={styles.editActionsRow}>
            <Pressable
              onPress={onCancelEdit}
              style={({ pressed }) => [styles.editActionButton, pressed && styles.pressed]}>
              <SymbolView tintColor={Brand.textMuted} name={{ ios: 'xmark', android: 'close', web: 'close' }} size={13} />
            </Pressable>
            <Pressable
              onPress={onConfirmEdit}
              style={({ pressed }) => [
                styles.editActionButton,
                styles.editActionButtonPrimary,
                pressed && styles.pressed,
              ]}>
              <SymbolView tintColor={Brand.white} name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={13} />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onLongPress={canLongPress ? (event) => onLongPress(event.nativeEvent.pageY) : undefined}
          delayLongPress={350}>
          <Animated.View layout={LinearTransition.duration(220)} style={styles.meBubble}>
            {message.attachmentName && (
              <View style={styles.messageAttachmentChip}>
                <SymbolView
                  tintColor={Brand.ink}
                  name={{ ios: 'doc.fill', android: 'description', web: 'description' }}
                  size={12}
                />
                <Text style={styles.messageAttachmentText} numberOfLines={1}>
                  {message.attachmentName}
                </Text>
              </View>
            )}
            {message.text ? (
              <>
                <Text
                  style={styles.meText}
                  numberOfLines={isTextExpanded ? undefined : MESSAGE_TEXT_MAX_LINES}
                  onTextLayout={(event) => {
                    if (!isTextExpanded && event.nativeEvent.lines.length >= MESSAGE_TEXT_MAX_LINES) {
                      setIsTextTruncated(true);
                    }
                  }}>
                  {message.text}
                </Text>
                {isTextTruncated && (
                  <Pressable onPress={() => setIsTextExpanded((expanded) => !expanded)} hitSlop={6}>
                    <Text style={styles.meShowMoreText}>{isTextExpanded ? t('chatShowLess') : t('chatShowMore')}</Text>
                  </Pressable>
                )}
              </>
            ) : null}
          </Animated.View>
        </Pressable>
      )}
      <View style={styles.meFooter}>
        <View style={styles.meAvatar}>
          <Text style={styles.meAvatarEmoji}>🙂</Text>
        </View>
        <Text style={styles.meLabel}>Me</Text>
      </View>
    </Animated.View>
  );
});

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id, title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const [stored] = useState(() => (id ? getStoredConversation(id) : undefined));
  const [draft, setDraft] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const localId = useRef(stored?.id ?? id ?? createLocalConversationId());
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const session = useChatSession(localId.current, {
    messages: stored?.messages ?? [],
    title: stored?.title ?? title ?? null,
  });
  const { messages, sending } = session;
  const [popoverFor, setPopoverFor] = useState<{ id: string; y: number; canEdit: boolean } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
  const [attachedFile, setAttachedFile] = useState<PickedFile | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState(0);
  // Seeded with a realistic estimate so messages already clear the header
  // icons before the very first onLayout measurement lands.
  const [headerHeight, setHeaderHeight] = useState(64);
  // Seeded with a realistic estimate (not 0) so the very first message sent
  // in a session already reserves roughly the right amount of space, before
  // the button has actually laid out once to report its true height.
  const [stopButtonHeight, setStopButtonHeight] = useState(44);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [heroSpinning, setHeroSpinning] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const lastUserMessageId = [...messages].reverse().find((message) => message.from === 'me')?.id ?? null;
  const editInputRef = useRef<TextInput>(null);
  const editingMessageIdRef = useRef<string | null>(null);
  // The centered logo stays put (as a static badge, then a spinner while the
  // first prompt is running) until the first bot reply exists - once that
  // lands, the FlatList takes over and the logo never comes back.
  const showIntroLogo = !messages.some((message) => message.from === 'bot');
  const heroX = useSharedValue(0);
  const heroY = useSharedValue(0);
  const heroScale = useSharedValue(1);

  const heroWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: heroX.value }, { translateY: heroY.value }],
  }));

  const heroBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: '-5deg' }, { scale: heroScale.value }],
  }));

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      scrollToEditingMessage();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function scrollToEditingMessage() {
    const id = editingMessageIdRef.current;
    if (!id) return;
    const index = messages.findIndex((message) => message.id === id);
    if (index >= 0) {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    }
  }

  // FlatList's scrollToEnd() computes its target offset from whatever content
  // length it currently has measured, which can undershoot right after
  // content grows (a new bubble, the stop button, the bottom padding all
  // changing at once). scrollToOffset with a deliberately oversized value
  // sidesteps that estimate entirely - the scroll view clamps it to the
  // real max itself, so this always lands on the true end. Only the first
  // call animates; stacking several animated scrolls while layout is still
  // settling is what made the list visibly judder, so the follow-up
  // corrections snap instantly instead - invisible if the first call
  // already landed correctly, a silent fix if it didn't.
  function scrollToEndRobust() {
    if (editingMessageIdRef.current) return;
    flatListRef.current?.scrollToOffset({ offset: 1e7, animated: true });
    [150, 400].forEach((delay) => {
      setTimeout(() => {
        if (editingMessageIdRef.current) return;
        flatListRef.current?.scrollToOffset({ offset: 1e7, animated: false });
      }, delay);
    });
  }

  useEffect(() => {
    if (!sending) return;
    scrollToEndRobust();
  }, [sending]);

  useEffect(() => {
    editingMessageIdRef.current = editingMessageId;
    if (!editingMessageId) return;
    // Editing starts from the "Modifier" row inside the popover Modal, which
    // closes in the same render as this TextInput mounting. On Android the
    // dialog window has to actually finish tearing down before focus can
    // move to a view in the main window - a single animation frame isn't
    // enough, so this needs a real delay rather than a rAF.
    const timeout = setTimeout(() => {
      editInputRef.current?.focus();
      scrollToEditingMessage();
    }, 300);
    return () => clearTimeout(timeout);
  }, [editingMessageId]);

  useEffect(() => {
    let cancelled = false;
    // A session that's already creating/holding a conversation (e.g. we
    // navigated away mid-reply and came back) already has this - reusing it
    // avoids spawning a duplicate server-side conversation on remount.
    if (session.serverConversationId) return;
    createConversation(stored?.title ?? title, stored?.messages).then((conversation) => {
      if (cancelled) return;
      updateChatSession(localId.current, { serverConversationId: conversation.id });
      if (!stored && title) {
        void submit(title);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(text: string, file?: PickedFile | null) {
    const current = ensureChatSession(localId.current, { messages: [], title: null });
    if (!current.serverConversationId) return;
    if (current.messages.length === 0) {
      // The logo hops from center to the top-left corner (where the bot
      // label always lives) instead of just fading out, then keeps
      // spinning there once it "lands" while the reply is generated.
      heroX.value = withTiming(-130, { duration: 480, easing: Easing.out(Easing.cubic) });
      heroY.value = withSequence(
        withTiming(-100, { duration: 220, easing: Easing.out(Easing.quad) }),
        withSpring(-230, { damping: 7, stiffness: 90 }, (finished) => {
          if (finished) runOnJS(setHeroSpinning)(true);
        }),
      );
      heroScale.value = withDelay(200, withSpring(0.2, { damping: 9, stiffness: 130 }));
    }
    const resolvedTitle = current.title ?? (text || file?.name || t('chatNewChatTitle'));
    const messagesWithUser = [
      ...current.messages,
      { id: `${Date.now()}`, from: 'me' as const, text, attachmentName: file?.name ?? null },
    ];
    const controller = new AbortController();
    updateChatSession(localId.current, {
      title: resolvedTitle,
      messages: messagesWithUser,
      sending: true,
      abortController: controller,
    });
    // Save right away (not just once the reply lands) so the conversation
    // already shows up in Historique even if the user leaves before the
    // reply arrives - the reply keeps generating in the background either way.
    saveStoredConversation({
      id: localId.current,
      title: resolvedTitle,
      messages: messagesWithUser,
      updatedAt: Date.now(),
    });
    try {
      const result = file
        ? await sendMessageWithFile(current.serverConversationId, text, file, controller.signal)
        : await sendMessage(current.serverConversationId, text, controller.signal);
      updateChatSession(localId.current, { messages: result.messages, sending: false, abortController: null });
      saveStoredConversation({
        id: localId.current,
        title: resolvedTitle,
        messages: result.messages,
        updatedAt: Date.now(),
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Failed to send message:', error);
        const withError = [
          ...messagesWithUser,
          { id: `${Date.now()}-error`, from: 'bot' as const, text: t('chatServerError') },
        ];
        updateChatSession(localId.current, { messages: withError, sending: false, abortController: null });
        saveStoredConversation({
          id: localId.current,
          title: resolvedTitle,
          messages: withError,
          updatedAt: Date.now(),
        });
      } else {
        updateChatSession(localId.current, { sending: false, abortController: null });
      }
    }
  }

  function handleSend() {
    if ((!draft.trim() && !attachedFile) || sending) return;
    const text = draft.trim();
    const file = attachedFile;
    setDraft('');
    setAttachedFile(null);
    Keyboard.dismiss();
    void submit(text, file);
  }

  async function handleAttach() {
    if (sending) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setAttachedFile({ uri: asset.uri, name: asset.name });
  }

  function handleRemoveAttachment() {
    setAttachedFile(null);
  }

  function handleStopGenerating() {
    session.abortController?.abort();
  }

  async function handleStartRecording() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setShowMicPermissionDialog(true);
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  }

  async function handleStopRecording() {
    setIsRecording(false);
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return;
    setIsTranscribing(true);
    try {
      const text = await transcribeAudio(uri);
      const finalText = (draft ? `${draft} ${text}` : text).trim();
      if (finalText && !sending) {
        setDraft('');
        Keyboard.dismiss();
        void submit(finalText);
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
    } finally {
      setIsTranscribing(false);
    }
  }

  async function handleCancelRecording() {
    setIsRecording(false);
    await recorder.stop();
  }

  function handleReact(messageId: string, reaction: Reaction) {
    const current = ensureChatSession(localId.current, { messages: [], title: null });
    const updatedMessages = current.messages.map((message) =>
      message.id === messageId ? { ...message, reaction } : message,
    );
    updateChatSession(localId.current, { messages: updatedMessages });
    saveStoredConversation({
      id: localId.current,
      title: current.title ?? t('chatNewChatTitle'),
      messages: updatedMessages,
      updatedAt: Date.now(),
    });
    if (current.serverConversationId) {
      void setMessageReaction(current.serverConversationId, messageId, reaction).catch((error) => {
        console.error('Failed to save reaction:', error);
      });
    }
  }

  function handleToggleSpeak(messageId: string, text: string) {
    if (!Speech) return;
    if (speakingMessageId === messageId) {
      Speech.stop();
      setSpeakingMessageId(null);
      return;
    }
    Speech.stop();
    setSpeakingMessageId(messageId);
    Speech.speak(text, {
      language: locale === 'fr' ? 'fr-FR' : 'en-US',
      onDone: () => setSpeakingMessageId(null),
      onStopped: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  }

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble
        message={item}
        isEditing={editingMessageId === item.id}
        editDraft={editDraft}
        onChangeEditDraft={setEditDraft}
        onConfirmEdit={handleConfirmEdit}
        onCancelEdit={handleCancelEdit}
        editInputRef={editInputRef}
        canLongPress={!sending}
        onLongPress={(y) => setPopoverFor({ id: item.id, y, canEdit: item.from === 'me' && item.id === lastUserMessageId })}
        reaction={item.reaction ?? null}
        onReact={(reaction) => handleReact(item.id, reaction)}
        isSpeaking={speakingMessageId === item.id}
        onToggleSpeak={() => handleToggleSpeak(item.id, item.text)}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingMessageId, editDraft, lastUserMessageId, sending, speakingMessageId],
  );

  function handleCopyMessage() {
    const message = messages.find((item) => item.id === popoverFor?.id);
    setPopoverFor(null);
    if (!message) return;
    void Clipboard.setStringAsync(message.text);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 1600);
  }

  function handleStartEdit() {
    const message = messages.find((item) => item.id === popoverFor?.id);
    setPopoverFor(null);
    if (!message) return;
    setEditDraft(message.text);
    setEditingMessageId(message.id);
  }

  function handleCancelEdit() {
    setEditingMessageId(null);
    setEditDraft('');
  }

  async function handleConfirmEdit() {
    const text = editDraft.trim();
    const messageId = editingMessageId;
    setEditingMessageId(null);
    if (!text || !messageId) return;
    const current = ensureChatSession(localId.current, { messages: [], title: null });
    if (!current.serverConversationId) return;
    const index = current.messages.findIndex((item) => item.id === messageId);
    if (index < 0) return;
    const resolvedTitle = current.title ?? text;
    // Replace the prompt in place and drop its old reply - the regenerated
    // reply lands in that same spot rather than a new pair being appended.
    const messagesWithEdit = [...current.messages.slice(0, index), { ...current.messages[index], text }];
    const controller = new AbortController();
    updateChatSession(localId.current, {
      title: resolvedTitle,
      messages: messagesWithEdit,
      sending: true,
      abortController: controller,
    });
    saveStoredConversation({
      id: localId.current,
      title: resolvedTitle,
      messages: messagesWithEdit,
      updatedAt: Date.now(),
    });
    try {
      const result = await sendMessage(current.serverConversationId, text, controller.signal);
      const finalMessages = [...messagesWithEdit, result.reply];
      updateChatSession(localId.current, { messages: finalMessages, sending: false, abortController: null });
      saveStoredConversation({
        id: localId.current,
        title: resolvedTitle,
        messages: finalMessages,
        updatedAt: Date.now(),
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Failed to regenerate reply:', error);
        const withError = [
          ...messagesWithEdit,
          { id: `${Date.now()}-error`, from: 'bot' as const, text: t('chatServerError') },
        ];
        updateChatSession(localId.current, { messages: withError, sending: false, abortController: null });
        saveStoredConversation({
          id: localId.current,
          title: resolvedTitle,
          messages: withError,
          updatedAt: Date.now(),
        });
      } else {
        updateChatSession(localId.current, { sending: false, abortController: null });
      }
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.chatCard}>
        <View style={styles.messagesArea}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(message) => message.id}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.messages,
              {
                paddingTop: headerHeight + Spacing.six,
                paddingBottom:
                  inputBarHeight +
                  Spacing.three +
                  keyboardHeight +
                  (sending ? stopButtonHeight + Spacing.three : 0),
              },
            ]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={8}
            windowSize={9}
            initialNumToRender={12}
            // Without this, resizing an off-screen (or partially visible)
            // bubble - e.g. expanding "Voir plus" - shifts the scroll offset
            // under the user instead of keeping whatever they're looking at
            // pinned in place.
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onScrollToIndexFailed={({ index }) => {
              flatListRef.current?.scrollToOffset({ offset: index * 80, animated: true });
              setTimeout(() => scrollToEditingMessage(), 120);
            }}
            onContentSizeChange={() => {
              // Editing an existing message grows/shrinks its multiline
              // input as the user types, which would otherwise re-fire
              // this and yank the view back to the bottom mid-edit. Also
              // only while a reply is actively streaming in - otherwise
              // expanding a "Voir plus" message anywhere in the list (which
              // also changes total content size) would yank the view down
              // to the bottom too.
              if (editingMessageIdRef.current) return;
              if (!sending) return;
              scrollToEndRobust();
            }}
            ListFooterComponent={
              sending && !showIntroLogo ? (
                <Animated.View entering={FadeInUp.duration(220)} style={styles.botMessageBlock}>
                  <View style={styles.botLabelRow}>
                    <View style={styles.botLabelLogoBadge}>
                      <Image
                        source={require('@/assets/images/flower_only_1024.png')}
                        style={styles.botLabelLogo}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.botLabel}>ChaTin</Text>
                  </View>
                  <View style={styles.loadingBubble}>
                    <View style={styles.loadingFlowerBadge}>
                      <SpinningFlower size={16} />
                    </View>
                    <LoadingStatusText style={styles.loadingStatusText} />
                  </View>
                </Animated.View>
              ) : null
            }
          />

          <View style={[styles.topFade, { height: headerHeight + Spacing.two }]} pointerEvents="none" />

          <View
            style={[
              styles.bottomFade,
              {
                height:
                  inputBarHeight +
                  Spacing.six +
                  keyboardHeight +
                  (sending ? stopButtonHeight + Spacing.three : 0),
              },
            ]}
            pointerEvents="none"
          />

          {showIntroLogo && (
            <Animated.View
              style={[styles.introOverlay, { bottom: inputBarHeight + keyboardHeight }, heroWrapperStyle]}
              pointerEvents="none">
              <View style={styles.heroRow}>
                <Animated.View style={[styles.emptyLogoBadge, heroBadgeStyle]}>
                  <OutlinedFlower size={88} spin={heroSpinning} />
                </Animated.View>
                {heroSpinning && <LoadingStatusText style={styles.loadingStatusText} />}
              </View>
            </Animated.View>
          )}

          {showCopiedToast && (
            <Animated.View
              entering={FadeInUp.duration(180)}
              exiting={FadeOut.duration(180)}
              style={styles.copiedToast}
              pointerEvents="none">
              <Text style={styles.copiedToastText}>{t('chatMessageCopied')}</Text>
            </Animated.View>
          )}

          {sending && (
            <Animated.View
              entering={FadeInUp.duration(200)}
              onLayout={(event) => setStopButtonHeight(event.nativeEvent.layout.height)}
              style={[
                styles.stopButtonFloating,
                { bottom: inputBarHeight + Spacing.three + keyboardHeight },
              ]}>
              <AnimatedPressable onPress={handleStopGenerating} style={styles.stopButton}>
                <View style={styles.stopDot} />
                <Text style={styles.stopButtonText}>{t('chatStopGenerating')}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>

        <View
          style={[styles.inputBarOverlay, { bottom: keyboardHeight }]}
          onLayout={(event) => setInputBarHeight(event.nativeEvent.layout.height)}>
          <ChatInputBar
            draft={draft}
            onChangeDraft={setDraft}
            onSend={handleSend}
            bottomPadding={insets.bottom}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onCancelRecording={handleCancelRecording}
            attachedFile={attachedFile}
            onAttach={handleAttach}
            onRemoveAttachment={handleRemoveAttachment}
          />
        </View>

        <View style={styles.headerOverlay} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.replace('/home')}
              style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.iconButton}>
                <SymbolView
                  tintColor={colors.text}
                  name={{ ios: 'line.3.horizontal.decrease', android: 'sort', web: 'sort' }}
                  size={18}
                />
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/chat')}
              style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.iconButton}>
                <SymbolView
                  tintColor={colors.text}
                  name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
                  size={18}
                />
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <MessageActionPopover
        anchor={popoverFor}
        showEdit={popoverFor?.canEdit ?? false}
        onModify={handleStartEdit}
        onCopy={handleCopyMessage}
        onDismiss={() => setPopoverFor(null)}
      />

      <AppDialog
        visible={showMicPermissionDialog}
        title={t('chatMicPermissionTitle')}
        message={t('chatMicPermissionMessage')}
        primaryAction={{ label: t('settingsOk'), onPress: () => setShowMicPermissionDialog(false) }}
        onRequestClose={() => setShowMicPermissionDialog(false)}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: Spacing.five,
    borderTopRightRadius: Spacing.five,
    overflow: 'hidden',
  },
  introOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inputBarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  emptyLogoBadge: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four + Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  // Full width, unlike the "mine" bubble - ChatGPT-style: the assistant's
  // answer isn't boxed in a bubble, so tables/code/charts get the whole row
  // to work with instead of being squeezed into an 85%-wide card.
  botMessageBlock: {
    alignSelf: 'stretch',
    gap: Spacing.one,
  },
  botLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  // The flower mark's petals are mostly cream - legible on the always-dark
  // chat before theming, but they'd vanish on a light background, so it
  // always sits on its own small fixed-dark chip regardless of theme.
  botLabelLogoBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.iconChipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botLabelLogo: {
    width: 13,
    height: 13,
  },
  botLabel: {
    color: Brand.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  messagesArea: {
    flex: 1,
    position: 'relative',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Spacing.five + Spacing.two,
    borderTopLeftRadius: Spacing.five,
    borderTopRightRadius: Spacing.five,
    experimental_backgroundImage: `linear-gradient(180deg, ${colors.topFadeRgba} 0%, transparent 100%)`,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage: `linear-gradient(0deg, ${colors.background} 40%, transparent)`,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: colors.bubbleOtherBackground,
    borderRadius: Spacing.five,
    padding: Spacing.three,
  },
  loadingFlowerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.iconChipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingStatusText: {
    color: Brand.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  stopButtonFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.two,
    alignItems: 'center',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Brand.yellow,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.ink,
  },
  stopButtonText: {
    color: Brand.ink,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  meMessageBlock: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '85%',
    gap: Spacing.one,
  },
  meBubble: {
    backgroundColor: colors.bubbleMineBackground,
    borderRadius: Spacing.five,
    padding: Spacing.three,
  },
  meText: {
    color: colors.bubbleMineText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.semiBold,
  },
  meShowMoreText: {
    color: colors.bubbleMineText,
    opacity: 0.7,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: Spacing.one,
    textDecorationLine: 'underline',
  },
  meFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  meAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meAvatarEmoji: {
    fontSize: 11,
  },
  meLabel: {
    color: Brand.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  // Compact by default: attach/send stay as separate small circles either
  // side of a slim pill, same as before the "wide" treatment existed. Once
  // the message wraps to more than one line, the animated styles built from
  // expandProgress (see ChatInputBar) ease this into one wide, shadowed
  // ChatGPT-style card instead - shadowColor/Offset stay static here since
  // only the opacity/radius/elevation actually animate.
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    // Fixed, not part of the compact/expand animation - see the comment on
    // containerAnimatedStyle in ChatInputBar for why these must stay put.
    paddingHorizontal: Spacing.one,
    gap: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  },
  // A fixed, moderate radius (not the 999 "fully round pill" every other
  // fixed-height pill in this file uses) - that only reads as a pill at
  // this one height; once the field grows with a multiline message it'd
  // turn into a warped capsule instead of a normal rounded text box.
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  sendButton: {
    // Fixed width, not part of the compact/expand animation - only its
    // height/radius animate. See containerAnimatedStyle's comment.
    width: 44,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fixed 48px size for the recording-mode checkmark, which doesn't
  // participate in the compact/expand animation.
  sendButtonSize: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  // Sizing/radius/background live on attachAnimatedStyle; attachButtonFill
  // stretches the touchable Pressable to fill that animated box and centers
  // the icon inside it.
  attachButtonSizer: {
    // Fixed width, not part of the compact/expand animation - only its
    // height/radius/background animate. See containerAnimatedStyle's comment.
    width: 42,
    overflow: 'hidden',
  },
  attachButtonFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentChipRow: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  attachmentChipText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  // Sits inside the "mine" bubble, which itself inverts with the theme -
  // fixed to the light surface/ink pair so it stays legible either way,
  // and matches dark mode's already-shipped look exactly (a light chip on
  // the always-white "mine" bubble).
  messageAttachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    backgroundColor: lightColors.surface,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    marginBottom: Spacing.one,
  },
  messageAttachmentText: {
    color: Brand.ink,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.red,
  },
  recordingText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  recordingCancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  copiedToast: {
    position: 'absolute',
    top: Spacing.four,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  copiedToastText: {
    backgroundColor: Brand.ink,
    color: Brand.white,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    overflow: 'hidden',
  },
  // Fixed to the light surface regardless of theme - matches dark mode's
  // already-shipped look (a light context menu over the dark chat) exactly,
  // and stays visually separated from a light page via its own shadow.
  popover: {
    position: 'absolute',
    minWidth: 150,
    backgroundColor: lightColors.background,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.half,
    shadowColor: Brand.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  popoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  popoverRowText: {
    color: Brand.ink,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  popoverDivider: {
    height: 1,
    backgroundColor: lightColors.surface,
    marginHorizontal: Spacing.two,
  },
  meEditInput: {
    color: colors.bubbleMineText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.semiBold,
    minWidth: 120,
    padding: 0,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  editActionButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: lightColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionButtonPrimary: {
    backgroundColor: Brand.green,
  },
  });
}
