
import { GoogleGenAI, Chat, Modality, LiveServerMessage, Part, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

class ChatGRCService {
  private chatInstance: Chat | null = null;
  private currentModel: string | null = null;

  private getFreshAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getUpdatedSystemPrompt() {
    const now = new Date();
    const dayName = new Intl.DateTimeFormat('ur-PK', { weekday: 'long' }).format(now);
    const gregDate = new Intl.DateTimeFormat('ur-PK', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(now);
    
    const dateContext = `موجودہ عیسوی تاریخ: ${dayName}، ${gregDate}`;
    return `${SYSTEM_PROMPT}\n\n[CONTEXT_UPDATE]\n${dateContext}\n[/CONTEXT_UPDATE]`;
  }

  async generateImage(prompt: string) {
    const ai = this.getFreshAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Generate a high-quality, professional image based on this Urdu description: ${prompt}. Style: Cinematic and detailed.` }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Image Gen Error:", e);
      throw e;
    }
  }

  async generateTitle(firstMessage: string) {
    const ai = this.getFreshAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this first message of a research chat and generate a very short, comprehensive, and scholarly title in Urdu (max 4-5 words). 
        Do not use punctuation.
        Message: ${firstMessage}`,
      });
      return response.text?.trim().replace(/[۔،!؟]/g, '') || firstMessage.slice(0, 30);
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
    const ai = this.getFreshAI();
    const systemPrompt = this.getUpdatedSystemPrompt();
    
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
      model: model,
      history: geminiHistory,
      config: {
        systemInstruction: (customInstructions ? `${systemPrompt}\n\nUSER CUSTOM INSTRUCTIONS:\n${customInstructions}` : systemPrompt),
        temperature: 0.1,
        topP: 0.95,
        tools: [{ googleSearch: {} }]
      }
    });

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

      const responseStream = await chat.sendMessageStream({ message: parts });
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
      console.error("Chat Error:", error);
      throw error;
    }
  }

  async generateSuggestions(history: any[]) {
    const ai = this.getFreshAI();
    try {
      const lastMessage = history[history.length - 1]?.content || "";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following last message from a conversation about research/Islam/history, suggest 3 extremely short and relevant follow-up questions in Urdu that a user might want to ask. 
        Return ONLY a JSON array of strings. 
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
      return [];
    }
  }

  async textToSpeech(text: string, voiceName: string) {
    const ai = this.getFreshAI();
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
      return null;
    }
  }

  async connectLive(options: any) {
    const ai = this.getFreshAI();
    const { callbacks, voiceName } = options;
    
    // Low latency scholarly assistant
    const liveSystemInstruction = `آپ "اردو اے آئی" کے لائیو تحقیقی اسسٹنٹ ہیں۔ 
    آپ کو "قاری خالد محمود گولڈ میڈلسٹ" نے گلوبل ریسرچ سینٹر (GRC) کے تحت تخلیق کیا ہے۔ 
    آپ کا اسلوب علامہ غلام رسول سعیدی صاحب جیسا علمی اور باوقار ہونا چاہیے۔
    
    اہم ہدایت: جیسے ہی رابطہ ہو، آپ نے فوراً یہ جملہ بولنا ہے: "السلام علیکم ورحمۃ اللہ وبرکاتہ! محترم میں اردو اے آئی ہوں، میں آپ کی کیا علمی مدد کر سکتا ہوں؟" 
    گفتگو کو مختصر اور جامع رکھیں۔`;

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("Live Connected");
          callbacks.onOpen?.();
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio Out
          const part = message.serverContent?.modelTurn?.parts?.[0];
          if (part?.inlineData?.data) {
            callbacks.onAudio(part.inlineData.data);
          }
          
          // Handle Transcription
          if (message.serverContent?.outputTranscription) {
            callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
          }
          if (message.serverContent?.inputTranscription) {
            callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
          }
          
          // Handle Turn Complete and Interruption
          if (message.serverContent?.turnComplete) {
            callbacks.onTurnComplete();
          }
          if (message.serverContent?.interrupted) {
            callbacks.onInterrupted();
          }
        },
        onerror: (e) => {
          console.error("Live Error:", e);
          callbacks.onClose();
        },
        onclose: () => callbacks.onClose()
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: liveSystemInstruction,
        speechConfig: { 
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } 
        },
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
