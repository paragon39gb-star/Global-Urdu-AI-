
import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

class ChatGRCService {
  /**
   * Creates a fresh instance of GoogleGenAI for every request.
   * This ensures the app always uses the most up-to-date API_KEY from process.env.
   */
  private getAI() {
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

  // Use gemini-3-flash-preview for basic text tasks like title generation.
  async generateTitle(firstMessage: string) {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this first message and generate a very short scholarly title in Urdu (max 4 words). Message: ${firstMessage}`,
      });
      return response.text?.trim().replace(/[۔،!؟]/g, '') || firstMessage.slice(0, 30);
    } catch (e) {
      return firstMessage.slice(0, 30);
    }
  }

  // Use the provided model parameter and gemini-3-flash-preview for default chat tasks.
  async sendMessageStream(
    message: string, 
    model: string,
    history: any[] = [], 
    attachments: any[] = [],
    customInstructions?: string,
    onChunk?: (text: string, sources?: any[]) => void
  ) {
    const ai = this.getAI();
    const systemPrompt = this.getUpdatedSystemPrompt();
    
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
      model: model || 'gemini-3-flash-preview',
      history: geminiHistory,
      config: {
        systemInstruction: (customInstructions ? `${systemPrompt}\n\nUSER CUSTOM INSTRUCTIONS:\n${customInstructions}` : systemPrompt),
        temperature: 0.3,
        topP: 0.95,
        tools: [{ googleSearch: {} }] // Enabling Google Search for real-time news and info
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
      let allSources: any[] = [];
      
      for await (const chunk of result) {
        if (chunk.candidates?.[0]?.finishReason === 'SAFETY') {
          onChunk?.("\n\n(معذرت! اس مواد کو حفاظتی وجوہات کی بنا پر بلاک کر دیا گیا ہے۔)");
          break;
        }

        // Handle grounding metadata for search citations
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
            const chunks = groundingMetadata.groundingChunks;
            const newSources = chunks
                .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
                .filter((s: any) => s !== null);
            
            // Avoid duplicate sources
            newSources.forEach((ns: any) => {
                if (!allSources.find(as => as.uri === ns.uri)) {
                    allSources.push(ns);
                }
            });
        }

        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk?.(fullText, allSources.length > 0 ? allSources : undefined);
        }
      }
      return fullText;
    } catch (error: any) {
      console.error("Chat Error:", error);
      throw error;
    }
  }

  // Use gemini-3-flash-preview for suggestion generation.
  async generateSuggestions(history: any[]) {
    const ai = this.getAI();
    try {
      const lastMessage = history[history.length - 1]?.content || "";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest 3 extremely short relevant follow-up questions in Urdu. Last Message: ${lastMessage}`,
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

  // Text-to-speech tasks use gemini-2.5-flash-preview-tts.
  async textToSpeech(text: string, voiceName: string) {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `اردو میں پڑھیں: ${text}` }] }],
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
