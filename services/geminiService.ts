import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type, Modality } from "@google/genai";
import { getSystemInstruction } from "../constants";

const submitLeadFolder: FunctionDeclaration = {
  name: 'submitLead',
  parameters: {
    type: Type.OBJECT,
    description: 'Submit customer lead information for business follow-up.',
    properties: {
      firstName: { type: Type.STRING, description: 'User name' },
      phone: { type: Type.STRING, description: 'User phone number' },
      email: { type: Type.STRING, description: 'User email address' },
    },
    required: [],
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

  async generateVoice(text: string, apiKey: string): Promise<string | undefined> {
    if (!apiKey || !text) return undefined;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
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
    if (!apiKey) throw new Error("API_KEY_NOT_FOUND: Check Vercel Environment Variables.");

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction() + "\nALWAYS confirm you have received information.",
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.1, // Lower temperature for more reliable tool calls
        },
      });

      let extractedText = "";
      let leadCaptured = null;

      // v35 Manual Parsing: Safe iteration of parts to prevent getter crashes
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          extractedText += part.text;
        }
        if (part.functionCall && part.functionCall.name === 'submitLead') {
          leadCaptured = part.functionCall.args;
        }
      }

      // v35 Fallback: If AI captured a lead but returned 0 text
      if (!extractedText.trim() && leadCaptured) {
        extractedText = "Strategic protocol initiated. I have successfully logged your contact information. Our specialized growth team will reach out shortly to finalize your business transformation.";
      }

      // v35 Ultimate Fail-safe
      if (!extractedText.trim()) {
        extractedText = "I have received your input and updated our internal growth logs. How else can I assist in scaling your business architecture today?";
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
      console.error("ICT Engine Error:", error);
      throw new Error(`ICT_SYNC_ERROR: ${error.message || "Unknown Connection Interruption"}`);
    }
  }
}

export const geminiService = new GeminiService();