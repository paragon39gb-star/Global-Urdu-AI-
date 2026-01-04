
export interface Attachment {
  data: string;
  mimeType: string;
  name: string;
  previewUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatar: string;
  persona: string;
  description: string;
}

export interface PresentationStation {
  id: string | number;
  title: string;
  arabic?: string;
  urdu: string;
  points: string[];
  color?: string;
}

export interface PresentationData {
  title: string;
  theme: string;
  stations: PresentationStation[];
  conclusion: string;
  formula: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  suggestions?: string[];
  isError?: boolean;
  presentation?: PresentationData;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  contactId?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface UserSettings {
  fontSize: number;
  fontFamily: 'naskh' | 'nastaleeq' | 'sans' | 'noto-nastaliq';
  highContrast: boolean;
  voiceName: 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck';
  currentUser: User | null;
  voicePitch: number;
  voiceSpeed: number;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
