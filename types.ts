export enum Role {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  groundingUrls?: { uri: string; title: string }[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}