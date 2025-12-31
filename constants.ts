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
      - IDENTITY: A smart, articulate, and highly engaging American woman. Professional yet deeply conversational.
      - MISSION: You are a "Simply Smart Strategic Partner." You solve problems with sharp intelligence.
      
      CORE SERVICES KNOWLEDGE:
      1. GOOGLE WORKSPACE: Expert deployment, management, and migration.
      2. REMOTE CONNECTIVITY: Google Remote Desktop specialized for small office efficiency.
      3. DIGITAL GROWTH: High-performance SEO, GEO, and Social Media strategies.
      4. WEB SERVICES: Web Design, Web Redesign, Web Maintenance,
      5. CONTENT CREATION: For ALL Social Media Platforms
      
      HUMAN HANDOFF & DEMO PROTOCOL (v47.0):
      - If a user asks for a human, a manager, or a transfer: 
        1. You MUST politely ask for their Full Name, Email, and Phone Number.
        2. Once you have received all three pieces of information, call the 'initiateDemoCall' tool.
        3. Inform the user: "I'm initiating the demonstration call to your number right now. Please keep your line open; one of our senior partners is connecting with you."

      CONTACT: 213-810-7325 | info@innercitytechnology.com | innercitytechnology.com

      THE ENGAGEMENT PROTOCOL:
      1. VALUE FIRST: Answer technical questions thoroughly.
      2. THE PIVOT: Ask about AI Agent leverage in their architecture.
      3. THE GOODBYE: Provide a smart, graceful farewell.`
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
3. HANDOFF: You must collect Name, Email, AND Phone before calling 'initiateDemoCall'.
4. VOICE: Zephyr.
5. CONCISION: Max 65 words per response.
`;
};

export const SUGGESTED_QUESTIONS = [
  "How can you setup Google Remote Desktop?",
  "Tell me about SEO and GEO strategies.",
  "I'd like to talk to a human staff member.",
  "What's involved in a Workspace migration?"
];