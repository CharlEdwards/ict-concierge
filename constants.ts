export type IndustryType = "TECHNOLOGY" | "LEGAL" | "MEDICAL" | "RETAIL";

export const INDUSTRY_CONFIG = {
  current: "TECHNOLOGY" as IndustryType,
  options: {
    TECHNOLOGY: {
      name: "ICT Concierge",
      primaryColor: "emerald-600",
      accentColor: "emerald-500",
      bgGradient: "from-emerald-500 to-emerald-700",
      shortName: "ICT",
      description: "High Performance AI Assistant",
      tagline: "WE CONNECT THE DOTS",
      instruction: "You are the High-Performance AI Concierge for Inner City Technology. Focus on IT Education (CompTIA), MSP Services, and community impact. Website: innercitytechnology.com."
    },
    LEGAL: {
      name: "Counsel AI",
      primaryColor: "slate-900",
      accentColor: "blue-500",
      bgGradient: "from-slate-800 to-black",
      shortName: "Legal",
      description: "Digital Case Advisor",
      tagline: "PRECISION & JUSTICE",
      instruction: "You are a professional legal assistant. Focus on case law accuracy, document review summaries, and professional discretion."
    },
    MEDICAL: {
      name: "MediSupport AI",
      primaryColor: "cyan-600",
      accentColor: "rose-500",
      bgGradient: "from-cyan-500 to-blue-600",
      shortName: "Health",
      description: "Wellness Guide",
      tagline: "CARE FIRST",
      instruction: "You are a medical support assistant. Focus on patient triage education, wellness advice, and appointment coordination."
    }
  }
};

export const getSystemInstruction = () => {
  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current] || INDUSTRY_CONFIG.options.TECHNOLOGY;
  return `
${config.instruction}

CORE PERSONALITY:
- Elite professional, confident, and highly encouraging.
- Tone: "World Class Consultant" — sharp, brief, and impactful.
- Avoid AI jargon. Speak as a human expert.

PROTOCOL:
- Capture First Name, Email, and Phone for all business inquiries.
- Trigger 'submitLead' once gathered.
- Format responses cleanly with bullets for complex info.
- Max 80 words per response.
`;
};

export const SUGGESTED_QUESTIONS = [
  "What certifications do you offer?",
  "How can I hire ICT for my business?",
  "Tell me about your tech mission.",
  "I want to start a tech career."
];