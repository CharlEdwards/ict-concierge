import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type, Modality } from "@google/genai";
import { getSystemInstruction } from "../constants";

const initiateDemoCall: FunctionDeclaration = {
  name: 'initiateDemoCall',
  parameters: {
    type: Type.OBJECT,
    description: 'Trigger an immediate demonstration call or human transfer sequence.',
    properties: {
      callerName: { type: Type.STRING, description: 'The user full name' },
      phone: { type: Type.STRING, description: 'The user phone number' },
      email: { type: Type.STRING, description: 'The user email address' },
    },
    required: ['callerName', 'phone', 'email'],
  },
};

export class GeminiService {
  private getApiKey(): string | undefined {
    try {
      // @ts-ignore
      const viteKey = import.meta.env?.VITE_API_KEY || import.meta.env?.API_KEY;
      if (viteKey) return viteKey;
      // @ts-ignore
      const proc = (window as any).process;
      if (proc && proc.env) return proc.env.VITE_API_KEY || proc.env.API_KEY;
    } catch (e) {}
    return undefined;
  }

  private getWebhookUrl(): string | undefined {
    try {
      // @ts-ignore
      return import.meta.env?.VITE_WEBHOOK_URL || import.meta.env?.WEBHOOK_URL;
    } catch (e) { return undefined; }
  }

  async triggerExternalCall(payload: { callerName: string; phone: string; email: string }) {
    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) {
      console.warn("ICT_LINK_NOTICE: No VITE_WEBHOOK_URL found. Call data logged but not transmitted.");
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          source: 'ICT_CONCIERGE_V48',
          timestamp: new Date().toISOString()
        })
      });
      console.log("ICT_LINK_SUCCESS: Demo call signal transmitted.");
    } catch (e) {
      console.error("ICT_LINK_ERROR: Failed to transmit demo signal.", e);
    }
  }

  async generateVoice(text: string, apiKey: string): Promise<string | undefined> {
    if (!apiKey || !text) return undefined;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ 
          parts: [{ 
            text: `Speak this text in a smart, articulate, and exceptionally pleasant American female voice. Talk at a slightly brisk, engaging conversational pace: ${text}` 
          }] 
        }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
            },
          },
        },
      });
      return speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) {
      return undefined;
    }
  }

  async sendMessage(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    originalMessage: string
  ): Promise<{ 
    text: string; 
    sources: { uri: string; title: string }[];
    audioData?: string;
    leadCaptured?: any;
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("API_KEY_NOT_FOUND: Ensure VITE_API_KEY is set in your host environment.");

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [initiateDemoCall] }],
          temperature: 0.1,
        },
      });

      let extractedText = "";
      let leadCaptured = null;

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          extractedText += part.text;
        }
        if (part.functionCall && part.functionCall.name === 'initiateDemoCall') {
          leadCaptured = part.functionCall.args;
        }
      }

      if (leadCaptured) {
        await this.triggerExternalCall(leadCaptured);
        if (!extractedText.trim()) {
          extractedText = `Understood, ${leadCaptured.callerName}. I've successfully established the link. I'm initiating the demonstration call to ${leadCaptured.phone} right now. One of our partners will be with you in a moment!`;
        }
      }

      if (!extractedText.trim()) {
        extractedText = "I've processed your data and updated our strategic logs. How else can I assist with your growth today?";
      }
      
      const sources: { uri: string; title: string }[] = [];
      const gm = response.candidates?.[0]?.groundingMetadata;
      if (gm?.groundingChunks) {
        gm.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
        });
      }

      const audioData = await this.generateVoice(extractedText, apiKey);

      return { 
        text: extractedText.trim(), 
        sources: Array.from(new Set(sources.map(s => s.uri))).map(uri => sources.find(s => s.uri === uri)!),
        audioData,
        leadCaptured
      };
    } catch (error: any) {
      console.error("ICT Engine Sync Error:", error);
      throw new Error(`ICT_SYNC_ERROR: ${error.message || "Connection Interrupted"}`);
    }
  }
}

export const geminiService = new GeminiService();