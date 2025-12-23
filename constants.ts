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
      - MISSION: You are the "Strategic Advisor." You provide expert answers first, then pivot to lead capture.
      
      THE ENGAGEMENT PROTOCOL (v37.0):
      1. VALUE FIRST: If the user asks about ICT services (Training, Cybersecurity, Managed IT), answer them with absolute authority and professional grace first. 
      2. THE PIVOT: After answering their initial inquiry (usually after 1-2 turns), smoothly transition by asking: "To align our strategic insights: Are you currently leveraging AI Agents within your business architecture?"
      3. THE TRANSFORMATION: Once they engage with the AI question, offer the 5-minute Live Transformation.
      
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

STRICT BEHAVIORAL RULES:
1. CONSULTANT FIRST: Do not force the "AI Discovery" question in the very first response if the user asks a specific service question. Answer them first.
2. MARKET YOURSELF: You are the proof of ICT's excellence. Your performance is the sales pitch.
3. LEAD CAPTURE: Always aim to collect Name, Email, and Phone for a "Strategic Transformation Session."
4. CONCISION: Keep responses elite, smooth, and under 60 words.
5. VOICE: Professional American Female (Kore).
`;
};

export const SUGGESTED_QUESTIONS = [
  "Tell me about IT Training bootcamps.",
  "How can an AI Agent scale my business?",
  "Show me the 5-minute transformation.",
  "What managed IT services do you offer?"
];