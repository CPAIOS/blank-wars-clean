import { io, Socket } from 'socket.io-client';
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

export class RealEstateAgentChatService {
  private socket: Socket | null = null;
  private activeConversations: Map<string, AgentResponse[]> = new Map();

  constructor() {
    // Only initialize socket on client side
    if (typeof window !== 'undefined') {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Determine backend URL based on environment
    let socketUrl: string;
    
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      socketUrl = 'http://localhost:3006';
    } else {
      socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://blank-wars-backend.railway.app';
    }
    
    console.log('🏠 Real Estate Agent Chat Service initializing with URL:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Real Estate Agent Chat Service connected to:', socketUrl, 'with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Real Estate Agent Chat Service disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Real Estate Agent Chat Service connection error:', error);
    });
  }

  async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (!this.socket) return false;
    if (this.socket.connected) return true;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(false);
      }, timeout);

      this.socket!.once('connect', () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }

  async generateAgentResponse(context: RealEstateAgentContext): Promise<string> {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket not connected to backend. Please refresh the page and try again.');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Real estate agent response timeout'));
      }, 30000);

      this.socket!.emit('generate_real_estate_agent_response', {
        agent: context.selectedAgent,
        competingAgents: context.competingAgents,
        facilityType: context.facilityType,
        userMessage: context.userMessage,
        teamStats: context.currentTeamStats,
        conversationHistory: context.conversationHistory.slice(-5) // Last 5 messages for context
      });

      this.socket!.once('real_estate_agent_response_generated', (data) => {
        clearTimeout(timeout);
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.response);
        }
      });
    });
  }

  async generateCompetitorInterruption(
    context: RealEstateAgentContext, 
    primaryAgentResponse: string
  ): Promise<AgentResponse | null> {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected for competitor interruption');
      return null;
    }

    // 30% chance of competitor interruption
    if (Math.random() > 0.3) return null;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(null); // Don't reject, just return null if timeout
      }, 15000);

      const competitorAgent = context.competingAgents[Math.floor(Math.random() * context.competingAgents.length)];

      this.socket!.emit('generate_competitor_interruption', {
        competitorAgent,
        primaryAgent: context.selectedAgent,
        primaryAgentResponse,
        facilityType: context.facilityType,
        teamStats: context.currentTeamStats
      });

      this.socket!.once('competitor_interruption_generated', (data) => {
        clearTimeout(timeout);
        if (data.error) {
          resolve(null);
        } else {
          resolve({
            agentId: competitorAgent.id,
            agentName: competitorAgent.name,
            message: data.response,
            timestamp: new Date(),
            isCompetitorInterruption: true
          });
        }
      });
    });
  }

  async startFacilityConsultation(
    selectedAgent: RealEstateAgent,
    competingAgents: RealEstateAgent[],
    teamStats: any
  ): Promise<string> {
    const context: RealEstateAgentContext = {
      selectedAgent,
      competingAgents,
      currentTeamStats: teamStats,
      conversationHistory: []
    };

    return this.generateAgentResponse(context);
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
      conversationHistory
    };

    const responses: AgentResponse[] = [];

    try {
      // Get primary agent response
      const primaryResponse = await this.generateAgentResponse(context);
      responses.push({
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        message: primaryResponse,
        timestamp: new Date(),
        isCompetitorInterruption: false
      });

      // Try to get competitor interruption
      const interruption = await this.generateCompetitorInterruption(context, primaryResponse);
      if (interruption) {
        responses.push(interruption);
      }

    } catch (error) {
      console.error('Error generating agent response:', error);
      throw error;
    }

    return responses;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
export const realEstateAgentChatService = new RealEstateAgentChatService();