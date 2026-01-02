
import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

class ChatGRCService {
  /**
   * Always create a fresh instance for Vercel environment.
   */
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

    // Using gemini-3-flash-preview for the latest features on Vercel
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: geminiHistory,
      config: {
        systemInstruction: (customInstructions ? `${systemPrompt}\n\nUSER CUSTOM INSTRUCTIONS:\n${customInstructions}` : systemPrompt),
        temperature: 0.3,
        topP: 0.9
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

      const result = await chat.sendMessageStream({ message: parts.length === 1 ? parts[0].text : parts });
      
      let fullText = "";
      
      for await (const chunk of result) {
        if (chunk.candidates?.[0]?.finishReason === 'SAFETY') {
          onChunk?.("\n\n(معذرت! اس مواد کو حفاظتی وجوہات کی بنا پر بلاک کر دیا گیا ہے۔)");
          break;
        }

        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk?.(fullText);
        }
      }
      return fullText;
    } catch (error: any) {
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

  resetChat() {}
}

export const chatGRC = new ChatGRCService();
