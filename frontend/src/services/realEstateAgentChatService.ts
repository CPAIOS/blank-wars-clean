import { realEstateAPI } from './apiClient';
import { RealEstateAgent } from '../data/realEstateAgentTypes';
import GameEventBus from './gameEventBus';
import EventContextService from './eventContextService';

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
    teamStats: any,
    characterId?: string
  ): Promise<string> {
    // Import character context for personalized consultation
    if (characterId) {
      const contextService = EventContextService.getInstance();
      const characterContext = await contextService.getRealEstateContext(characterId);
      // TODO: Add characterContext to API context
    }

    const context: RealEstateAgentContext = {
      selectedAgent,
      competingAgents,
      currentTeamStats: teamStats,
      conversationHistory: [],
    };

    // Publish consultation start event
    if (characterId) {
      const eventBus = GameEventBus.getInstance();
      await eventBus.publish({
        type: 'facility_evaluation',
        source: 'real_estate_office',
        primaryCharacterId: characterId,
        severity: 'medium',
        category: 'real_estate',
        description: `${characterId} started a facility consultation with ${selectedAgent.name}`,
        metadata: { 
          agentType: selectedAgent.archetype,
          currentBudget: teamStats.budget,
          teamLevel: teamStats.level,
          consultationType: 'initial'
        },
        tags: ['real_estate', 'consultation', 'facility_planning']
      });
    }

    const response = await realEstateAPI.sendMessage(context);
    return response.messages[0]?.message || "Hello! I'm ready to help you find the perfect facility for your team."; 
  }

  async sendUserMessage(
    selectedAgent: RealEstateAgent,
    competingAgents: RealEstateAgent[],
    userMessage: string,
    teamStats: any,
    conversationHistory: any[],
    characterId?: string
  ): Promise<AgentResponse[]> {
    // Import character context for personalized responses
    if (characterId) {
      const contextService = EventContextService.getInstance();
      const characterContext = await contextService.getRealEstateContext(characterId);
      // TODO: Add characterContext to API context
    }

    const context: RealEstateAgentContext = {
      selectedAgent,
      competingAgents,
      userMessage,
      currentTeamStats: teamStats,
      conversationHistory,
    };

    // Analyze user message for event publishing
    const messageText = userMessage.toLowerCase();
    let eventType = 'room_upgrade_requested';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (messageText.includes('privacy') || messageText.includes('private') || messageText.includes('alone')) {
      eventType = 'privacy_request';
      severity = 'high';
    } else if (messageText.includes('complaint') || messageText.includes('problem') || messageText.includes('issue')) {
      eventType = 'living_complaint';
      severity = 'medium';
    } else if (messageText.includes('upgrade') || messageText.includes('better') || messageText.includes('luxury')) {
      eventType = 'comfort_enhancement';
      severity = 'low';
    }

    // Publish real estate interaction event
    if (characterId) {
      const eventBus = GameEventBus.getInstance();
      await eventBus.publish({
        type: eventType as any,
        source: 'real_estate_office',
        primaryCharacterId: characterId,
        severity,
        category: 'real_estate',
        description: `${characterId} discussed with ${selectedAgent.name}: "${userMessage.substring(0, 100)}"`,
        metadata: { 
          agentType: selectedAgent.archetype,
          requestType: eventType,
          currentBudget: teamStats.budget,
          messageLength: userMessage.length,
          comedyPotential: messageText.includes('desperate') || messageText.includes('please') ? 6 : 3
        },
        tags: ['real_estate', 'housing_discussion', eventType.replace('_', '-')]
      });
    }

    const response = await realEstateAPI.sendMessage(context);
    return response.messages;
  }
}

export const realEstateAgentChatService = new RealEstateAgentChatService();
