import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { createConversation, sendMessage } from '@/lib/api';
import { ensureChatSession, updateChatSession, useChatSession } from '@/lib/chat-session-store';
import { createLocalConversationId, getStoredConversation, saveStoredConversation } from '@/lib/conversations-store';
import { t } from '@/lib/i18n';

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

function ChatInputBar({
  draft,
  onChangeDraft,
  onSend,
  bottomPadding,
}: {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  bottomPadding: number;
}) {
  return (
    <View style={[styles.inputRow, { paddingBottom: Spacing.three + bottomPadding }]}>
      <TextInput
        value={draft}
        onChangeText={onChangeDraft}
        placeholder={t('chatPlaceholder')}
        placeholderTextColor={Brand.textMuted}
        style={styles.input}
        onSubmitEditing={onSend}
        returnKeyType="send"
      />
      <AnimatedPressable onPress={onSend} style={styles.sendButton}>
        <SymbolView
          tintColor={Brand.ink}
          name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
          size={18}
        />
      </AnimatedPressable>
    </View>
  );
}

function MessageActionPopover({
  anchor,
  onModify,
  onCopy,
  onDismiss,
}: {
  anchor: { y: number } | null;
  onModify: () => void;
  onCopy: () => void;
  onDismiss: () => void;
}) {
  if (!anchor) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <Animated.View
          entering={FadeInUp.duration(140)}
          style={[styles.popover, { top: anchor.y, right: Spacing.four }]}>
          <Pressable
            onPress={onModify}
            style={({ pressed }) => [styles.popoverRow, pressed && styles.pressed]}>
            <SymbolView tintColor={Brand.ink} name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={15} />
            <Text style={styles.popoverRowText}>{t('chatEditMessage')}</Text>
          </Pressable>
          <View style={styles.popoverDivider} />
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

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id, title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const [stored] = useState(() => (id ? getStoredConversation(id) : undefined));
  const [draft, setDraft] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const localId = useRef(stored?.id ?? id ?? createLocalConversationId());
  const scrollViewRef = useRef<ScrollView>(null);
  const session = useChatSession(localId.current, {
    messages: stored?.messages ?? [],
    title: stored?.title ?? title ?? null,
  });
  const { messages, sending } = session;
  const conversationTitle = session.title;
  const hasMessages = messages.length > 0;
  const [popoverFor, setPopoverFor] = useState<{ id: string; y: number } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const lastUserMessageId = [...messages].reverse().find((message) => message.from === 'me')?.id ?? null;
  const editInputRef = useRef<TextInput>(null);
  const messageLayoutY = useRef<Record<string, number>>({});
  const editingMessageIdRef = useRef<string | null>(null);

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
    const y = messageLayoutY.current[id];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - Spacing.three), animated: true });
    }
  }

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

  async function submit(text: string) {
    const current = ensureChatSession(localId.current, { messages: [], title: null });
    if (!current.serverConversationId) return;
    const resolvedTitle = current.title ?? text;
    const messagesWithUser = [...current.messages, { id: `${Date.now()}`, from: 'me' as const, text }];
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
      const result = await sendMessage(current.serverConversationId, text, controller.signal);
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
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    Keyboard.dismiss();
    void submit(text);
  }

  function handleStopGenerating() {
    session.abortController?.abort();
  }

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
      <View style={styles.headerSection}>
        <GraphPaperBackground />

        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.replace('/home')}
            style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.iconButton}>
              <SymbolView
                tintColor={Brand.white}
                name={{ ios: 'line.3.horizontal.decrease', android: 'sort', web: 'sort' }}
                size={18}
              />
            </View>
          </Pressable>

          <View style={styles.modelPill}>
            <Text style={styles.modelPillText}>Chatin 1.4</Text>
            <SymbolView
              tintColor={Brand.white}
              name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
              size={14}
            />
          </View>

          <Pressable
            onPress={() => router.replace('/chat')}
            style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.iconButton}>
              <SymbolView
                tintColor={Brand.white}
                name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
                size={18}
              />
            </View>
          </Pressable>
        </View>

        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {conversationTitle ?? t('chatNewChatTitle')}
        </Text>
      </View>

      {hasMessages ? (
        <View style={styles.chatCard}>
          <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
            <View style={styles.messagesArea}>
              <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.messages}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  // Editing an existing message grows/shrinks its multiline
                  // input as the user types, which would otherwise re-fire
                  // this and yank the view back to the bottom mid-edit.
                  if (editingMessageIdRef.current) return;
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }}>
                {messages.map((message) =>
                  message.from === 'bot' ? (
                    <Animated.View
                      key={message.id}
                      entering={FadeInUp.duration(260).springify().damping(18)}
                      style={styles.botMessageBlock}>
                      <View style={styles.botLabelRow}>
                        <Image
                          source={require('@/assets/images/flower_only_1024.png')}
                          style={styles.botLabelLogo}
                          resizeMode="contain"
                        />
                        <Text style={styles.botLabel}>ChaTin</Text>
                      </View>
                      <View style={styles.botBubble}>
                        <Text style={styles.botText}>{message.text}</Text>
                      </View>
                    </Animated.View>
                  ) : (
                    <Animated.View
                      key={message.id}
                      entering={FadeInUp.duration(220).springify().damping(18)}
                      style={styles.meMessageBlock}
                      onLayout={(event) => {
                        messageLayoutY.current[message.id] = event.nativeEvent.layout.y;
                      }}>
                      {editingMessageId === message.id ? (
                        <View style={styles.meBubble}>
                          <TextInput
                            ref={editInputRef}
                            value={editDraft}
                            onChangeText={setEditDraft}
                            style={styles.meEditInput}
                            multiline
                          />
                          <View style={styles.editActionsRow}>
                            <Pressable
                              onPress={handleCancelEdit}
                              style={({ pressed }) => [styles.editActionButton, pressed && styles.pressed]}>
                              <SymbolView
                                tintColor={Brand.textMuted}
                                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                                size={13}
                              />
                            </Pressable>
                            <Pressable
                              onPress={handleConfirmEdit}
                              style={({ pressed }) => [
                                styles.editActionButton,
                                styles.editActionButtonPrimary,
                                pressed && styles.pressed,
                              ]}>
                              <SymbolView
                                tintColor={Brand.white}
                                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                                size={13}
                              />
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Pressable
                          onLongPress={
                            message.id === lastUserMessageId && !sending
                              ? (event) => setPopoverFor({ id: message.id, y: event.nativeEvent.pageY })
                              : undefined
                          }
                          delayLongPress={350}>
                          <View style={styles.meBubble}>
                            <Text style={styles.meText}>{message.text}</Text>
                          </View>
                        </Pressable>
                      )}
                      <View style={styles.meFooter}>
                        <View style={styles.meAvatar}>
                          <Text style={styles.meAvatarEmoji}>🙂</Text>
                        </View>
                        <Text style={styles.meLabel}>Me</Text>
                      </View>
                    </Animated.View>
                  ),
                )}
                {sending && (
                  <Animated.View entering={FadeInUp.duration(220)} style={styles.botMessageBlock}>
                    <View style={styles.botLabelRow}>
                      <Image
                        source={require('@/assets/images/flower_only_1024.png')}
                        style={styles.botLabelLogo}
                        resizeMode="contain"
                      />
                      <Text style={styles.botLabel}>ChaTin</Text>
                    </View>
                    <View style={styles.loadingBubble}>
                      <SpinningFlower size={22} />
                    </View>
                  </Animated.View>
                )}
              </ScrollView>

              <View style={styles.topFade} pointerEvents="none" />

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
                <Animated.View entering={FadeInUp.duration(200)} style={styles.stopButtonFloating}>
                  <AnimatedPressable onPress={handleStopGenerating} style={styles.stopButton}>
                    <View style={styles.stopDot} />
                    <Text style={styles.stopButtonText}>{t('chatStopGenerating')}</Text>
                  </AnimatedPressable>
                </Animated.View>
              )}
            </View>

            <ChatInputBar
              draft={draft}
              onChangeDraft={setDraft}
              onSend={handleSend}
              bottomPadding={insets.bottom}
            />
          </View>
        </View>
      ) : (
        <View style={styles.emptyBody}>
          <GraphPaperBackground />

          <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
            <View style={styles.emptyCenter}>
              <View style={styles.emptyLogoBadge}>
                <Image
                  source={require('@/assets/images/flower_only_1024.png')}
                  style={styles.emptyLogo}
                  resizeMode="contain"
                />
              </View>
            </View>

            <ChatInputBar
              draft={draft}
              onChangeDraft={setDraft}
              onSend={handleSend}
              bottomPadding={insets.bottom}
            />
          </View>
        </View>
      )}

      <MessageActionPopover
        anchor={popoverFor}
        onModify={handleStartEdit}
        onCopy={handleCopyMessage}
        onDismiss={() => setPopoverFor(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.cream,
  },
  flex: {
    flex: 1,
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
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Brand.ink,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  modelPillText: {
    color: Brand.white,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  title: {
    color: Brand.ink,
    fontSize: 26,
    lineHeight: 32,
    fontFamily: Fonts.bold,
  },
  chatCard: {
    flex: 1,
    backgroundColor: Brand.chatBackground,
    borderTopLeftRadius: Spacing.five,
    borderTopRightRadius: Spacing.five,
    overflow: 'hidden',
  },
  emptyBody: {
    flex: 1,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLogoBadge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Brand.ink,
    borderWidth: 5,
    borderColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
    shadowColor: Brand.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  emptyLogo: {
    width: 88,
    height: 88,
    transform: [{ rotate: '5deg' }],
  },
  messages: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four + Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  botMessageBlock: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    gap: Spacing.one,
  },
  botLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  botLabelLogo: {
    width: 14,
    height: 14,
  },
  botLabel: {
    color: Brand.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  botBubble: {
    backgroundColor: Brand.chatBubble,
    borderRadius: Spacing.five,
    padding: Spacing.three,
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
    experimental_backgroundImage: `linear-gradient(180deg, ${Brand.chatBackground} 40%, transparent)`,
  },
  loadingBubble: {
    backgroundColor: Brand.chatBubble,
    borderRadius: Spacing.five,
    padding: Spacing.three,
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
  botText: {
    color: Brand.white,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  meMessageBlock: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '85%',
    gap: Spacing.one,
  },
  meBubble: {
    backgroundColor: Brand.white,
    borderRadius: Spacing.five,
    padding: Spacing.three,
  },
  meText: {
    color: Brand.ink,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.semiBold,
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
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  input: {
    flex: 1,
    backgroundColor: Brand.chatInput,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    color: Brand.white,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.green,
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
  popover: {
    position: 'absolute',
    minWidth: 150,
    backgroundColor: Brand.cream,
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
    backgroundColor: Brand.paper,
    marginHorizontal: Spacing.two,
  },
  meEditInput: {
    color: Brand.ink,
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
    backgroundColor: Brand.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionButtonPrimary: {
    backgroundColor: Brand.green,
  },
});
