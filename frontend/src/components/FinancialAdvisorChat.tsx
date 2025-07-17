'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { characterAPI } from '../services/apiClient';
import { Character } from '../data/characters';
// Removed FinancialPromptTemplateService import - now using inline context like other working chats
import ConflictContextService from '../services/conflictContextService';
import EventContextService from '../services/eventContextService';
import { makeFinancialJudgeDecision, FinancialJudgeDecision, FinancialEventContext } from '../data/aiJudgeSystem';
import { financialPsychologyService } from '../services/financialPsychologyService';
import { FinancialPromptTemplateService } from '../data/financialPromptTemplateService';

interface Message {
  id: number;
  type: 'player' | 'character' | 'system' | 'decision';
  content: string;
  timestamp: Date;
  decision?: {
    id: string;
    amount: number;
    options: string[];
    reasoning: string;
    urgency: 'low' | 'medium' | 'high';
  };
}

interface FinancialDecision {
  id: string;
  characterId: string;
  amount: number;
  description: string;
  options: string[];
  characterReasoning: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: Date;
  coachInfluenceAttempts: number;
  finalDecision?: string;
  status: 'pending' | 'decided' | 'influenced';
}

interface EnhancedCharacter extends Character {
  baseName: string;
  financials?: {
    wallet: number;
    financialStress: number;
    coachTrustLevel: number;
    spendingPersonality: string;
    recentDecisions: any[];
    monthlyEarnings: number;
  };
}

interface FinancialAdvisorChatProps {
  selectedCharacterId: string;
  selectedCharacter: EnhancedCharacter | null;
  availableCharacters: EnhancedCharacter[];
  onCharacterChange: (characterId: string) => void;
}

// Helper function to get character ID following the pattern from other chats
const getCharacterId = (character: EnhancedCharacter): string => {
  return character.baseName || character.name?.toLowerCase() || character.id;
};

