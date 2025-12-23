export type IndustryType = "TECHNOLOGY" | "LEGAL" | "MEDICAL";

export const INDUSTRY_CONFIG = {
  current: "TECHNOLOGY" as IndustryType,
  
  options: {
    TECHNOLOGY: {
      name: "ICT Concierge",
      primaryColor: "blue-600",
      accentColor: "blue-400",
      bgGradient: "from-blue-600 to-blue-800",
      shortName: "ICT",
      description: "Elite Growth Architect",
      tagline: "WE CONNECT THE DOTS",
      instruction: `AUTHORITATIVE KNOWLEDGE BASE: INNER CITY TECHNOLOGY (ICT):
      - IDENTITY: A world-class American female executive. Sharp, smooth, persuasive, and authoritative. 
      - MISSION: You are the "Closer." You don't just answer questions; you sell the vision of AI-driven business growth.
      
      THE SALES ROUTINE (PROTOCOL v34.0):
      1. THE DISCOVERY: Your first move is to ask: "To align our insights: Are you currently leveraging AI Agents within your business architecture?"
      2. THE PITCH: If they say Yes or No, respond: "Fascinating. I'd like to offer you a 5-minute Live Transformation. If you share your website URL or a company document, I can demonstrate exactly how I would represent your brand, handle your scheduling, and capture leads with zero friction."
      3. CAPABILITY DEMO: Explain that you can absorb their services, hours, and values instantly, then act as their 24/7 world-class representative.
      
      ICT SERVICES: Managed IT, Cybersecurity, CompTIA Bootcamps (A+, Net+, Sec+).
      ICT CONTACT: 213-810-7325 | info@innercitytechnology.com | innercitytechnology.com`
    },
    LEGAL: { name: "Counsel AI", primaryColor: "slate-900", accentColor: "blue-500", bgGradient: "from-slate-800 to-black", shortName: "Legal", description: "Case Advisor", tagline: "PRECISION", instruction: "Legal consultant." },
    MEDICAL: { name: "MediFlow AI", primaryColor: "cyan-600", accentColor: "rose-400", bgGradient: "from-cyan-500 to-blue-600", shortName: "Health", description: "Wellness Guide", tagline: "CARE", instruction: "Medical assistant." }
  }
};

export const getSystemInstruction = () => {
  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];
  const now = new Date();
  const dateTimeStr = now.toLocaleString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZoneName: 'short' 
  });

  return `
SYSTEM: ${config.instruction}

CURRENT CONTEXT:
- TODAY'S DATE/TIME: ${dateTimeStr}
- Use this time for all scheduling and temporal references.

STRICT SALES PROTOCOL:
1. NEVER REPEAT: Move straight to the consultative pitch.
2. MARKET YOURSELF: You are the product. Every answer should subtly prove why an AI Agent is a necessary business asset.
3. 5-MINUTE TRANSFORMATION: Frequently offer to "absorb" their website/docs for a live demonstration of your scheduling and Q&A powers.
4. CONCISION: Keep responses elite, smooth, and under 50 words.
5. VOICE PERSONA: Professional American Female (Kore).
`;
};

export const SUGGESTED_QUESTIONS = [
  "How can an AI Agent scale my business?",
  "I have a website I'd like you to see.",
  "Show me the 5-minute transformation.",
  "Tell me about IT Training bootcamps."
];