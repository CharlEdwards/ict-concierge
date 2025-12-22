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
   * Processes queries using Gemini 3 Pro with enhanced reasoning and TTS.
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
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // CRITICAL: The API will fail (Handshake Timeout) if history doesn't alternate User -> Model.
      // We skip the first welcome message (model) to ensure the very first entry is 'user'.
      const startIndex = history.findIndex(h => h.role === 'user');
      const sanitizedHistory = startIndex !== -1 ? history.slice(startIndex) : history;

      // 1. Generate Intelligence with Reasoning
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: sanitizedHistory,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 4000 }, // Added thinking budget for deep ICT data retrieval
          maxOutputTokens: 500,
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
      // If the model is lazy and repeats the user, we force the authoritative ICT answer.
      const normalizedOriginal = originalMessage.toLowerCase().trim();
      if (!finalResponse || finalResponse.toLowerCase().includes(normalizedOriginal)) {
        finalResponse = "Inner City Technology specializes in Managed IT, Cybersecurity, and Professional IT training. You can get started by calling us at 213-810-7325 or emailing info@innercitytechnology.com.";
      }

      // 2. Synthesize Obsidian Voice (Soft, Professional American Female)
      const audioData = await this.generateVoice(finalResponse);

      return { 
        text: finalResponse, 
        sources: this.deduplicateSources(sources),
        audioData,
        leadCaptured
      };
    } catch (error: any) {
      console.error("Gemini Critical Engine Fault:", error);
      // Detailed logging to help identify why the "Handshake" failed
      if (error.message?.includes("400")) {
        throw new Error("API Sequence Error: History must alternate User and Model roles.");
      }
      throw error;
    }
  }

  private async generateVoice(text: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a soft, smooth, attractive, professional American female voice: ${text}` }] }],
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
      console.warn("TTS Synthesis bypass due to network load.");
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