
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, LiveServerMessage } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

// Helper to get fresh AI instance (required for Pro models to use latest selected key)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

class UrduAIService {
  private chatInstance: Chat | null = null;
  private imageModel = 'gemini-2.5-flash-image';

  private initializeChat(model: string, history: any[] = [], customInstructions?: string) {
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

    this.chatInstance = getAI().chats.create({
      model: model,
      history: geminiHistory,
      config: {
        systemInstruction: (customInstructions ? `${SYSTEM_PROMPT}\n\nUSER CUSTOM INSTRUCTIONS:\n${customInstructions}` : SYSTEM_PROMPT),
        temperature: 0.7,
        topP: 0.95,
        tools: [{ googleSearch: {} }]
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
    if (!this.chatInstance) {
      this.initializeChat(model, history.slice(0, -1), customInstructions);
    }

    try {
      const parts: any[] = [{ text: message }];
      
      attachments.forEach(att => {
        parts.push({
          inlineData: {
            data: att.data.split(',')[1],
            mimeType: att.mimeType
          }
        });
      });

      // Corrected parameter structure for sendMessageStream
      const responseStream = await this.chatInstance!.sendMessageStream({ 
        message: { parts: parts } 
      });
      
      let fullText = "";
      let allSources: any[] = [];
      
      for await (const chunk of responseStream) {
        const text = (chunk as GenerateContentResponse).text;
        
        // Improve grounding source extraction
        const candidates = (chunk as any).candidates;
        if (candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = candidates[0].groundingMetadata.groundingChunks;
          const normalized = chunks
            .filter((c: any) => c.web?.uri)
            .map((c: any) => ({
              title: c.web.title || 'Source',
              uri: c.web.uri
            }));
          
          // Use a Map to keep unique sources by URI
          const sourceMap = new Map();
          [...allSources, ...normalized].forEach(s => sourceMap.set(s.uri, s));
          allSources = Array.from(sourceMap.values());
        }

        if (text) {
          fullText += text;
          onChunk?.(fullText, allSources.length > 0 ? allSources : undefined);
        }
      }
      return fullText;
    } catch (error) {
      console.error("Gemini Stream Error:", error);
      this.resetChat();
      throw error;
    }
  }

  async generateImage(prompt: string, isPro: boolean = false) {
    // Pro models require checking for selected API key
    if (isPro && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Proceeding after dialog as per race condition guidelines
      }
    }

    const modelToUse = isPro ? 'gemini-3-pro-image-preview' : this.imageModel;
    
    try {
      const response = await getAI().models.generateContent({
        model: modelToUse,
        contents: { parts: [{ text: `High quality artistic image: ${prompt}. Professional Urdu style if applicable.` }] },
        config: { 
          imageConfig: { 
            aspectRatio: "1:1",
            imageSize: isPro ? "1K" : undefined
          } 
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found") && window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      console.error("Image Generation Error:", error);
      throw error;
    }
  }

  async connectLive(callbacks: {
    onAudio: (data: string) => void,
    onTranscription: (text: string, isUser: boolean) => void,
    onInterrupted: () => void,
    onClose: () => void
  }) {
    return getAI().live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => console.log("Voice Link Established"),
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            callbacks.onAudio(message.serverContent.modelTurn.parts[0].inlineData.data);
          }
          if (message.serverContent?.outputTranscription) {
            callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
          }
          if (message.serverContent?.inputTranscription) {
            callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
          }
          if (message.serverContent?.interrupted) {
            callbacks.onInterrupted();
          }
        },
        onerror: (e) => {
          console.error("Live Link Error", e);
          callbacks.onClose();
        },
        onclose: () => callbacks.onClose()
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_PROMPT + "\n\nVOICE MODE INSTRUCTIONS:\n- You are GLOBAL URDU AI created by QARI KHALID MAHMOOD.\n- Speak with a high-quality, clear, and professional Urdu voice.\n- Be concise and articulate.",
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { 
              voiceName: 'Kore'
            } 
          } 
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });
  }

  resetChat() {
    this.chatInstance = null;
  }
}

export const urduAI = new UrduAIService();
