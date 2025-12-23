
export interface Attachment {
  data: string;
  mimeType: string;
  name: string;
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  sources?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface UserSettings {
  fontSize: 'normal' | 'large';
  fontFamily: 'nastaleeq' | 'sans';
  highContrast: boolean;
  voiceName: 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck';
}
