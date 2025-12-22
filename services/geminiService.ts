import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type, Chat } from "@google/genai";
import { getSystemInstruction } from "../constants";

const submitLeadFolder: FunctionDeclaration = {
  name: 'submitLead',
  parameters: {
    type: Type.OBJECT,
    description: 'Submit customer lead information for business follow-up.',
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
   * Sends a message using a managed Chat session to ensure proper role alternation and context.
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
      
      // Initialize Chat with history (excluding the very latest user message which is sent via sendMessage)
      const chat: Chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history.slice(0, -1),
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.2, // Low temperature for maximum factual accuracy
          topP: 0.8,
        },
      });

      // Send the current message
      const result: GenerateContentResponse = await chat.sendMessage({ message });
      const text = result.text || "";
      
      let leadCaptured;
      const fcs = result.functionCalls;
      if (fcs && fcs.length > 0) {
        const leadCall = fcs.find(fc => fc.name === 'submitLead');
        if (leadCall) leadCaptured = leadCall.args as any;
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

      // Final validation to ensure no echoing occurred
      const finalResponse = text.trim();
      if (!finalResponse || finalResponse.toLowerCase().includes(message.toLowerCase().substring(0, 10))) {
        // Fallback for safety if the model glitches
        return {
          text: "Inner City Technology specializes in Managed IT Services, Cybersecurity, and IT Training (CompTIA A+/Security+). How can we assist your business today?",
          sources: []
        };
      }

      return { 
        text: finalResponse, 
        sources: this.deduplicateSources(sources),
        leadCaptured
      };
    } catch (error) {
      console.error("Gemini Session Error:", error);
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