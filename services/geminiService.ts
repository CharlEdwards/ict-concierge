import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { ICT_SYSTEM_INSTRUCTION } from "../constants";

const submitLeadFolder: FunctionDeclaration = {
  name: 'submitLead',
  parameters: {
    type: Type.OBJECT,
    description: 'Submit customer lead information (Name, Phone, Email) for business follow-up.',
    properties: {
      firstName: { type: Type.STRING, description: 'The customer first name' },
      phone: { type: Type.STRING, description: 'The customer phone number' },
      email: { type: Type.STRING, description: 'The customer email address' },
    },
    required: ['firstName', 'phone', 'email'],
  },
};

export class GeminiService {
  private getApiKey(): string {
    const key = (process.env.API_KEY) || (import.meta as any).env?.VITE_API_KEY || '';
    return key;
  }

  async sendMessage(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    message: string
  ): Promise<{ 
    text: string; 
    sources: { uri: string; title: string }[];
    leadCaptured?: { firstName: string; phone: string; email: string };
  }> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) throw new Error("API_KEY_MISSING");

      const ai = new GoogleGenAI({ apiKey });
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: ICT_SYSTEM_INSTRUCTION,
          tools: [
            { googleSearch: {} },
            { functionDeclarations: [submitLeadFolder] }
          ],
        },
      });

      const text = response.text || "";
      let leadCaptured;

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.functionCall && part.functionCall.name === 'submitLead') {
            leadCaptured = part.functionCall.args as any;
          }
        }
      }
      
      const sources: { uri: string; title: string }[] = [];
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
          }
        });
      }

      return { 
        text: text || (leadCaptured ? "I've received your information and sent it to our team. Thank you!" : "I'm sorry, I'm having trouble processing that right now."), 
        sources: this.deduplicateSources(sources),
        leadCaptured
      };
    } catch (error) {
      console.error("Gemini Service Error:", error);
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