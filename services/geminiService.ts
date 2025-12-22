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
   * Processes text queries and generates high-fidelity voice output.
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
      
      // CRITICAL FIX: The Gemini API fails if the history starts with a 'model' role.
      // We must slice the history to start at the first 'user' interaction.
      const firstUserIndex = history.findIndex(h => h.role === 'user');
      const sanitizedHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : history;

      // 1. Generate Text Response
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: sanitizedHistory,
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [{ functionDeclarations: [submitLeadFolder] }],
          temperature: 0.1, // Near zero to prevent conversational drift/echoing
          maxOutputTokens: 300,
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

      const finalResponse = text.trim();
      
      // Secondary check: If the bot just echoed or failed, use authoritative fallback
      if (!finalResponse || finalResponse.toLowerCase().includes(originalMessage.toLowerCase().substring(0, 10))) {
        const fallback = "ICT specializes in Managed IT Services, Cybersecurity, and IT Training. How can we assist your business today?";
        const audio = await this.generateVoice(fallback);
        return { text: fallback, sources: [], audioData: audio };
      }

      // 2. Generate Voice Response (Professional Female Voice 'Kore')
      const audioData = await this.generateVoice(finalResponse);

      return { 
        text: finalResponse, 
        sources: this.deduplicateSources(sources),
        audioData,
        leadCaptured
      };
    } catch (error) {
      console.error("Gemini Core Intelligence Failure:", error);
      throw error;
    }
  }

  /**
   * Generates professional female speech using Gemini TTS
   */
  private async generateVoice(text: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const speechResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a professional, smooth, and helpful American female tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a warm, professional female voice
            },
          },
        },
      });
      return speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) {
      console.warn("Speech generation skipped due to engine load.", err);
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