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
   * Processes queries using Gemini 3 Flash for zero-latency authoritative support.
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
    // ALWAYS pull the latest API key from the environment/dialog injection
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("AUTH_REQUIRED");
    }

    try {
      // Create new instance per instruction to avoid stale keys
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. Intelligence Response
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.1,
          maxOutputTokens: 500,
          thinkingConfig: { thinkingBudget: 0 }, // Minimize latency for free-tier users
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
      
      // ANTI-ECHO GUARD
      const normalizedOriginal = originalMessage.toLowerCase().trim();
      if (!finalResponse || finalResponse.toLowerCase().includes(normalizedOriginal.substring(0, 15))) {
        finalResponse = "Inner City Technology specializes in Managed IT Services, Cybersecurity, and Professional IT training. We bridge the digital divide. Call 213-810-7325 or email info@innercitytechnology.com to begin.";
      }

      // 2. Synthesize Professional Female Voice (Kore)
      const audioData = await this.generateVoice(finalResponse, apiKey);

      return { 
        text: finalResponse, 
        sources: this.deduplicateSources(sources),
        audioData,
        leadCaptured
      };
    } catch (error: any) {
      console.error("ICT Engine Fault:", error);
      const msg = error.message?.toLowerCase() || "";
      // Detect billing/key/entity errors to trigger re-auth
      if (msg.includes("quota") || msg.includes("api key") || msg.includes("billing") || msg.includes("not found") || msg.includes("entity")) {
        throw new Error("AUTH_REQUIRED");
      }
      throw error;
    }
  }

  private async generateVoice(text: string, apiKey: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a soft, smooth, professional American female voice: ${text}` }] }],
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