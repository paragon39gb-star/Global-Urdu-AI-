
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
  suggestions?: string[]; // Added for Perplexity-like follow-ups
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  contactId?: string; // If this is a DM with a contact
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
