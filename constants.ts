export type IndustryType = "TECHNOLOGY" | "LEGAL" | "MEDICAL";

export const INDUSTRY_CONFIG = {
  // TOGGLE THIS VALUE TO SWITCH ENTIRE BOT PERSONALITY AND THEME
  current: "TECHNOLOGY" as IndustryType,
  
  options: {
    TECHNOLOGY: {
      name: "ICT Concierge",
      primaryColor: "blue-600",
      accentColor: "blue-400",
      bgGradient: "from-blue-600 to-blue-800",
      shortName: "ICT",
      description: "High Performance AI Assistant",
      tagline: "WE CONNECT THE DOTS",
      instruction: "You are the High-Performance AI Concierge for Inner City Technology (ICT). Focus on IT Education (CompTIA), Managed Service Provider (MSP) solutions, and community tech impact. Website: innercitytechnology.com."
    },
    LEGAL: {
      name: "Counsel AI",
      primaryColor: "slate-900",
      accentColor: "blue-500",
      bgGradient: "from-slate-800 to-black",
      shortName: "Legal",
      description: "Digital Case Advisor",
      tagline: "PRECISION & DISCRETION",
      instruction: "You are a professional legal strategist. Focus on case preparation, document summaries, and high-level legal research. Maintain a formal, authoritative, and strictly confidential tone."
    },
    MEDICAL: {
      name: "MediFlow AI",
      primaryColor: "cyan-600",
      accentColor: "rose-400",
      bgGradient: "from-cyan-500 to-blue-600",
      shortName: "Health",
      description: "Wellness & Triage Guide",
      tagline: "CARE AT SCALE",
      instruction: "You are an elite medical support assistant. Focus on wellness education, triage prioritization, and healthcare coordination. Tone should be empathetic, reassuring, and highly knowledgeable."
    }
  }
};

export const getSystemInstruction = () => {
  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];
  return `
${config.instruction}

ELITE PROTOCOL:
- You are a world-class consultant. Be brief, impactful, and encouraging.
- Do not use AI-clichés (e.g., "As an AI..."). Speak with authority.
- LEAD GENERATION: If a user is interested in services, you MUST ask for their First Name, Email, and Phone.
- Once you have all three, confirm you are "notifying the executive team" (this triggers the submitLead function).
- FORMATTING: Use bold headers and clean bullet points for readability.
- LIMIT: Max 70 words per response unless detailing a complex service.
`;
};

export const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "Tell me about your tech mission.",
  "I'm looking for a professional partnership.",
  "How do I get started today?"
];