
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, LiveServerMessage } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

class ChatGRCService {
  private chatInstance: Chat | null = null;
  private currentModel: string | null = null;
  private imageModel = 'gemini-2.5-flash-image';

  private initializeChat(model: string, history: any[] = [], customInstructions?: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        { text: msg.content },
        ...(msg.attachments || []).map((a: any) => ({
          inlineData: {
            data: a.data.split(',')[1],
            mimeType: a.mimeType
          }
        }))
      ]
    }));

    this.currentModel = model;
    this.chatInstance = ai.chats.create({
      model: model,
      history: geminiHistory,
      config: {
        systemInstruction: (customInstructions ? `${SYSTEM_PROMPT}\n\nUSER CUSTOM INSTRUCTIONS:\n${customInstructions}` : SYSTEM_PROMPT),
        temperature: 0.35,
        topP: 0.9,
        tools: [{ googleSearch: {} }],
        thinkingConfig: model.includes('pro') ? { thinkingBudget: 8000 } : undefined
      }
    });
  }

  async sendMessageStream(
    message: string, 
    model: string,
    history: any[] = [], 
    attachments: any[] = [],
    customInstructions?: string,
    onChunk?: (text: string, sources?: any[]) => void
  ) {
    if (this.currentModel !== model) {
      this.resetChat();
    }

    if (!this.chatInstance) {
      this.initializeChat(model, history.slice(0, -1), customInstructions);
    }

    try {
      const parts: any[] = [{ text: message }];
      attachments.forEach(att => {
        parts.push({
          inlineData: { data: att.data.split(',')[1], mimeType: att.mimeType }
        });
      });

      const responseStream = await this.chatInstance!.sendMessageStream({ message: { parts: parts } });
      let fullText = "";
      let allSources: any[] = [];
      
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
          const normalized = chunks
            .filter((c: any) => c.web?.uri)
            .map((c: any) => ({ title: c.web.title || 'ذریعہ', uri: c.web.uri }));
          
          if (normalized.length > 0) {
            const sourceMap = new Map();
            [...allSources, ...normalized].forEach(s => sourceMap.set(s.uri, s));
            allSources = Array.from(sourceMap.values());
          }
        }
        if (text) {
          fullText += text;
          onChunk?.(fullText, allSources.length > 0 ? allSources : undefined);
        }
      }
      return fullText;
    } catch (error) {
      console.error("Chat GRC Stream Error:", error);
      this.resetChat();
      throw error;
    }
  }

  async textToSpeech(text: string, voiceName: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      return null;
    }
  }

  async connectLive(options: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { callbacks, voiceName } = options;
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => console.log("Chat GRC Live Connected"),
        onmessage: async (message: LiveServerMessage) => {
          const part = message.serverContent?.modelTurn?.parts?.[0];
          if (part?.inlineData?.data) callbacks.onAudio(part.inlineData.data);
          if (message.serverContent?.outputTranscription) callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
          if (message.serverContent?.inputTranscription) callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
          if (message.serverContent?.turnComplete) callbacks.onTurnComplete();
          if (message.serverContent?.interrupted) callbacks.onInterrupted();
        },
        onerror: () => callbacks.onClose(),
        onclose: () => callbacks.onClose()
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_PROMPT,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });
  }

  resetChat() {
    this.chatInstance = null;
    this.currentModel = null;
  }
}

export const chatGRC = new ChatGRCService();
