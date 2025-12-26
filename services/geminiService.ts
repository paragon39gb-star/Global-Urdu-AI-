
import { GoogleGenAI, Chat, Modality, LiveServerMessage, Part, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

class ChatGRCService {
  private chatInstance: Chat | null = null;
  private currentModel: string | null = null;

  private initializeChat(model: string, history: any[] = [], customInstructions?: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const now = new Date();
    const gregOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateStr = new Intl.DateTimeFormat('ur-PK', gregOptions).format(now);
    
    let hijriStr = "";
    try {
      hijriStr = new Intl.DateTimeFormat('ur-PK-u-ca-islamic-uma-nu-latn', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(now);
    } catch (e) {
      hijriStr = "ہجری تاریخ دستیاب نہیں";
    }

    const timeStr = new Intl.DateTimeFormat('ur-PK', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    }).format(now);

    const dateContext = `موجودہ عیسوی تاریخ: ${dateStr}\nموجودہ ہجری تاریخ: ${hijriStr}\nوقت: ${timeStr}`;
    const updatedSystemPrompt = `${SYSTEM_PROMPT}\n\n[CONTEXT_UPDATE]\n${dateContext}\n[/CONTEXT_UPDATE]`;

    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        { text: msg.content },
        ...(msg.attachments || []).map((a: any) => ({
          inlineData: {
            data: a.data.includes(',') ? a.data.split(',')[1] : a.data,
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
        systemInstruction: (customInstructions ? `${updatedSystemPrompt}\n\nUSER CUSTOM INSTRUCTIONS:\n${customInstructions}` : updatedSystemPrompt),
        temperature: 0.1,
        topP: 0.95,
        tools: [{ googleSearch: {} }]
      }
    });
  }

  async generateTitle(firstMessage: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this first message of a research chat and generate a very short, comprehensive, and scholarly title in Urdu (max 4-5 words). 
        Do not use punctuation.
        Message: ${firstMessage}`,
      });
      return response.text.trim().replace(/[۔،!؟]/g, '');
    } catch (e) {
      return firstMessage.slice(0, 30);
    }
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
      this.initializeChat(model, history, customInstructions);
    }

    try {
      const parts: Part[] = [{ text: message }];
      attachments.forEach(att => {
        parts.push({
          inlineData: { 
            data: att.data.includes(',') ? att.data.split(',')[1] : att.data, 
            mimeType: att.mimeType 
          }
        });
      });

      const responseStream = await this.chatInstance!.sendMessageStream({ message: parts });
      let fullText = "";
      let allSources: any[] = [];
      
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
          const normalized = chunks
            .filter((c: any) => c.web?.uri)
            .map((c: any) => ({ title: c.web?.title || 'ذریعہ', uri: c.web?.uri }));
          
          if (normalized.length > 0) {
            const sourceMap = new Map();
            [...allSources, ...normalized].forEach(s => { if(s.uri) sourceMap.set(s.uri, s); });
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

  async generateSuggestions(history: any[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const lastMessage = history[history.length - 1]?.content || "";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following last message from a conversation about research/Islam/history, suggest 3 extremely short and relevant follow-up questions in Urdu that a user might want to ask. 
        Return ONLY a JSON array of strings. 
        Example: ["مزید وضاحت کریں", "اس کا حوالہ کیا ہے؟", "تاریخی پس منظر کیا ہے؟"]
        Last Message: ${lastMessage}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Suggestions Generation Error:", error);
      return [];
    }
  }

  async textToSpeech(text: string, voiceName: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `اردو میں شستہ اور باوقار لہجے میں پڑھیں: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS Error:", error);
      return null;
    }
  }

  async connectLive(options: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { callbacks, voiceName } = options;
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => console.log("Live Connected"),
        onmessage: async (message: LiveServerMessage) => {
          const part = message.serverContent?.modelTurn?.parts?.[0];
          if (part?.inlineData?.data) callbacks.onAudio(part.inlineData.data);
          if (message.serverContent?.outputTranscription) callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
          if (message.serverContent?.inputTranscription) callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
          if (message.serverContent?.turnComplete) callbacks.onTurnComplete();
          if (message.serverContent?.interrupted) callbacks.onInterrupted();
        },
        onerror: (e) => callbacks.onClose(),
        onclose: () => callbacks.onClose()
      },
      config: {
        responseModalalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_PROMPT + "\n\nصارف سے شستہ اردو میں بات کریں اور مختصر و جامع جواب دیں۔",
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
