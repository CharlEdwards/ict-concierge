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
   * Processes the message using high-precision generateContent to ensure specific answers.
   */
  async sendMessage(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    _message: string
  ): Promise<{ 
    text: string; 
    sources: { uri: string; title: string }[];
    leadCaptured?: { firstName: string; phone: string; email: string };
  }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Use Flash for high-speed, direct responses that follow instructions strictly
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.7, // Balanced for precision and natural flow
          topP: 0.9,
          maxOutputTokens: 500,
        },
      });

      const text = response.text || "";
      let leadCaptured;

      // Extract tool calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        const leadCall = response.functionCalls.find(fc => fc.name === 'submitLead');
        if (leadCall) {
          leadCaptured = leadCall.args as any;
        }
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

      // Safeguard against empty or repeating responses
      const finalResponse = text.trim();
      if (!finalResponse || finalResponse.toLowerCase() === _message.toLowerCase()) {
        return {
          text: "ICT is a premier technology provider specializing in Managed IT Services, Cybersecurity, and Professional IT Training (CompTIA). How can we help you scale today?",
          sources: []
        };
      }

      return { 
        text: finalResponse, 
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