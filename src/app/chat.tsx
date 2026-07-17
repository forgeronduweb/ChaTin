import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GraphPaperBackground } from '@/components/graph-paper-background';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { type ChatMessage, createConversation, sendMessage } from '@/lib/api';
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
      <Pressable onPress={onSend} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}>
        <SymbolView
          tintColor={Brand.ink}
          name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
          size={18}
        />
      </Pressable>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id, title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const [stored] = useState(() => (id ? getStoredConversation(id) : undefined));
  const [messages, setMessages] = useState<ChatMessage[]>(stored?.messages ?? []);
  const [conversationTitle, setConversationTitle] = useState<string | null>(stored?.title ?? title ?? null);
  const [draft, setDraft] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sending, setSending] = useState(false);
  const conversationId = useRef<string | null>(null);
  const localId = useRef(stored?.id ?? id ?? createLocalConversationId());
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    createConversation(stored?.title ?? title, stored?.messages).then((conversation) => {
      if (cancelled) return;
      conversationId.current = conversation.id;
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
    if (!conversationId.current) return;
    const resolvedTitle = conversationTitle ?? text;
    if (!conversationTitle) setConversationTitle(resolvedTitle);
    setMessages((prev) => [...prev, { id: `${Date.now()}`, from: 'me', text }]);
    setSending(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const result = await sendMessage(conversationId.current, text, controller.signal);
      setMessages(result.messages);
      saveStoredConversation({
        id: localId.current,
        title: resolvedTitle,
        messages: result.messages,
        updatedAt: Date.now(),
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Failed to send message:', error);
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-error`, from: 'bot', text: t('chatServerError') },
        ]);
      }
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  }

  function handleSend() {
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    void submit(text);
  }

  function handleStopGenerating() {
    abortControllerRef.current?.abort();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerSection}>
        <GraphPaperBackground />

        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.push('/home')}
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

        <Text style={styles.title}>{conversationTitle ?? t('chatNewChatTitle')}</Text>
      </View>

      {hasMessages ? (
        <View style={styles.chatCard}>
          <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
            <View style={styles.messagesArea}>
              <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
                {messages.map((message) =>
                  message.from === 'bot' ? (
                    <View key={message.id} style={styles.botMessageBlock}>
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
                    </View>
                  ) : (
                    <View key={message.id} style={styles.meMessageBlock}>
                      <View style={styles.meBubble}>
                        <Text style={styles.meText}>{message.text}</Text>
                      </View>
                      <View style={styles.meFooter}>
                        <View style={styles.meAvatar}>
                          <Text style={styles.meAvatarEmoji}>🙂</Text>
                        </View>
                        <Text style={styles.meLabel}>Me</Text>
                      </View>
                    </View>
                  ),
                )}
                {sending && (
                  <View style={styles.botMessageBlock}>
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
                  </View>
                )}
              </ScrollView>

              {sending && (
                <View style={styles.stopButtonFloating}>
                  <Pressable
                    onPress={handleStopGenerating}
                    style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}>
                    <View style={styles.stopDot} />
                    <Text style={styles.stopButtonText}>{t('chatStopGenerating')}</Text>
                  </Pressable>
                </View>
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
              <Image
                source={require('@/assets/images/flower_only_1024.png')}
                style={styles.emptyLogo}
                resizeMode="contain"
              />
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
  emptyLogo: {
    width: 96,
    height: 96,
  },
  messages: {
    padding: Spacing.four,
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
});
