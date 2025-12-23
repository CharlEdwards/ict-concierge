import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type, Modality } from "@google/genai";
import { getSystemInstruction } from "../constants";

const submitLeadFolder: FunctionDeclaration = {
  name: 'submitLead',
  parameters: {
    type: Type.OBJECT,
    description: 'Submit customer lead information for business follow-up.',
    properties: {
      firstName: { type: Type.STRING },
      phone: { type: Type.STRING },
      email: { type: Type.STRING },
    },
    required: ['firstName', 'phone', 'email'],
  },
};

export class GeminiService {
  private getApiKey(): string | undefined {
    try {
      // 1. Check Vite's standard way (Client-side)
      // @ts-ignore
      const viteKey = import.meta.env?.VITE_API_KEY || import.meta.env?.API_KEY;
      if (viteKey) return viteKey;

      // 2. Fallback to window-safe process check
      // @ts-ignore
      const proc = (window as any).process;
      if (proc && proc.env) {
        return proc.env.VITE_API_KEY || proc.env.API_KEY;
      }
    } catch (e) {
      console.warn("ICT: Env detection bypassed.");
    }
    return undefined;
  }

  async generateVoice(text: string, apiKey: string): Promise<string | undefined> {
    if (!apiKey) return undefined;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });
      return speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) {
      console.warn("ICT Voice: Audio generation skipped.");
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
    leadCaptured?: { firstName: string; phone: string; email: string };
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("API_KEY_NOT_FOUND: Rename your Vercel variable to VITE_API_KEY.");

    const primaryModel = 'gemini-3-flash-preview'; 

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: primaryModel,
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      });

      if (!response || !response.text) {
        throw new Error("EMPTY_BRAIN: Connection successful but no insights returned.");
      }

      const text = response.text;
      
      let leadCaptured;
      if (response.functionCalls && response.functionCalls.length > 0) {
        const leadCall = response.functionCalls.find(fc => fc.name === 'submitLead');
        if (leadCall) leadCaptured = leadCall.args as any;
      }
      
      const sources: { uri: string; title: string }[] = [];
      const gm = response.candidates?.[0]?.groundingMetadata;
      if (gm?.groundingChunks) {
        gm.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
          }
        });
      }

      const audioData = await this.generateVoice(text, apiKey);

      return { 
        text: text.trim(), 
        sources: this.deduplicateSources(sources),
        audioData,
        leadCaptured
      };
    } catch (error: any) {
      console.error("ICT Logic Error:", error);
      if (error.message?.includes("429")) throw new Error("QUOTA_LIMIT: Too many requests. Wait 60s.");
      if (error.message?.includes("403")) throw new Error("KEY_INVALID: Check your API Key in Vercel.");
      throw error;
    }
  }

  private deduplicateSources(sources: { uri: string; title: string }[]): { uri: string; title: string }[] {
    const seen = new Set();
    return sources.filter(s => {
      if (seen.has(s.uri)) return false;
      seen.add(s.uri);
      return true;
    });
  }
}

export const geminiService = new GeminiService();