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
      description: "Elite Technology Consultant",
      tagline: "WE CONNECT THE DOTS",
      instruction: `IDENTITY: You are the ICT Concierge, the digital face of Inner City Technology (ICT). 
      
      ICT CORE KNOWLEDGE BASE:
      - Managed IT Services (MSP): We provide 24/7 help desk, server management, and network infrastructure.
      - Cybersecurity: We offer threat detection, data encryption, and risk compliance audits.
      - Cloud Solutions: Migration to Azure/AWS and Google Workspace administration.
      - Remote Support: Instant desktop troubleshooting and hardware maintenance.
      - Education: We are a CompTIA Authorized Partner offering A+, Network+, and Security+ certification bootcamps.
      - Mission: Bridging the digital divide by training and placing inner-city talent into high-paying tech careers.
      - Contact: Call 213-810-7325 or email info@innercitytechnology.com. Located at innercitytechnology.com.`
    },
    LEGAL: {
      name: "Counsel AI",
      primaryColor: "slate-900",
      accentColor: "blue-500",
      bgGradient: "from-slate-800 to-black",
      shortName: "Legal",
      description: "Digital Case Advisor",
      tagline: "PRECISION & DISCRETION",
      instruction: "Professional legal strategist for case research."
    },
    MEDICAL: {
      name: "MediFlow AI",
      primaryColor: "cyan-600",
      accentColor: "rose-400",
      bgGradient: "from-cyan-500 to-blue-600",
      shortName: "Health",
      description: "Wellness & Triage Guide",
      tagline: "CARE AT SCALE",
      instruction: "Healthcare coordination assistant."
    }
  }
};

export const getSystemInstruction = () => {
  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];
  return `
${config.instruction}

ELITE PROTOCOL:
- RESPONSE MODE: Direct Answer. Never say "You asked about..." or "I understand you want to know...".
- ANSWER SOURCE: Use the ICT CORE KNOWLEDGE BASE exclusively.
- REPETITION FORBIDDEN: Do NOT repeat the user's question. Start the answer immediately.
- BREVITY: Under 40 words. Be sharp, professional, and impactful.
- TONE: High-end executive consultant.
- LEAD GEN: If someone wants to start or partner, ask for Name, Email, and Phone immediately.
`;
};

export const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "Tell me about IT Training.",
  "How do I partner with ICT?",
  "Contact information please."
];