const FinancialAdvisorChat: React.FC<FinancialAdvisorChatProps> = ({
  selectedCharacterId,
  selectedCharacter,
  availableCharacters,
  onCharacterChange
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<FinancialDecision | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection setup - following the same pattern as other chat components
  useEffect(() => {
    if (!selectedCharacter) return;

    // Disconnect existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    // Determine backend URL based on environment
    let socketUrl: string;
    
    // Check if we're running locally (either in dev or local production build)
    const isLocalhost = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    
    if (isLocalhost) {
      // Local development or local production build
      socketUrl = 'http://localhost:3006';
    } else {
      // Deployed production
      socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://blank-wars-clean-production.up.railway.app';
    }
    
    console.log('🏦 [FinancialAdvisor] Connecting to backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Financial chat connected to server');
      setConnected(true);
      setConnectionError(null);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Financial chat disconnected from server');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError('Failed to connect to chat server');
      setConnected(false);
    });

    socketRef.current.on('auth_success', () => {
      console.log('✅ Financial chat authentication successful');
    });

    socketRef.current.on('auth_error', (error) => {
      console.error('Authentication error:', error);
      setConnectionError('Authentication failed. Please check your login.');
    });

    socketRef.current.on('chat_response', (data) => {
      setIsLoading(false);
      
      if (data.error) {
        const errorMessage: Message = {
          id: Date.now(),
          type: 'system',
          content: `Error: ${data.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message || 'I need a moment to think about that...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, characterMessage]);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      setIsLoading(false);
      const errorMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: `Connection error: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [selectedCharacter]);

  // Generate random financial decisions for characters
  const generateFinancialDecision = (character: EnhancedCharacter): FinancialDecision => {
    const decisionTypes = [
      {
        description: "want to buy a luxury sports car",
        amount: Math.floor(Math.random() * 80000) + 20000,
        options: ["Go for it", "Save up more", "Look for alternatives", "Skip it"],
        reasoning: "I've been winning battles and deserve something nice!"
      },
      {
        description: "am considering investing in cryptocurrency",
        amount: Math.floor(Math.random() * 15000) + 5000,
        options: ["Invest now", "Invest smaller amount", "Research more", "Avoid it"],
        reasoning: "Everyone says crypto is the future, I don't want to miss out!"
      },
      {
        description: "am thinking about renovating my quarters",
        amount: Math.floor(Math.random() * 30000) + 10000,
        options: ["Full renovation", "Partial upgrade", "DIY approach", "Keep as is"],
        reasoning: "My living space affects my performance, I need an upgrade."
      },
      {
        description: "want to start a side business",
        amount: Math.floor(Math.random() * 25000) + 10000,
        options: ["Full investment", "Start small", "Find partners", "Wait longer"],
        reasoning: "I have this great business idea that could make us rich!"
      },
      {
        description: "am considering investing in training facilities",
        amount: Math.floor(Math.random() * 12000) + 3000,
        options: ["Invest fully", "Partial investment", "Share costs", "Skip for now"],
        reasoning: "Better training facilities means better performance in battles."
      }
    ];

    const decision = decisionTypes[Math.floor(Math.random() * decisionTypes.length)];
    
    return {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      characterId: character.id,
      amount: decision.amount,
      description: decision.description,
      options: decision.options,
      characterReasoning: decision.reasoning,
      urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      timestamp: new Date(),
      coachInfluenceAttempts: 0,
      status: 'pending'
    };
  };

  // Process character making a decision based on coach influence
  const processCharacterDecision = async (decision: FinancialDecision, coachInput?: string) => {
    if (!selectedCharacter) return;

    const trustLevel = selectedCharacter.financials?.coachTrustLevel || 50;
    const stressLevel = selectedCharacter.financials?.financialStress || 30;
    const spendingPersonality = selectedCharacter.financials?.spendingPersonality || 'moderate';
    
    // Calculate decision factors
    let decisionScore = Math.random() * 100;
    
    // Adjust based on coach trust
    if (coachInput && trustLevel > 60) {
      decisionScore += 20; // More likely to listen to good advice
    }
    
    // Adjust based on stress (stressed characters make worse decisions)
    if (stressLevel > 70) {
      decisionScore -= 25;
    }
    
    // Adjust based on personality
    if (spendingPersonality === 'impulsive') {
      decisionScore -= 15;
    } else if (spendingPersonality === 'conservative') {
      decisionScore += 15;
    }
    
    // Decision is handled by the WebSocket response
    // Clear the pending decision after processing
    setPendingDecision(null);
    
    return { decisionScore };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedCharacter || !socketRef.current || !connected) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'player',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const characterId = getCharacterId(selectedCharacter);
      
      // Get context services like other working chats
      const eventContextService = EventContextService.getInstance();
      const conflictService = ConflictContextService.getInstance();
      
      console.log('🆔 Financial chat using character ID:', characterId, 'for character:', selectedCharacter.name);
      
      // Try to get living context with graceful error handling
      let livingContext = null;
      try {
        livingContext = await conflictService.generateLivingContext(selectedCharacter.id);
        console.log('✅ Living context loaded for financial chat:', livingContext);
      } catch (error) {
        console.warn('⚠️ Could not generate living context for financial chat:', error);
        livingContext = `Living in team quarters with other legendary figures. Current living situation affects financial decisions and stress levels.`;
      }
      
      // Generate event context for financial domain
      let eventContext = null;
      try {
        const contextString = await eventContextService.getPerformanceContext(characterId);
        if (contextString) {
          eventContext = {
            recentEvents: contextString,
            relationships: '',
            emotionalState: pendingDecision ? 'considering_financial_decision' : 'open_to_advice',
            domainSpecific: 'financial_coaching'
          };
        }
      } catch (error) {
        console.warn('⚠️ Could not generate event context for financial chat:', error);
      }

      // Build financial coaching context inline like other working chats
      const financialPrompt = `You are ${selectedCharacter?.name}, a legendary figure, participating in a financial coaching session with your team's financial advisor.

SESSION TYPE: Financial Advisory and Decision Support

FINANCIAL COACHING CONTEXT:
- Current wallet: $${selectedCharacter.financials?.wallet?.toLocaleString() || '0'}
- Monthly earnings: $${selectedCharacter.financials?.monthlyEarnings?.toLocaleString() || '0'}
- Financial stress level: ${selectedCharacter.financials?.financialStress || 0}%
- Trust in coach: ${selectedCharacter.financials?.coachTrustLevel || 0}%
- Spending personality: ${selectedCharacter.financials?.spendingPersonality || 'moderate'}
- Recent decisions: ${selectedCharacter.financials?.recentDecisions?.length || 0} previous financial choices
${pendingDecision ? `- Pending Decision: ${pendingDecision.description} for $${pendingDecision.amount.toLocaleString()}` : ''}

CHARACTER FINANCIAL PSYCHOLOGY:
- You are a legendary figure from your era, so modern financial concepts might be foreign or fascinating
- React to financial advice based on your background and personality
- Your trust level (${selectedCharacter.financials?.coachTrustLevel || 0}%) affects how you receive coaching
- Your financial stress (${selectedCharacter.financials?.financialStress || 0}%) influences your decision-making
- Your spending personality (${selectedCharacter.financials?.spendingPersonality || 'moderate'}) shapes your money attitudes

FINANCIAL COACHING SESSION GUIDELINES:
- This is specialized financial counseling focused on money decisions and financial wellness
- Respond authentically as ${selectedCharacter?.name} would to financial guidance
- Show your character's relationship with money based on your era and personality
- If stressed about finances, show that emotional state
- Consider the coach's advice through the lens of your character background
- Financial topics include: budgeting, spending decisions, investments, financial goals, money stress

${pendingDecision ? `CURRENT FINANCIAL DECISION:
You are considering: ${pendingDecision.description} for $${pendingDecision.amount.toLocaleString()}
Your reasoning: "${pendingDecision.characterReasoning}"
Options: ${pendingDecision.options.join(', ')}
Urgency: ${pendingDecision.urgency}` : ''}

Respond as ${selectedCharacter?.name} would in a real financial coaching session, showing authentic reactions to money advice while maintaining your character voice and background.`;

      // Emit message through WebSocket following working chat pattern
      socketRef.current.emit('chat_message', {
        message: inputMessage.trim(),
        character: characterId,
        characterData: {
          name: selectedCharacter?.name,
          archetype: selectedCharacter.archetype,
          level: selectedCharacter.level,
          personality: selectedCharacter.personality || {
            traits: ['Money-conscious'],
            speechStyle: 'Direct',
            motivations: ['Financial security'],
            fears: ['Poverty'],
            relationships: []
          },
          // Add living context for conflict awareness
          livingContext: livingContext,
          // Add centralized event context
          eventContext: eventContext,
          // Character stats
          baseStats: selectedCharacter.baseStats,
          combatStats: selectedCharacter.combatStats,
          // Current status
          currentHp: selectedCharacter.combatStats?.health || 100,
          maxHp: selectedCharacter.combatStats?.maxHealth || 100,
          injuries: selectedCharacter.injuries,
          bondLevel: selectedCharacter.displayBondLevel,
          // Financial-specific context
          financialStats: {
            wallet: selectedCharacter.financials?.wallet || 0,
            monthlyEarnings: selectedCharacter.financials?.monthlyEarnings || 0,
            financialStress: selectedCharacter.financials?.financialStress || 0,
            coachTrustLevel: selectedCharacter.financials?.coachTrustLevel || 0,
            spendingPersonality: selectedCharacter.financials?.spendingPersonality || 'moderate',
            recentDecisions: selectedCharacter.financials?.recentDecisions || []
          },
          // Pending decision context
          pendingFinancialDecision: pendingDecision,
          // Add comprehensive financial coaching conversation context like CoachingSessionChat
          conversationContext: `${financialPrompt}`,
          
          // Domain-specific coaching context enhanced with proper templates
          sessionContext: {
            type: 'financial_advisory',
            hasDecision: !!pendingDecision,
            focusAreas: ['Financial planning', 'Money decisions', 'Spending habits', 'Financial stress', 'Investment choices', 'Budgeting'],
            coachingApproach: 'Character-specific financial guidance with era-appropriate perspectives'
          }
        },
        previousMessages: messages.slice(-5).map(msg => ({
          role: msg.type === 'player' ? 'user' : 'assistant',
          content: msg.content
        }))
      });

      // Note: Don't automatically process decisions here - let the coach use the preset buttons
      // The processCharacterDecision function will be called from handlePresetDecision instead
      
      // Decision generation is now only done once per character selection in the initial greeting
    } catch (error) {
      console.error('Error in financial chat:', error);
      const errorMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: `Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };


  const getCharacterContext = (character: EnhancedCharacter) => {
    return {
      financialStatus: {
        wallet: character.financials?.wallet || 19073,
        stress: character.financials?.financialStress || 30,
        trust: character.financials?.coachTrustLevel || 50,
        spendingStyle: character.financials?.spendingPersonality || 'moderate'
      },
      recentDecisions: character.financials?.recentDecisions || [],
      monthlyEarnings: character.financials?.monthlyEarnings || 6055
    };
  };

  const shouldAutomate = (decision: FinancialDecision, character: EnhancedCharacter): 'bad' | 'good' | null => {
    const wallet = character.financials?.wallet || 19073;
    const stress = character.financials?.financialStress || 30;
    const trust = character.financials?.coachTrustLevel || 50;
    const monthlyEarnings = character.financials?.monthlyEarnings || 6055;
    
    // Calculate decision amount as percentage of available funds
    const percentOfWallet = (decision.amount / wallet) * 100;
    const percentOfMonthlyEarnings = (decision.amount / monthlyEarnings) * 100;
    
    // EXTREMELY RESTRICTIVE automated decisions - almost never automate
    // The coaching interaction is the core gameplay experience
    
    // Only automate VERY obvious tiny purchases
    if (percentOfWallet < 2 && percentOfMonthlyEarnings < 10 && decision.amount < 500) return 'good'; // Tiny purchases like coffee
    
    // Only automate completely impossible purchases (10x wallet amount)
    if (decision.amount > wallet * 10) return 'bad'; // Impossible purchases like $200k car with $19k wallet
    
    // Everything else goes to manual coaching - this is the core gameplay
    // Even "can't afford" decisions should be shown to coach for educational value
    return null;
  };

  const processDecisionOutcome = async (decision: FinancialDecision, coachDecision: 'rejected' | 'approved' | 'character_choice', trustLevel: number, stressLevel: number) => {
    if (!selectedCharacter) return null;

    const characterFinancials = selectedCharacter.financials || {
      wallet: 19073,
      financialStress: stressLevel,
      coachTrustLevel: trustLevel,
      spendingPersonality: 'moderate',
      recentDecisions: [],
      monthlyEarnings: 6055
    };

    let outcome: any;

    if (coachDecision === 'rejected') {
      // Coach rejected - determine if character listens
      const listenChance = Math.min(trustLevel * 0.8, 80); // Max 80% chance to listen
      const characterListens = Math.random() * 100 < listenChance;

      if (characterListens) {
        outcome = {
          result: 'decision_avoided',
          financialImpact: 0,
          stressChange: -5, // Slightly less stress from avoiding bad decision
          trustChange: 5, // Trust increases when coach saves them
          message: `You convinced me to reconsider. I'll hold off on this decision for now.`
        };
      } else {
        // Character ignores advice - use AI judge for outcome
        const judgeContext: FinancialEventContext = {
          characterId: selectedCharacter.id,
          eventType: 'decision',
          financialImpact: decision.amount,
          stressLevel: stressLevel,
          battleContext: undefined,
          coachAdvice: 'rejected'
        };

        const judgeRuling = makeFinancialJudgeDecision(judgeContext, decision, undefined);

        outcome = {
          result: 'ignored_advice',
          financialImpact: -Math.floor(decision.amount * 0.3), // 30% loss for ignoring advice
          stressChange: 20, // High stress from bad decision
          trustChange: -10, // Trust decreases when they ignore advice
          message: `I appreciate your concern, but I'm going to do this anyway. ${judgeRuling.commentary}`
        };
      }
    } else if (coachDecision === 'approved') {
      // Coach approved - simulate positive outcome
      const successChance = Math.max(70 - stressLevel * 0.3, 30); // Stress reduces success chance
      const isSuccessful = Math.random() * 100 < successChance;

      if (isSuccessful) {
        outcome = {
          result: 'successful_decision',
          financialImpact: Math.floor(decision.amount * 0.1), // 10% return on investment
          stressChange: -10, // Stress decreases with success
          trustChange: 8, // Trust increases with good advice
          message: `Thanks for the support! This turned out to be a great decision.`
        };
      } else {
        outcome = {
          result: 'failed_decision',
          financialImpact: -Math.floor(decision.amount * 0.2), // 20% loss
          stressChange: 15, // Stress increases with failure
          trustChange: -5, // Trust decreases slightly
          message: `Even with your support, this didn't work out as expected. I'm frustrated.`
        };
      }
    } else {
      // Character's choice - let AI judge decide outcome
      const judgeContext: FinancialEventContext = {
        characterId: selectedCharacter.id,
        eventType: 'decision',
        financialImpact: decision.amount,
        stressLevel: stressLevel,
        battleContext: undefined,
        coachAdvice: 'neutral'
      };

      const judgeRuling = makeFinancialJudgeDecision(judgeContext, decision, undefined);

      // Simulate outcome based on AI judge's risk assessment
      let financialMultiplier = 0;
      let stressMultiplier = 0;
      let trustMultiplier = 0;

      switch (judgeRuling.riskAssessment) {
        case 'excellent':
          financialMultiplier = 0.15; // 15% gain
          stressMultiplier = -15; // Stress decreases
          trustMultiplier = 2; // Small trust increase
          break;
        case 'good':
          financialMultiplier = 0.05; // 5% gain
          stressMultiplier = -5; // Slight stress decrease
          trustMultiplier = 1; // Minimal trust increase
          break;
        case 'questionable':
          financialMultiplier = -0.05; // 5% loss
          stressMultiplier = 10; // Stress increases
          trustMultiplier = 0; // No trust change
          break;
        case 'poor':
          financialMultiplier = -0.25; // 25% loss
          stressMultiplier = 20; // High stress
          trustMultiplier = -3; // Trust decreases
          break;
        case 'catastrophic':
          financialMultiplier = -0.5; // 50% loss
          stressMultiplier = 30; // Very high stress
          trustMultiplier = -5; // Significant trust decrease
          break;
      }

      outcome = {
        result: 'independent_choice',
        financialImpact: Math.floor(decision.amount * financialMultiplier),
        stressChange: stressMultiplier,
        trustChange: trustMultiplier,
        message: `I made my own call on this one. ${judgeRuling.commentary}`
      };
    }

    // Helper function to update local state
    const updateLocalFinancialState = () => {
      if (selectedCharacter.financials) {
        selectedCharacter.financials.wallet += outcome.financialImpact;
        selectedCharacter.financials.financialStress = Math.max(0, Math.min(100, selectedCharacter.financials.financialStress + outcome.stressChange));
        selectedCharacter.financials.coachTrustLevel = Math.max(0, Math.min(100, selectedCharacter.financials.coachTrustLevel + outcome.trustChange));
        selectedCharacter.financials.recentDecisions.push({
          decision: decision.description,
          amount: decision.amount,
          coachDecision,
          outcome: outcome.result,
          timestamp: new Date()
        });
      }
    };

    // Update character stats in backend
    try {
      await characterAPI.updateFinancials(selectedCharacter.id, {
        wallet: (selectedCharacter.financials?.wallet || 0) + outcome.financialImpact,
        financialStress: Math.max(0, Math.min(100, (selectedCharacter.financials?.financialStress || 0) + outcome.stressChange)),
        coachTrustLevel: Math.max(0, Math.min(100, (selectedCharacter.financials?.coachTrustLevel || 0) + outcome.trustChange))
      });
      
      await characterAPI.saveDecision(selectedCharacter.id, {
        decision: decision.description,
        amount: decision.amount,
        coachDecision,
        outcome: outcome.result,
        timestamp: new Date()
      });
      
      console.log('Financial decision saved to backend successfully');
    } catch (error) {
      console.error('Failed to save financial decision:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: '⚠️ Unable to save decision to server. Changes saved locally only.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    // Always update local state for immediate UI feedback
    updateLocalFinancialState();

    return outcome;
  };

  const handlePresetDecision = async (decisionType: 'bad' | 'good' | 'character_choice') => {
    if (!pendingDecision || !selectedCharacter) return;

    const trustLevel = selectedCharacter.financials?.coachTrustLevel || 50;
    const stressLevel = selectedCharacter.financials?.financialStress || 30;
    
    let outcome: any;
    let coachMessage: string;
    
    if (decisionType === 'bad') {
      // Coach rejects the decision
      outcome = await processDecisionOutcome(pendingDecision, 'rejected', trustLevel, stressLevel);
      coachMessage = `I strongly advise against this decision. The risks outweigh the benefits, and given your current financial situation, this could lead to significant problems. Let's explore better alternatives.`;
    } else if (decisionType === 'good') {
      // Coach approves the decision
      outcome = await processDecisionOutcome(pendingDecision, 'approved', trustLevel, stressLevel);
      coachMessage = `This looks like a solid financial decision. Based on your budget and goals, I think this is a wise choice. Go ahead with confidence.`;
    } else {
      // Character's choice - let AI judge decide
      outcome = await processDecisionOutcome(pendingDecision, 'character_choice', trustLevel, stressLevel);
      coachMessage = `I understand you want to make this decision yourself. That's your choice, and I respect that. Let me know how it goes.`;
    }

    // Add coach message to chat
    const coachResponseMessage: Message = {
      id: Date.now(),
      type: 'player',
      content: coachMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, coachResponseMessage]);

    // Send through WebSocket for character response
    if (socketRef.current && connected) {
      setIsLoading(true);
      
      // Use the same format as handleSendMessage for consistency
      const characterId = getCharacterId(selectedCharacter);
      
      // Get living context and event context for robust response
      const getLivingContext = async () => {
        try {
          const conflictService = ConflictContextService.getInstance();
          return await conflictService.generateLivingContext(selectedCharacter.id);
        } catch (error) {
          console.warn('⚠️ Could not generate living context:', error);
          return `Living in team quarters with other legendary figures. Current living situation affects financial decisions and stress levels.`;
        }
      };

      const getEventContext = async () => {
        try {
          const eventContextService = EventContextService.getInstance();
          return await eventContextService.generateEventContext(selectedCharacter.id, {
            emotionalState: 'processing_financial_decision',
            domainSpecific: 'financial_coaching'
          });
        } catch (error) {
          console.warn('⚠️ Could not generate event context:', error);
          return null;
        }
      };

      // Get contexts and send message
      const sendMessage = async () => {
        const livingContext = await getLivingContext();
        const eventContext = await getEventContext();

        // Use the proper FinancialPromptTemplateService
        const financialPrompt = FinancialPromptTemplateService.generatePrompt({
          characterId: selectedCharacter.id,
          characterName: selectedCharacter.name,
          coachInput: coachMessage,
          financialState: {
            wallet: selectedCharacter.financials?.wallet || 0,
            monthlyEarnings: selectedCharacter.financials?.monthlyEarnings || 0,
            financialStress: selectedCharacter.financials?.financialStress || 0,
            coachTrustLevel: selectedCharacter.financials?.coachTrustLevel || 0,
            spendingPersonality: selectedCharacter.financials?.spendingPersonality || 'moderate',
            recentDecisions: selectedCharacter.financials?.recentDecisions || []
          },
          decision: pendingDecision ? {
            id: pendingDecision.id,
            description: pendingDecision.description,
            amount: pendingDecision.amount,
            options: pendingDecision.options,
            reasoning: pendingDecision.characterReasoning,
            urgency: pendingDecision.urgency
          } : undefined,
          conversationType: 'advice'
        });

        console.log('🔧 Sending preset decision message:', {
          message: coachMessage,
          character: characterId,
          decisionType,
          outcome,
          isConnected: connected
        });

        socketRef.current.emit('chat_message', {
          message: coachMessage,
          character: characterId,
          characterData: {
            name: selectedCharacter?.name,
            archetype: selectedCharacter.archetype,
            level: selectedCharacter.level,
            personality: selectedCharacter.personality || {
              traits: ['Money-conscious'],
              speechStyle: 'Direct',
              motivations: ['Financial security'],
              fears: ['Poverty'],
              relationships: []
            },
            // Add living context and event context
            livingContext: livingContext,
            eventContext: eventContext,
            // Add financial coaching context
            conversationContext: financialPrompt,
            // Character stats
            baseStats: selectedCharacter.baseStats,
            combatStats: selectedCharacter.combatStats,
            // Current status
            currentHp: selectedCharacter.combatStats?.health || 100,
            maxHp: selectedCharacter.combatStats?.maxHealth || 100,
            injuries: selectedCharacter.injuries,
            bondLevel: selectedCharacter.displayBondLevel,
            // Financial-specific context
            financialStats: {
              wallet: selectedCharacter.financials?.wallet || 0,
              monthlyEarnings: selectedCharacter.financials?.monthlyEarnings || 0,
              financialStress: selectedCharacter.financials?.financialStress || 0,
              coachTrustLevel: selectedCharacter.financials?.coachTrustLevel || 0,
              spendingPersonality: selectedCharacter.financials?.spendingPersonality || 'moderate',
              recentDecisions: selectedCharacter.financials?.recentDecisions || []
            },
            // Pending decision context (should be null after decision is made)
            pendingFinancialDecision: null,
            // Decision context
            decisionOutcome: outcome,
            coachDecision: decisionType,
            
            // Domain-specific coaching context enhanced with proper templates
            sessionContext: {
              type: 'financial_advisory',
              hasDecision: false, // Decision was just processed
              focusAreas: ['Financial planning', 'Money decisions', 'Spending habits', 'Financial stress', 'Investment choices', 'Budgeting'],
              coachingApproach: 'Character-specific financial guidance with era-appropriate perspectives'
            }
          },
          previousMessages: messages.slice(-5).map(msg => ({
            role: msg.type === 'player' ? 'user' : 'assistant',
            content: msg.content
          }))
        });
      };

      sendMessage().catch(error => {
        console.error('❌ Error sending preset decision message:', error);
        setIsLoading(false);
      });
    }

    // Clear pending decision
    setPendingDecision(null);
  };

  // Generate initial greeting when character is selected
  useEffect(() => {
    if (selectedCharacter && messages.length === 0 && !pendingDecision && socketRef.current && connected) {
      // Send initial greeting through WebSocket
      const initializeChat = async () => {
        try {
          const characterId = getCharacterId(selectedCharacter);
          const conflictService = ConflictContextService.getInstance();
          const eventContextService = EventContextService.getInstance();
          
          console.log('🆔 Financial greeting using character ID:', characterId, 'for character:', selectedCharacter.name);
          
          // Try to get living context with graceful error handling
          let livingContext = null;
          try {
            livingContext = await conflictService.generateLivingContext(selectedCharacter.id);
            console.log('✅ Living context loaded for financial greeting:', livingContext);
          } catch (error) {
            console.warn('⚠️ Could not generate living context for financial greeting:', error);
            livingContext = `Living in team quarters with other legendary figures. Current living situation affects financial decisions and stress levels.`;
          }
          
          // Generate event context for initial greeting
          let eventContext = null;
          try {
            const contextString = await eventContextService.getPerformanceContext(characterId);
            if (contextString) {
              eventContext = {
                recentEvents: contextString,
                relationships: '',
                emotionalState: 'meeting_financial_coach',
                domainSpecific: 'financial_coaching_greeting'
              };
            }
          } catch (error) {
            console.warn('⚠️ Could not generate event context for financial greeting:', error);
          }

          // Generate proper financial coaching context for greeting
          const greetingMessage = "Hello! I wanted to talk to you about your finances.";
          const greetingPrompt = `You are ${selectedCharacter?.name}, a legendary figure, meeting with your team's financial advisor for the first time.

SESSION TYPE: Financial Advisory Introduction

FINANCIAL COACHING CONTEXT:
- Current wallet: $${selectedCharacter.financials?.wallet?.toLocaleString() || '0'}
- Monthly earnings: $${selectedCharacter.financials?.monthlyEarnings?.toLocaleString() || '0'}
- Financial stress level: ${selectedCharacter.financials?.financialStress || 0}%
- Trust in coach: ${selectedCharacter.financials?.coachTrustLevel || 0}%
- Spending personality: ${selectedCharacter.financials?.spendingPersonality || 'moderate'}
- Recent decisions: ${selectedCharacter.financials?.recentDecisions?.length || 0} previous financial choices

CHARACTER FINANCIAL PSYCHOLOGY:
- You are a legendary figure from your era, so modern financial concepts might be foreign or fascinating
- React to financial advice based on your background and personality
- Your trust level (${selectedCharacter.financials?.coachTrustLevel || 0}%) affects how you receive coaching
- Your financial stress (${selectedCharacter.financials?.financialStress || 0}%) influences your openness
- Your spending personality (${selectedCharacter.financials?.spendingPersonality || 'moderate'}) shapes your money attitudes

FINANCIAL COACHING SESSION GUIDELINES:
- This is the start of a financial coaching relationship
- Respond authentically as ${selectedCharacter?.name} would to meeting a financial advisor
- Show your character's initial reaction to financial guidance based on your era and personality
- Consider whether you'd be skeptical, curious, defensive, or eager about financial help
- Your response sets the tone for the financial coaching relationship

Respond as ${selectedCharacter?.name} would when first meeting a financial coach, showing authentic reactions based on your character background and relationship with money.`;

          socketRef.current.emit('chat_message', {
            message: greetingMessage,
            character: characterId,
            characterData: {
              name: selectedCharacter?.name,
              archetype: selectedCharacter.archetype,
              level: selectedCharacter.level,
              personality: selectedCharacter.personality || {
                traits: ['Money-conscious'],
                speechStyle: 'Direct',
                motivations: ['Financial security'],
                fears: ['Poverty'],
                relationships: []
              },
              // Add living context for conflict awareness
              livingContext: livingContext,
              // Add centralized event context
              eventContext: eventContext,
              // Character stats
              baseStats: selectedCharacter.baseStats,
              combatStats: selectedCharacter.combatStats,
              // Current status
              currentHp: selectedCharacter.combatStats?.health || 100,
              maxHp: selectedCharacter.combatStats?.maxHealth || 100,
              injuries: selectedCharacter.injuries,
              bondLevel: selectedCharacter.displayBondLevel,
              // Financial-specific context
              financialStats: {
                wallet: selectedCharacter.financials?.wallet || 0,
                monthlyEarnings: selectedCharacter.financials?.monthlyEarnings || 0,
                financialStress: selectedCharacter.financials?.financialStress || 0,
                coachTrustLevel: selectedCharacter.financials?.coachTrustLevel || 0,
                spendingPersonality: selectedCharacter.financials?.spendingPersonality || 'moderate',
                recentDecisions: selectedCharacter.financials?.recentDecisions || []
              },
              // Add comprehensive financial coaching conversation context like CoachingSessionChat
              conversationContext: `${greetingPrompt}`,
              
              // Domain-specific coaching context enhanced with proper templates
              sessionContext: {
                type: 'financial_advisory',
                hasDecision: false,
                focusAreas: ['Financial planning', 'Money decisions', 'Initial assessment', 'Trust building'],
                coachingApproach: 'Character-specific financial introduction with era-appropriate perspectives',
                sessionStage: 'greeting'
              }
            },
            previousMessages: []
          });
        } catch (error) {
          console.error('Failed to initialize financial chat:', error);
          const errorMessage: Message = {
            id: Date.now(),
            type: 'system',
            content: `Error initializing chat: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          };
          setMessages([errorMessage]);
        }
      };

      initializeChat();
      
      // Generate an initial decision after a short delay
      const timeoutId = setTimeout(async () => {
        if (!pendingDecision) { // Double check to prevent race conditions
          const decision = generateFinancialDecision(selectedCharacter);
          
          // Check if this should be automated
          const autoDecision = shouldAutomate(decision, selectedCharacter);
          
          console.log('🤖 Initial decision automation check:', {
            decision: decision.description,
            amount: decision.amount,
            wallet: selectedCharacter.financials?.wallet || 19073,
            autoDecision,
            percentOfWallet: ((decision.amount / (selectedCharacter.financials?.wallet || 19073)) * 100).toFixed(1) + '%'
          });
          
          if (autoDecision) {
            // Process automatically without showing to user
            const outcome = await processDecisionOutcome(decision, autoDecision === 'bad' ? 'rejected' : 'approved', selectedCharacter.financials?.coachTrustLevel || 50, selectedCharacter.financials?.financialStress || 30);
            
            const autoMessage: Message = {
              id: Date.now() + 1,
              type: 'system',
              content: `${selectedCharacter.name} ${autoDecision === 'bad' ? 'decided against' : 'went ahead with'} ${decision.description} (${autoDecision === 'bad' ? 'clearly risky' : 'obviously good'} decision). ${outcome?.message || ''}`,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, autoMessage]);
          } else {
            // Show to user for manual coaching
            setPendingDecision(decision);
            
            const decisionMessage: Message = {
              id: Date.now() + 1,
              type: 'decision',
              content: `Oh, by the way coach... I've been thinking. I ${decision.description} for about $${decision.amount.toLocaleString()}. ${decision.characterReasoning} What do you think I should do?`,
              timestamp: new Date(),
              decision: {
                id: decision.id,
                amount: decision.amount,
                options: decision.options,
                reasoning: decision.characterReasoning,
                urgency: decision.urgency
              }
            };
            
            setMessages(prev => [...prev, decisionMessage]);
          }
        }
      }, 8000); // Wait longer for initial greeting to complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCharacter, connected]);

  if (!selectedCharacter) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Select a character to start financial coaching</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Financial Advisor Chat with {selectedCharacter.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {connected ? 'Connected' : connectionError || 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Financial Status Bar */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-700/30 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-400">Wallet</div>
          <div className="text-lg font-bold text-green-400">${selectedCharacter.financials?.wallet?.toLocaleString() || '0'}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Stress</div>
          <div className={`text-lg font-bold ${(selectedCharacter.financials?.financialStress || 0) > 50 ? 'text-red-400' : 'text-blue-400'}`}>
            {selectedCharacter.financials?.financialStress || 0}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Trust</div>
          <div className="text-lg font-bold text-purple-400">{selectedCharacter.financials?.coachTrustLevel || 0}%</div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-900/30 rounded-lg">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === 'player' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
              message.type === 'player' 
                ? 'bg-green-600 text-white' 
                : message.type === 'decision'
                ? 'bg-yellow-600/80 text-white border-2 border-yellow-400'
                : 'bg-gray-700 text-gray-100'
            }`}>
              {message.type === 'decision' && (
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Financial Decision</span>
                </div>
              )}
              <p className="text-sm">{message.content}</p>
              {message.decision && (
                <div className="mt-2 pt-2 border-t border-yellow-300/30">
                  <div className="text-xs text-yellow-200">
                    <strong>Options:</strong> {message.decision.options.join(', ')}
                  </div>
                  <div className="text-xs text-yellow-200 mt-1">
                    <strong>Urgency:</strong> {message.decision.urgency}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>


      {/* Preset Decision Buttons */}
      {pendingDecision && (
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Coach recommendation:</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePresetDecision('bad')}
              className="p-3 bg-red-600/20 border border-red-500 rounded-lg text-sm text-red-300 hover:bg-red-600/30 transition-all flex flex-col items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Bad Decision</span>
              <span className="text-xs opacity-75">Reject & explain risks</span>
            </button>
            <button
              onClick={() => handlePresetDecision('good')}
              className="p-3 bg-green-600/20 border border-green-500 rounded-lg text-sm text-green-300 hover:bg-green-600/30 transition-all flex flex-col items-center gap-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Good Decision</span>
              <span className="text-xs opacity-75">Approve & support</span>
            </button>
            <button
              onClick={() => handlePresetDecision('character_choice')}
              className="p-3 bg-blue-600/20 border border-blue-500 rounded-lg text-sm text-blue-300 hover:bg-blue-600/30 transition-all flex flex-col items-center gap-1"
            >
              <DollarSign className="w-4 h-4" />
              <span>Character's Choice</span>
              <span className="text-xs opacity-75">Let them decide</span>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={pendingDecision ? "Give financial advice..." : "Chat with your character..."}
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
          disabled={isLoading || !connected}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputMessage.trim() || !connected}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FinancialAdvisorChat;