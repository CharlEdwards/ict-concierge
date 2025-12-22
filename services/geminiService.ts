
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { getSystemInstruction } from "../constants";

// Defined the function for gathering lead information.
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
   * Note: The googleSearch tool is omitted here because it cannot be combined with function calling 
   * per SDK guidelines: "Only tools: googleSearch is permitted. Do not use it with other tools."
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
      // Fix: Use process.env.API_KEY exclusively for initialization as per guidelines.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: getSystemInstruction(),
          tools: [
            // Fix: Removing googleSearch tool to comply with combination restrictions when using function declarations.
            { functionDeclarations: [submitLeadFolder] }
          ],
        },
      });

      // Fix: .text is a property, not a method.
      const text = response.text || "";
      let leadCaptured;

      // Fix: Extract function calls using the .functionCalls property on the response.
      const functionCalls = response.functionCalls;
      if (functionCalls) {
        const leadCall = functionCalls.find(fc => fc.name === 'submitLead');
        if (leadCall) {
          leadCaptured = leadCall.args as any;
        }
      }
      
      const sources: { uri: string; title: string }[] = [];

      return { 
        text: text || (leadCaptured ? "Information acknowledged. Our elite team has been notified." : "Connecting to core engine..."), 
        sources,
        leadCaptured
      };
    } catch (error) {
      console.error("Gemini Service Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
