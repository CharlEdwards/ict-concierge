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
    // Attempt multiple standard locations for Vite/Browser environments
    // @ts-ignore
    return process?.env?.API_KEY || process?.env?.VITE_API_KEY || (window as any).process?.env?.API_KEY;
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
      console.warn("ICT Voice Engine: Blocked or Key Issue.");
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
    if (!apiKey) throw new Error("API KEY NOT DETECTED IN BROWSER. Please rename variable to VITE_API_KEY in Vercel.");

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
        throw new Error("EMPTY_RESPONSE: The engine connected but returned no data.");
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
      console.error("ICT AI Logic Failure:", error);
      if (error.message?.includes("429")) throw new Error("QUOTA_HIT: Too many requests for this key.");
      if (error.message?.includes("403")) throw new Error("AUTH_DENIED: Your API Key is rejected by Google.");
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