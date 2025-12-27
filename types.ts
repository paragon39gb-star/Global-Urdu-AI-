
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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  suggestions?: string[];
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
  fontFamily: 'naskh' | 'nastaleeq' | 'sans';
  highContrast: boolean;
  voiceName: 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck';
  currentUser: User | null;
  voicePitch: number;
  voiceSpeed: number;
}

export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Fixed: All declarations of 'aistudio' must have identical modifiers. 
    // Making it optional to match potential existing global declarations in the environment and resolve type mismatch.
    aistudio?: AIStudio;
  }
}