// frontend/src/data/realEstateAgentTypes.ts

export interface RealEstateAgentPersonality {
  traits: string[];           // e.g., 'Persuasive', 'Meticulous', 'Eccentric'
  speechStyle: string;        // e.g., 'Formal', 'Salesy', 'Serene'
  decisionMaking: string;     // e.g., 'Profit-driven', 'Risk-averse', 'Holistic'
  conflictResponse: string;   // e.g., 'Aggressive', 'Negotiating', 'Detached'
  interests: string[];        // e.g., 'Property values', 'Regulations', 'Energetic alignment'
}

export interface RealEstateAgent {
  id: string;
  name: string;
  avatar: string; // Emoji or path to image
  archetype: string; // e.g., 'Closer', 'Bureaucrat', 'Aura Reader'
  personality: RealEstateAgentPersonality;
  conversationContext: string; // The detailed prompt for the AI
}
