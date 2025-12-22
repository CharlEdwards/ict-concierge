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
   * Processes queries using Gemini 3 Flash for zero-latency authoritative ICT support.
   */
  async sendMessage(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    originalMessage: string
  ): Promise<{ 
    text: string; 
    sources: { uri: string; title: string }[];
    audioData?: string;
    leadCaptured?: { firstName: string; phone: string; email: string };
  }> {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY_MISSING: Secure access key not found in environment.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 1. Generate Intelligence Response
      // We use gemini-3-flash-preview for the best balance of speed and instruction adherence.
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.1,
          maxOutputTokens: 400,
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
      
      // ANTI-ECHO PROTECTION:
      // Fallback if the model mirrors the user or fails to provide an authoritative ICT answer.
      const normalizedOriginal = originalMessage.toLowerCase().trim();
      if (!finalResponse || finalResponse.toLowerCase().includes(normalizedOriginal.substring(0, 15))) {
        finalResponse = "Inner City Technology specializes in world-class Managed IT Services, Cybersecurity, and CompTIA IT Certification training. We bridge the digital divide. Contact us at 213-810-7325 to begin your journey.";
      }

      // 2. Generate Professional Female Speech (Kore)
      const audioData = await this.generateVoice(finalResponse);

      return { 
        text: finalResponse, 
        sources: this.deduplicateSources(sources),
        audioData,
        leadCaptured
      };
    } catch (error: any) {
      console.error("ICT Intelligence Core Error:", error);
      throw error;
    }
  }

  /**
   * Synthesizes soft, smooth, professional female speech.
   */
  private async generateVoice(text: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a soft, attractive, smooth professional American female voice: ${text}` }] }],
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
      console.warn("Vocal channel congested, skipping synthesis.");
      return undefined;
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