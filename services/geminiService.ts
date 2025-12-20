
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { ICT_SYSTEM_INSTRUCTION } from "../constants";

const submitLeadFolder: FunctionDeclaration = {
  name: 'submitLead',
  parameters: {
    type: Type.OBJECT,
    description: 'Submit customer lead information for follow-up.',
    properties: {
      firstName: { type: Type.STRING, description: 'The customer first name' },
      phone: { type: Type.STRING, description: 'The customer phone number' },
      email: { type: Type.STRING, description: 'The customer email address' },
    },
    required: ['firstName', 'phone', 'email'],
  },
};

export class GeminiService {
  async sendMessage(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    message: string
  ): Promise<{ 
    text: string; 
    sources: { uri: string; title: string }[];
    leadCaptured?: { firstName: string; phone: string; email: string };
    functionCallId?: string;
  }> {
    try {
      // Create fresh instance right before making an API call to ensure it always uses the most up-to-date API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Upgraded for more complex reasoning as requested
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
      let functionCallId;

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.functionCall && part.functionCall.name === 'submitLead') {
            leadCaptured = part.functionCall.args as any;
            functionCallId = part.functionCall.id;
          }
        }
      }
      
      const sources: { uri: string; title: string }[] = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
          }
        });
      }

      return { 
        text: text || (leadCaptured ? "Thank you! I've recorded your information and someone from the ICT team will reach out shortly." : "I'm sorry, I couldn't process that."), 
        sources: this.deduplicateSources(sources),
        leadCaptured,
        functionCallId
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  private deduplicateSources(sources: { uri: string; title: string }[]): { uri: string; title: string }[] {
    const seen = new Set();
    return sources.filter(s => {
      const duplicate = seen.has(s.uri);
      seen.add(s.uri);
      return !duplicate;
    });
  }
}

export const geminiService = new GeminiService();
