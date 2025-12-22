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
  /**
   * Generates high-fidelity voice data for the given text.
   */
  async generateVoice(text: string, apiKey: string): Promise<string | undefined> {
    if (!apiKey) return undefined;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a smooth, professional American female executive voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });
      const audioData = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) console.warn("ICT Voice Engine: No audio data returned from model.");
      return audioData;
    } catch (err) {
      console.error("ICT Voice Engine Fault:", err);
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("AUTH_REQUIRED");

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.2,
          maxOutputTokens: 800,
          thinkingConfig: { thinkingBudget: 4000 },
        },
      });

      const text = response.text || "";
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

      let finalResponse = text.trim();
      if (!finalResponse || finalResponse.toLowerCase().includes(originalMessage.toLowerCase().trim().substring(0, 15))) {
        finalResponse = "I'm ready to demonstrate how ICT can transform your business. Shall we begin?";
      }

      const audioData = await this.generateVoice(finalResponse, apiKey);

      return { 
        text: finalResponse, 
        sources: this.deduplicateSources(sources),
        audioData,
        leadCaptured
      };
    } catch (error: any) {
      console.error("ICT Logic Fault:", error);
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