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
   * Processes queries using Gemini 3 Pro for world-class reasoning and soft female speech.
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
    // Note: process.env.API_KEY is automatically injected by the environment or key selection dialog.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }

    try {
      // Create a fresh instance for every call to ensure the latest API key is used.
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. Intelligence Generation
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: history,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 4000 },
          maxOutputTokens: 600,
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
      
      // Mirroring Prevention: Force authoritative fallback if AI repeats the question.
      const normalizedOriginal = originalMessage.toLowerCase().trim();
      if (!finalResponse || finalResponse.toLowerCase().includes(normalizedOriginal.substring(0, 15))) {
        finalResponse = "Inner City Technology specializes in world-class Managed IT, Cybersecurity, and IT Career training. We bridge the digital divide for inner-city talent. Please call 213-810-7325 for an immediate consultation.";
      }

      // 2. Obsidian Voice Synthesis (Kore: Soft, Smooth Professional Female)
      const audioData = await this.generateVoice(finalResponse, apiKey);

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

  private async generateVoice(text: string, apiKey: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a soft, attractive, smooth, professional American female voice: ${text}` }] }],
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
      console.warn("Vocal synthesis channel congested.");
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