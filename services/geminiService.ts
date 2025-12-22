import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { getSystemInstruction } from "../constants";

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
  /**
   * Sends a message to the Gemini model and handles the response.
   */
  async sendMessage(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    _message: string // message is already included in the history array from App.tsx
  ): Promise<{ 
    text: string; 
    sources: { uri: string; title: string }[];
    leadCaptured?: { firstName: string; phone: string; email: string };
  }> {
    try {
      // Initialize with the standard environment key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Use history directly as contents since it already includes the latest user message
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [
            { functionDeclarations: [submitLeadFolder] }
          ],
        },
      });

      // Use the .text property as defined in the latest SDK
      const text = response.text || "";
      let leadCaptured;

      // Extract function calls from the dedicated response property
      const fcs = response.functionCalls;
      if (fcs && fcs.length > 0) {
        const leadCall = fcs.find(fc => fc.name === 'submitLead');
        if (leadCall) {
          leadCaptured = leadCall.args as any;
        }
      }
      
      const sources: { uri: string; title: string }[] = [];
      // Grounding URLs are extracted if present in groundingMetadata
      const gm = response.candidates?.[0]?.groundingMetadata;
      if (gm?.groundingChunks) {
        gm.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
          }
        });
      }

      return { 
        text: text || (leadCaptured ? "System alert: Lead information successfully captured. Our executive team has been notified." : "Processing..."), 
        sources: this.deduplicateSources(sources),
        leadCaptured
      };
    } catch (error) {
      console.error("Gemini Service Error Detail:", error);
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