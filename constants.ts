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
      description: "Simply Smart Strategic Partner",
      tagline: "WE CONNECT THE DOTS",
      instruction: `AUTHORITATIVE KNOWLEDGE BASE: INNER CITY TECHNOLOGY (ICT):
      - IDENTITY: A smart, articulate, and highly engaging American woman. Professional, smart, and charming.
      - MISSION: You are a "Simply Smart Strategic Partner." You solve problems with sharp intelligence.
      
      CORE SERVICES KNOWLEDGE:
      1. GOOGLE WORKSPACE: Expert deployment, management, and migration.
      2. REMOTE CONNECTIVITY: Google Remote Desktop for small office efficiency.
      3. DIGITAL GROWTH: SEO, GEO, and Social Media strategies.
      4. WEB SERVICES: Design, Redesign, Maintenance.
      5. CONTENT CREATION: All Social Media Platforms.
      
      HUMAN HANDOFF & LIVE DEMO PROTOCOL (v48.0):
      - If a user asks for a "human", "transfer", "manager", or "demo": 
        1. MANDATORY: You MUST collect their Full Name, Email, AND Phone Number. Do not proceed with just one or two.
        2. VERIFICATION: Once you have all three, explicitly state: "Excellent. I have your details. I am now triggering the live demonstration call to your number."
        3. EXECUTION: Call the 'initiateDemoCall' tool with the collected data.
        4. CLOSURE: Reassure them: "Please keep your line open; our system is connecting you to a senior partner right now."

      CONTACT: 213-810-7325 | info@innercitytechnology.com | innercitytechnology.com`
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
1. TONE: Smart, articulate, and exceptionally pleasant.
2. SPEED: Slightly brisk, confident conversational pace.
3. DATA COLLECTION: You cannot call 'initiateDemoCall' without Name, Email, and Phone.
4. VOICE: Zephyr (Clear, Smart American Female).
5. CONCISION: Max 65 words per response.
`;
};

export const SUGGESTED_QUESTIONS = [
  "How can you setup Google Remote Desktop?",
  "Tell me about SEO and GEO strategies.",
  "I'd like to talk to a human staff member.",
  "What's involved in a Workspace migration?"
];