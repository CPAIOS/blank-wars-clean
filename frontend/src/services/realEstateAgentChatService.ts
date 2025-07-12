import { realEstateAPI } from './apiClient';
import { RealEstateAgent } from '../data/realEstateAgentTypes';

interface RealEstateAgentContext {
  selectedAgent: RealEstateAgent;
  competingAgents: RealEstateAgent[];
  facilityType?: string;
  userMessage?: string;
  currentTeamStats: {
    level: number;
    totalCharacters: number;
    currentFacilities: string[];
    budget: number;
  };
  conversationHistory: {
    agentId: string;
    message: string;
    timestamp: Date;
  }[];
}

interface AgentResponse {
  agentId: string;
  agentName: string;
  message: string;
  timestamp: Date;
  isCompetitorInterruption?: boolean;
}

class RealEstateAgentChatService {
  async startFacilityConsultation(
    selectedAgent: RealEstateAgent,
    competingAgents: RealEstateAgent[],
    teamStats: any
  ): Promise<string> {
    const context: RealEstateAgentContext = {
      selectedAgent,
      competingAgents,
      currentTeamStats: teamStats,
      conversationHistory: [],
    };

    const response = await realEstateAPI.sendMessage(context);
    return response.messages[0]?.message || "Hello! I'm ready to help you find the perfect facility for your team."; 
  }

  async sendUserMessage(
    selectedAgent: RealEstateAgent,
    competingAgents: RealEstateAgent[],
    userMessage: string,
    teamStats: any,
    conversationHistory: any[]
  ): Promise<AgentResponse[]> {
    const context: RealEstateAgentContext = {
      selectedAgent,
      competingAgents,
      userMessage,
      currentTeamStats: teamStats,
      conversationHistory,
    };

    const response = await realEstateAPI.sendMessage(context);
    return response.messages;
  }
}

export const realEstateAgentChatService = new RealEstateAgentChatService();
