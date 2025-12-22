import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type, Chat } from "@google/genai";
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
   * Sends a message using a Chat session to maintain proper context and prevent echoing.
   */
  async sendMessage(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    message: string
  ): Promise<{ 
    text: string; 
    sources: { uri: string; title: string }[];
    leadCaptured?: { firstName: string; phone: string; email: string };
  }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Use the Pro model for higher quality reasoning and better instruction following
      const chat: Chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history.slice(0, -1), // Everything except the latest user message
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [
            { functionDeclarations: [submitLeadFolder] }
          ],
        },
      });

      // Send the actual message separately to ensure the model responds to it
      const result: GenerateContentResponse = await chat.sendMessage({ message });

      const text = result.text || "";
      let leadCaptured;

      const fcs = result.functionCalls;
      if (fcs && fcs.length > 0) {
        const leadCall = fcs.find(fc => fc.name === 'submitLead');
        if (leadCall) {
          leadCaptured = leadCall.args as any;
        }
      }
      
      const sources: { uri: string; title: string }[] = [];
      const gm = result.candidates?.[0]?.groundingMetadata;
      if (gm?.groundingChunks) {
        gm.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
          }
        });
      }

      return { 
        text: text || (leadCaptured ? "Strategic Alert: Your lead profile has been transmitted to our executive leadership team. We will connect shortly." : "Synthesis complete. Please proceed."), 
        sources: this.deduplicateSources(sources),
        leadCaptured
      };
    } catch (error) {
      console.error("Gemini Core Error:", error);
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