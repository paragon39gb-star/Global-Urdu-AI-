
import { GoogleGenAI, Modality, Part, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { PresentationData } from "../types";

class ChatGRCService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Enhanced Error Formatter for Urdu AI
   */
  private formatError(error: any): string {
    let rawMessage = "";
    let status = "";
    let errorCode = "";

    if (typeof error === 'string') {
      rawMessage = error;
    } else if (error && typeof error === 'object') {
      if (error.message) {
        rawMessage = typeof error.message === 'object' ? JSON.stringify(error.message) : String(error.message);
      } else {
        rawMessage = JSON.stringify(error);
      }
      status = String(error.status || error.response?.status || "");
      errorCode = String(error.code || "");
    } else {
      rawMessage = String(error);
    }

    if (rawMessage.includes('{')) {
      try {
        const startIdx = rawMessage.indexOf('{');
        const endIdx = rawMessage.lastIndexOf('}') + 1;
        const potentialJson = rawMessage.substring(startIdx, endIdx);
        const parsed = JSON.parse(potentialJson);
        if (parsed.error) {
          rawMessage = parsed.error.message || rawMessage;
          status = parsed.error.status || String(parsed.error.code) || status;
          errorCode = String(parsed.error.code) || errorCode;
        }
      } catch (e) {}
    }

    console.error(`Urdu AI Engine Critical Error Log - Message: ${rawMessage}`);
    console.error(`Urdu AI Engine Critical Error Log - Status: ${status}`);
    console.error(`Urdu AI Engine Critical Error Log - Code: ${errorCode}`);

    const msg = rawMessage.toLowerCase();
    const statusUpper = status.toUpperCase();

    if (
      statusUpper === "RESOURCE_EXHAUSTED" || 
      statusUpper === "429" || 
      errorCode === "429" ||
      msg.includes("429") || 
      msg.includes("quota") ||
      msg.includes("limit")
    ) {
      return "علمی انجن (Gemini 2.5 Flash) اس وقت زیادہ بوجھ کی وجہ سے عارضی طور پر مصروف ہے۔ براہ کرم 'دوبارہ کوشش کریں' پر کلک کریں تاکہ آپ کی تحقیق فوری جاری رہ سکے۔";
    }

    if (statusUpper === "PERMISSION_DENIED" || statusUpper === "403" || msg.includes("api key not valid")) {
      return "سیکیورٹی انجن نے رسائی روک دی ہے۔ براہ کرم اپنی API Key کی درستگی چیک کریں۔";
    }

    if (msg.includes("safety") || msg.includes("blocked") || msg.includes("finishreason: safety")) {
      return "معذرت! یہ سوال علمی و اخلاقی حفاظتی اصولوں کی وجہ سے روکا گیا ہے۔ براہ کرم الفاظ تبدیل کر کے دوبارہ کوشش کریں۔";
    }

    return "معذرت! اس وقت علمی انجن سے رابطہ ممکن نہیں ہو سکا۔ براہ کرم دوبارہ کوشش فرمائیں۔";
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
        model: 'gemini-2.5-flash',
        contents: `Generate a 3-word Urdu title for a scholarly research chat: ${firstMessage}. Keep it formal.`,
      });
      return response.text?.trim() || "نئی تحقیق";
    } catch (e) {
      return "تحقیق";
    }
  }

  async sendMessageStream(
    message: string, 
    model: string = 'gemini-2.5-flash', 
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
      model: 'gemini-2.5-flash', 
      history: geminiHistory,
      config: {
        systemInstruction: (customInstructions ? `${systemPrompt}\n\n${customInstructions}` : systemPrompt),
        temperature: 0.1,
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
      const formattedMessage = this.formatError(error);
      throw new Error(formattedMessage);
    }
  }

  async generateSuggestions(history: any[]) {
    const ai = this.getAI();
    try {
      const lastMsg = history[history.length - 1]?.content || "";
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Suggest 3 follow-up questions in Urdu for: ${lastMsg}`,
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
