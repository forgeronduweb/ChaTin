export type ChatMessage = {
  id: string;
  from: 'me' | 'bot';
  text: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
};

const conversations = new Map<string, Conversation>();

export function createConversation(title: string, initialMessages: ChatMessage[] = []): Conversation {
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title,
    messages: initialMessages,
    createdAt: Date.now(),
  };
  conversations.set(conversation.id, conversation);
  return conversation;
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

export function listConversations(): Conversation[] {
  return [...conversations.values()].sort((a, b) => b.createdAt - a.createdAt);
}
