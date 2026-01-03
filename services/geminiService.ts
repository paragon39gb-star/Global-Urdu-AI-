
import { GoogleGenAI, Modality, Part, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { PresentationData } from "../types";

class ChatGRCService {
  private getAI() {
    // Strictly using process.env.API_KEY as per core requirements
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getUpdatedSystemPrompt() {
    const now = new Date();
    const gregDate = new Intl.DateTimeFormat('ur-PK', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(now);
    
    return `${SYSTEM_PROMPT}\n\nموجودہ تاریخ: ${gregDate}`;
  }

  async generateTitle(firstMessage: string) {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a 3-word Urdu title for a scholarly research chat starting with: ${firstMessage}. Keep it formal.`,
      });
      return response.text?.trim() || "نئی تحقیق";
    } catch (e) {
      return "تحقیق";
    }
  }

  async sendMessageStream(
    message: string, 
    model: string = 'gemini-3-flash-preview',
    history: any[] = [], 
    attachments: any[] = [],
    customInstructions?: string,
    onChunk?: (text: string, sources?: any[], presentation?: PresentationData) => void
  ) {
    const ai = this.getAI();
    const systemPrompt = this.getUpdatedSystemPrompt();
    
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
      model: model, 
      history: geminiHistory,
      config: {
        systemInstruction: (customInstructions ? `${systemPrompt}\n\n${customInstructions}` : systemPrompt),
        temperature: 0.1, // Minimum temperature for scholarly precision
        tools: [{ googleSearch: {} }]
      }
    });

    try {
      const parts: Part[] = [{ text: message }];
      attachments.forEach(att => {
        parts.push({
          inlineData: { 
            data: att.data.split(',')[1], 
            mimeType: att.mimeType 
          }
        });
      });

      const result = await chat.sendMessageStream({ message: parts.length === 1 ? (parts[0] as any).text : parts });
      
      let fullText = "";
      let groundingSources: any[] = [];
      
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          
          let presentation: PresentationData | undefined;
          if (fullText.includes('{"presentation":')) {
            try {
              const startIdx = fullText.indexOf('{"presentation":');
              const endIdx = fullText.lastIndexOf('}') + 1;
              if (endIdx > startIdx) {
                const jsonStr = fullText.substring(startIdx, endIdx);
                const parsed = JSON.parse(jsonStr);
                presentation = parsed.presentation;
              }
            } catch (e) {}
          }

          const candidate = (chunk as any).candidates?.[0];
          if (candidate?.groundingMetadata?.groundingChunks) {
            groundingSources = candidate.groundingMetadata.groundingChunks
              .map((c: any) => c.web)
              .filter(Boolean);
          }

          onChunk?.(fullText, groundingSources, presentation);
        }
      }
      return fullText;
    } catch (error: any) {
      console.error("Scholarly Engine Error:", error);
      throw error;
    }
  }

  async generateSuggestions(history: any[]) {
    const ai = this.getAI();
    try {
      const lastMsg = history[history.length - 1]?.content || "";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this research context, suggest 3 follow-up scholarly questions in Urdu for a deep-dive. History: ${lastMsg}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      return [];
    }
  }

  async textToSpeech(text: string, voiceName: string) {
    const ai = this.getAI();
    try {
      const cleanText = text.replace(/[*#_`]/g, '').slice(0, 1000);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `اردو میں پڑھیں: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) { return null; }
  }
}

export const chatGRC = new ChatGRCService();
