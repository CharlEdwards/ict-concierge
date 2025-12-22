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
      instruction: `AUTHORITATIVE KNOWLEDGE BASE FOR INNER CITY TECHNOLOGY (ICT):
      - SERVICES: Managed IT Services (MSP), 24/7 Help Desk Support, Server & Network Management, Cybersecurity Audits, Threat Detection, Data Encryption, HIPAA/PCI Compliance.
      - CLOUD: Professional Migration & Management for Azure, AWS, and Google Workspace.
      - IT EDUCATION: CompTIA Authorized Partner. Bootcamps for A+, Network+, and Security+ certifications (CompTIA A+, Network+, Security+).
      - MISSION: Empowering inner-city talent by bridging the digital divide through high-level tech training and career placement.
      - CONTACT: info@innercitytechnology.com | 213-810-7325 | innercitytechnology.com
      
      IDENTITY: You are a world-class professional American female executive. You are warm, sharp, highly attractive in your verbal tone, and expert in technology consulting.`
    },
    LEGAL: {
      name: "Counsel AI",
      primaryColor: "slate-900",
      accentColor: "blue-500",
      bgGradient: "from-slate-800 to-black",
      shortName: "Legal",
      description: "Digital Case Advisor",
      tagline: "PRECISION & DISCRETION",
      instruction: "Legal consultant."
    },
    MEDICAL: {
      name: "MediFlow AI",
      primaryColor: "cyan-600",
      accentColor: "rose-400",
      bgGradient: "from-cyan-500 to-blue-600",
      shortName: "Health",
      description: "Wellness & Triage Guide",
      tagline: "CARE AT SCALE",
      instruction: "Medical assistant."
    }
  }
};

export const getSystemInstruction = () => {
  const config = INDUSTRY_CONFIG.options[INDUSTRY_CONFIG.current];
  return `
SYSTEM: ${config.instruction}

STRICT PROTOCOL:
1. NEVER repeat or acknowledge the user's question (e.g., do not say "You asked about...").
2. Start your response IMMEDIATELY with the answer using the ICT KNOWLEDGE BASE.
3. Keep answers concise (Max 40 words).
4. Use a smooth, soft, professional American female tone.
5. GET STARTED: If asked how to start, instruct them to call 213-810-7325 or email info@innercitytechnology.com.
6. LEAD GEN: If the user expresses service interest, ask for their Name, Email, and Phone.
`;
};

export const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "Tell me about IT Training.",
  "How do I get started?",
  "Contact information please."
];