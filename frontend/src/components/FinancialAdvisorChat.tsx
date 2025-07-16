'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { characterAPI } from '../services/apiClient';
import { Character } from '../data/characters';
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

// Live Agent API call using existing chat system
const callLiveAgent = async (context: {
  characterId: string;
  characterName: string;
  decision: FinancialDecision;
  coachInput: string;
  characterContext: {
    wallet: number;
    trustLevel: number;
    stressLevel: number;
    spendingPersonality: string;
    recentDecisions: any[];
  };
  decisionScore: number;
}) => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.blankwars.com/v1';
  
  // Format the financial decision context for the AI agent
  const financialContext = `FINANCIAL_DECISION_CONTEXT:
Character: ${context.characterName}
Decision: ${context.decision.description}
Amount: $${context.decision.amount.toLocaleString()}
Options: ${context.decision.options.join(', ')}
Character Reasoning: ${context.decision.characterReasoning}
Urgency: ${context.decision.urgency}

Character Financial State:
- Wallet: $${context.characterContext.wallet.toLocaleString()}
- Stress Level: ${context.characterContext.stressLevel}%
- Trust in Coach: ${context.characterContext.trustLevel}%
- Spending Personality: ${context.characterContext.spendingPersonality}
- Recent Decisions: ${context.characterContext.recentDecisions.length}

Coach Input: "${context.coachInput}"
Decision Score: ${context.decisionScore}

Please respond as ${context.characterName} making this financial decision. Choose one of the options and explain your reasoning based on your personality, the coach's advice, and your current financial situation.`;

  const response = await fetch(`${BASE_URL}/chat/${context.characterId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify({
      message: financialContext,
      context: {
        financial_decision: true,
        decision_score: context.decisionScore,
        wallet: context.characterContext.wallet,
        stress_level: context.characterContext.stressLevel,
        trust_level: context.characterContext.trustLevel
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  // Parse the AI response to extract choice and reasoning
  const characterResponse = result.message.character_response;
  
  // Parse choice from response - no fallbacks
  let choice = '';
  for (const option of context.decision.options) {
    if (characterResponse.toLowerCase().includes(option.toLowerCase())) {
      choice = option;
      break;
    }
  }
  
  if (!choice) {
    throw new Error(`Character response did not contain a valid choice: ${characterResponse}`);
  }

  return {
    choice: choice,
    reasoning: characterResponse,
    confidence: result.message.response_type === 'ai' ? 0.8 : 0.6,
    agent_id: result.message.response_type
  };
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pendingDecision, setPendingDecision] = useState<FinancialDecision | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate random financial decisions for characters
  const generateFinancialDecision = (character: EnhancedCharacter): FinancialDecision => {
    const decisionTypes = [
      {
        description: "wants to buy a luxury sports car",
        amount: Math.floor(Math.random() * 80000) + 20000,
        options: ["Buy it now", "Save for 6 months", "Buy used instead", "Skip it entirely"],
        reasoning: "I've been winning battles and deserve something nice!"
      },
      {
        description: "considering investing in cryptocurrency",
        amount: Math.floor(Math.random() * 15000) + 5000,
        options: ["Invest everything", "Invest half", "Research more first", "Avoid crypto"],
        reasoning: "Everyone says crypto is the future, I don't want to miss out!"
      },
      {
        description: "thinking about renovating their quarters",
        amount: Math.floor(Math.random() * 30000) + 10000,
        options: ["Full renovation", "Basic updates", "DIY approach", "Keep it simple"],
        reasoning: "My living space affects my performance, I need an upgrade."
      },
      {
        description: "wants to start a side business",
        amount: Math.floor(Math.random() * 25000) + 10000,
        options: ["Invest fully", "Start small", "Partner with someone", "Wait and learn"],
        reasoning: "I have this great business idea that could make us rich!"
      },
      {
        description: "considering expensive training equipment",
        amount: Math.floor(Math.random() * 12000) + 3000,
        options: ["Buy premium gear", "Buy mid-range", "Buy used", "Train without it"],
        reasoning: "Better equipment means better performance in battles."
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

  // Simulate character making a decision based on coach influence
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
    
    // Determine if we need API or can decide locally
    const needsAPIDecision = decisionScore > 35 && decisionScore < 65; // Edge cases
    
    let finalChoice: string;
    let reasoning: string;
    
    if (needsAPIDecision) {
      // Call real agent API for edge cases
      console.log('🤖 Edge case detected - calling live agent API');
      const apiResponse = await callLiveAgent({
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
        decision: decision,
        coachInput: coachInput || '',
        characterContext: {
          wallet: selectedCharacter.financials?.wallet || 0,
          trustLevel: trustLevel,
          stressLevel: stressLevel,
          spendingPersonality: spendingPersonality,
          recentDecisions: selectedCharacter.financials?.recentDecisions || []
        },
        decisionScore: decisionScore
      });
      
      finalChoice = apiResponse.choice;
      reasoning = apiResponse.reasoning;
      console.log(`🎯 Live agent decision: ${finalChoice} (Confidence: ${apiResponse.confidence})`);
    } else {
      // Local decision via chat API
      const prompt = FinancialPromptTemplateService.generatePrompt({
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
        coachInput: coachInput || '',
        financialState: {
          wallet: selectedCharacter.financials?.wallet || 0,
          monthlyEarnings: selectedCharacter.financials?.monthlyEarnings || 0,
          financialStress: stressLevel,
          coachTrustLevel: trustLevel,
          spendingPersonality: spendingPersonality,
          recentDecisions: selectedCharacter.financials?.recentDecisions || []
        },
        decision: decision,
        conversationType: 'decision'
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.blankwars.com/v1'}/chat/${selectedCharacter.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          message: prompt,
          context: {
            financial_decision: true,
            decision_score: decisionScore,
            wallet: selectedCharacter.financials?.wallet || 0,
            stress_level: stressLevel,
            trust_level: trustLevel
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const characterResponse = result.message.character_response;
      
      // Parse the choice from response - no fallbacks
      let choice = '';
      for (const option of decision.options) {
        if (characterResponse.toLowerCase().includes(option.toLowerCase())) {
          choice = option;
          break;
        }
      }
      
      if (!choice) {
        throw new Error(`Character response did not contain a valid choice: ${characterResponse}`);
      }

      finalChoice = choice;
      reasoning = characterResponse;
    }
    
    // Add decision result message
    const decisionMessage: Message = {
      id: Date.now(),
      type: 'character',
      content: `I've decided to: ${finalChoice}. ${reasoning}${needsAPIDecision ? ' 🤖' : ''}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, decisionMessage]);
    setPendingDecision(null);
    
    // Update character's financial state
    // TODO: Implement financial impact calculations
    
    return { choice: finalChoice, reasoning, decisionScore };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedCharacter) return;

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
      // If there's a pending decision, process coach influence
      if (pendingDecision) {
        await processCharacterDecision(pendingDecision, inputMessage.trim());
      } else {
        // Regular conversation - use real chat API with prompt service
        const prompt = FinancialPromptTemplateService.generatePrompt({
          characterId: selectedCharacter.id,
          characterName: selectedCharacter.name,
          coachInput: inputMessage.trim(),
          financialState: {
            wallet: selectedCharacter.financials?.wallet || 0,
            monthlyEarnings: selectedCharacter.financials?.monthlyEarnings || 0,
            financialStress: selectedCharacter.financials?.financialStress || 0,
            coachTrustLevel: selectedCharacter.financials?.coachTrustLevel || 0,
            spendingPersonality: selectedCharacter.financials?.spendingPersonality || 'moderate',
            recentDecisions: selectedCharacter.financials?.recentDecisions || []
          },
          conversationType: 'advice'
        });

        const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.blankwars.com/v1'}/chat/${selectedCharacter.id}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            message: prompt,
            context: {
              coaching_session: 'financial_advisory',
              wallet: selectedCharacter.financials?.wallet || 0,
              stress_level: selectedCharacter.financials?.financialStress || 0,
              trust_level: selectedCharacter.financials?.coachTrustLevel || 0
            }
          })
        });

        if (!chatResponse.ok) {
          throw new Error(`Chat API failed: ${chatResponse.status} ${chatResponse.statusText}`);
        }

        const chatResult = await chatResponse.json();
        const characterResponse: Message = {
          id: Date.now() + 1,
          type: 'character',
          content: chatResult.message.character_response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, characterResponse]);
        
        // Only generate a new decision if there isn't already one pending
        if (!pendingDecision && Math.random() > 0.7) {
          setTimeout(async () => {
            const newDecision = generateFinancialDecision(selectedCharacter);
            setPendingDecision(newDecision);
            
            // Generate decision announcement via chat API
            const decisionPrompt = `You are ${selectedCharacter.name}. You've just thought of a financial decision: ${newDecision.description} for $${newDecision.amount.toLocaleString()}. Your reasoning: "${newDecision.characterReasoning}". Tell your coach about this decision in character, asking for their input.`;
            
            const decisionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.blankwars.com/v1'}/chat/${selectedCharacter.id}/message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              },
              body: JSON.stringify({
                message: decisionPrompt,
                context: {
                  financial_decision_announcement: true,
                  amount: newDecision.amount,
                  decision_type: newDecision.description
                }
              })
            });

            if (!decisionResponse.ok) {
              console.error(`Decision announcement API failed: ${decisionResponse.status}`);
              return;
            }

            const decisionResult = await decisionResponse.json();
            const decisionMessage: Message = {
              id: Date.now() + 10,
              type: 'decision',
              content: decisionResult.message.character_response,
              timestamp: new Date(),
              decision: {
                id: newDecision.id,
                amount: newDecision.amount,
                options: newDecision.options,
                reasoning: newDecision.characterReasoning,
                urgency: newDecision.urgency
              }
            };
            
            setMessages(prev => [...prev, decisionMessage]);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error in financial chat:', error);
      const errorMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: `Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = (response: string) => {
    setInputMessage(response);
  };

  // Generate initial greeting when character is selected
  useEffect(() => {
    if (selectedCharacter && messages.length === 0 && !pendingDecision) {
      // Send initial greeting through real chat API
      const initializeChat = async () => {
        try {
          const prompt = FinancialPromptTemplateService.generatePrompt({
            characterId: selectedCharacter.id,
            characterName: selectedCharacter.name,
            coachInput: "Hello! I wanted to talk to you about your finances.",
            financialState: {
              wallet: selectedCharacter.financials?.wallet || 0,
              monthlyEarnings: selectedCharacter.financials?.monthlyEarnings || 0,
              financialStress: selectedCharacter.financials?.financialStress || 0,
              coachTrustLevel: selectedCharacter.financials?.coachTrustLevel || 0,
              spendingPersonality: selectedCharacter.financials?.spendingPersonality || 'moderate',
              recentDecisions: selectedCharacter.financials?.recentDecisions || []
            },
            conversationType: 'greeting'
          });

          console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
          console.log('Character ID:', selectedCharacter.id);
          console.log('Full URL:', `${process.env.NEXT_PUBLIC_API_URL || 'https://api.blankwars.com/v1'}/chat/${selectedCharacter.id}/message`);
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.blankwars.com/v1'}/chat/${selectedCharacter.id}/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({
              message: prompt,
              context: {
                coaching_session: 'financial_advisory',
                session_start: true,
                wallet: selectedCharacter.financials?.wallet || 0,
                stress_level: selectedCharacter.financials?.financialStress || 0,
                trust_level: selectedCharacter.financials?.coachTrustLevel || 0
              }
            })
          });

          if (!response.ok) {
            throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();
          const initialMessage: Message = {
            id: Date.now(),
            type: 'character',
            content: result.message.character_response,
            timestamp: new Date()
          };
          setMessages([initialMessage]);
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
          setPendingDecision(decision);
          
          // Generate decision announcement via chat API
          const decisionPrompt = `You are ${selectedCharacter.name}. You've just thought of a financial decision: ${decision.description} for $${decision.amount.toLocaleString()}. Your reasoning: "${decision.characterReasoning}". Tell your coach about this decision in character, asking for their input.`;
          
          const decisionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.blankwars.com/v1'}/chat/${selectedCharacter.id}/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({
              message: decisionPrompt,
              context: {
                financial_decision_announcement: true,
                amount: decision.amount,
                decision_type: decision.description
              }
            })
          });

          if (!decisionResponse.ok) {
            console.error(`Initial decision announcement API failed: ${decisionResponse.status}`);
            return;
          }

          const decisionResult = await decisionResponse.json();
          const decisionMessage: Message = {
            id: Date.now() + 1,
            type: 'decision',
            content: decisionResult.message.character_response,
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
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCharacter]);

  if (!selectedCharacter) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Select a character to start financial coaching</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <DollarSign className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">Financial Advisor Chat with {selectedCharacter.name}</h3>
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

      {/* Quick Response Buttons */}
      {pendingDecision && (
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Quick responses:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickResponse("That sounds risky. Have you considered the long-term impact?")}
              className="p-2 bg-red-600/20 border border-red-500 rounded text-sm text-red-300 hover:bg-red-600/30 transition-all"
            >
              Advise Caution
            </button>
            <button
              onClick={() => handleQuickResponse("That could be a good investment if you've done your research.")}
              className="p-2 bg-green-600/20 border border-green-500 rounded text-sm text-green-300 hover:bg-green-600/30 transition-all"
            >
              Support Decision
            </button>
            <button
              onClick={() => handleQuickResponse("Let's look at your budget first. Can you afford this right now?")}
              className="p-2 bg-blue-600/20 border border-blue-500 rounded text-sm text-blue-300 hover:bg-blue-600/30 transition-all"
            >
              Ask About Budget
            </button>
            <button
              onClick={() => handleQuickResponse("What other options have you considered? There might be better alternatives.")}
              className="p-2 bg-purple-600/20 border border-purple-500 rounded text-sm text-purple-300 hover:bg-purple-600/30 transition-all"
            >
              Suggest Alternatives
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
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FinancialAdvisorChat;