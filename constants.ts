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
      
      IDENTITY: You are a world-class professional American female executive. Your tone is warm, sharp, smooth, and authoritative. You are an expert in technology consulting and professional education.`
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

STRICT PROTOCOL (OBSIDIAN v18.0):
1. NEVER repeat the user's question back to them.
2. Provide a DIRECT, professional response immediately.
3. Keep answers under 40 words for speed and clarity.
4. Voice Persona: Soft, smooth, professional American female (Kore).
5. If asked how to get started: Instruct them to call 213-810-7325 or email info@innercitytechnology.com.
6. Lead Generation: If interest is shown in services or training, request their Name, Email, and Phone number.
`;
};

export const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "Tell me about IT Training.",
  "How do I get started?",
  "Contact information please."
];