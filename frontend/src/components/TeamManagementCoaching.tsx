'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  Clock,
  Target,
  Shield,
  Zap,
  Heart,
  Brain,
  Award,
  Settings,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface TeamIssue {
  id: string;
  type: 'conflict' | 'performance' | 'chemistry' | 'strategy' | 'morale';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  involvedCharacters: string[];
  suggestedActions: string[];
  timeframe: string;
  impactAreas: string[];
}

interface CoachingSession {
  id: string;
  type: 'team_meeting' | 'conflict_resolution' | 'strategy_review' | 'performance_analysis';
  title: string;
  participants: string[];
  duration: number; // minutes
  objectives: string[];
  currentPhase: number;
  totalPhases: number;
  isActive: boolean;
}

interface TeamMetrics {
  overallMorale: number; // 0-100
  teamChemistry: number; // 0-100
  communicationScore: number; // 0-100
  leadershipEffectiveness: number; // 0-100
  conflictLevel: number; // 0-100 (higher = more conflict)
  performanceTrend: 'improving' | 'stable' | 'declining';
}

interface CoachingMessage {
  id: string;
  speaker: 'coach' | 'system' | string; // character name
  content: string;
  type: 'dialogue' | 'action' | 'decision' | 'notification';
  timestamp: Date;
  choices?: CoachingChoice[];
}

interface CoachingChoice {
  id: string;
  text: string;
  impact: {
    morale?: number;
    chemistry?: number;
    leadership?: number;
  };
  consequences?: string;
}

// Sample team issues
const generateTeamIssues = (): TeamIssue[] => [
  {
    id: 'issue_1',
    type: 'conflict',
    severity: 'high',
    title: 'Achilles vs Loki Personality Clash',
    description: 'Achilles is frustrated with Loki\'s unpredictable tactics and "cowardly" tricks. Loki finds Achilles\' honor obsession limiting team flexibility.',
    involvedCharacters: ['Achilles', 'Loki'],
    suggestedActions: [
      'Hold a mediation session between both characters',
      'Assign them complementary roles to minimize conflict',
      'Set clear team behavior expectations'
    ],
    timeframe: 'Immediate attention needed',
    impactAreas: ['Team Chemistry', 'Battle Coordination', 'Morale']
  },
  {
    id: 'issue_2',
    type: 'performance',
    severity: 'medium',
    title: 'Einstein Overthinking in Combat',
    description: 'Einstein is analyzing probabilities too long during battles, causing delayed reactions and missed opportunities.',
    involvedCharacters: ['Einstein'],
    suggestedActions: [
      'Practice quick decision-making drills',
      'Assign a support role to reduce pressure',
      'Work on trusting instincts over calculations'
    ],
    timeframe: 'Address within the week',
    impactAreas: ['Battle Performance', 'Team Timing']
  },
  {
    id: 'issue_3',
    type: 'morale',
    severity: 'medium',
    title: 'Recent Loss Streak Impact',
    description: 'The team\'s confidence is shaken after losing 3 battles in a row. Some characters are doubting the team strategy.',
    involvedCharacters: ['All Team Members'],
    suggestedActions: [
      'Hold a team building session',
      'Review and adjust current strategy',
      'Focus on individual strengths and wins'
    ],
    timeframe: 'This week',
    impactAreas: ['Team Morale', 'Confidence', 'Performance']
  }
];

// Sample team metrics
const initialMetrics: TeamMetrics = {
  overallMorale: 68,
  teamChemistry: 72,
  communicationScore: 65,
  leadershipEffectiveness: 78,
  conflictLevel: 35,
  performanceTrend: 'stable'
};

export default function TeamManagementCoaching() {
  const [teamIssues, setTeamIssues] = useState<TeamIssue[]>(generateTeamIssues());
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>(initialMetrics);
  const [activeSession, setActiveSession] = useState<CoachingSession | null>(null);
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<TeamIssue | null>(null);
  const [sessionTimer, setSessionTimer] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession?.isActive) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.isActive]);

  const startCoachingSession = (issue: TeamIssue) => {
    const sessionTypes = {
      conflict: {
        type: 'conflict_resolution' as const,
        title: `Conflict Resolution: ${issue.title}`,
        objectives: [
          'Understand both perspectives',
          'Find common ground',
          'Establish team agreements',
          'Monitor progress'
        ],
        totalPhases: 4
      },
      performance: {
        type: 'performance_analysis' as const,
        title: `Performance Review: ${issue.title}`,
        objectives: [
          'Identify performance gaps',
          'Create improvement plan',
          'Set measurable goals',
          'Schedule follow-up'
        ],
        totalPhases: 4
      },
      morale: {
        type: 'team_meeting' as const,
        title: `Team Building: ${issue.title}`,
        objectives: [
          'Address team concerns',
          'Boost team confidence',
          'Strengthen relationships',
          'Set positive goals'
        ],
        totalPhases: 3
      },
      chemistry: {
        type: 'team_meeting' as const,
        title: `Chemistry Session: ${issue.title}`,
        objectives: [
          'Improve communication',
          'Build trust',
          'Define roles clearly'
        ],
        totalPhases: 3
      },
      strategy: {
        type: 'strategy_review' as const,
        title: `Strategy Review: ${issue.title}`,
        objectives: [
          'Analyze current approach',
          'Identify improvements',
          'Get team buy-in'
        ],
        totalPhases: 3
      }
    };

    const sessionConfig = sessionTypes[issue.type];
    
    const session: CoachingSession = {
      id: `session_${Date.now()}`,
      ...sessionConfig,
      participants: issue.involvedCharacters,
      duration: sessionConfig.totalPhases * 10, // 10 mins per phase
      currentPhase: 1,
      isActive: true
    };

    setActiveSession(session);
    setSelectedIssue(issue);
    setSessionTimer(0);
    
    // Start with opening message
    const openingMessage: CoachingMessage = {
      id: `msg_${Date.now()}`,
      speaker: 'system',
      content: `Starting ${session.title}. Participants: ${session.participants.join(', ')}`,
      type: 'notification',
      timestamp: new Date()
    };
    
    setMessages([openingMessage]);
    
    // Add initial coach message based on issue type using real AI
    const getInitialCoachMessage = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        
        const response = await fetch(`${BACKEND_URL}/coaching/team-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            characterId: 'coach', // Use coach as the character giving guidance
            issue,
            choice: 'initial_assessment',
            context: {
              teamMembers: issue.involvedCharacters,
              issueType: issue.type
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const coachMessage: CoachingMessage = {
          id: Date.now(),
          sender: 'coach',
          content: data.message,
          type: 'guidance',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, coachMessage]);
      } catch (error) {
        console.error('Team management coaching error:', error);
        // Fallback message
        const fallbackMessage = generateInitialCoachMessage(issue);
        setMessages(prev => [...prev, fallbackMessage]);
      }
    };

    setTimeout(getInitialCoachMessage, 1000);
  };

  const generateInitialCoachMessage = (issue: TeamIssue): CoachingMessage => {
    const templates = {
      conflict: `Alright team, I can see there's some tension between ${issue.involvedCharacters.join(' and ')}. This is actually normal - great teams work through conflicts. Let's talk this out openly and honestly.`,
      performance: `${issue.involvedCharacters[0]}, I've noticed some patterns in our recent battles that I'd like to work on together. This isn't about blame - it's about helping you reach your potential.`,
      morale: `I know these recent losses have been tough on everyone. But I've seen this team's potential, and I believe in each of you. Let's figure out how to get our confidence back.`,
      chemistry: `Communication is the foundation of any great team. I want to make sure everyone feels heard and understands their role in our success.`,
      strategy: `Our current approach isn't giving us the results we want. Let's analyze what's working, what isn't, and how we can adapt.`
    };

    return {
      id: `msg_${Date.now() + 1}`,
      speaker: 'coach',
      content: templates[issue.type],
      type: 'dialogue',
      timestamp: new Date(),
      choices: [
        {
          id: 'choice_1',
          text: 'Start with the main concern',
          impact: { leadership: 2 }
        },
        {
          id: 'choice_2', 
          text: 'Ask everyone to share their perspective',
          impact: { chemistry: 3, morale: 1 }
        },
        {
          id: 'choice_3',
          text: 'Set ground rules for the discussion',
          impact: { leadership: 3 }
        }
      ]
    };
  };

  const handleCoachChoice = (choice: CoachingChoice) => {
    // Apply impact to metrics
    setTeamMetrics(prev => ({
      ...prev,
      teamChemistry: Math.max(0, Math.min(100, prev.teamChemistry + (choice.impact.chemistry || 0))),
      overallMorale: Math.max(0, Math.min(100, prev.overallMorale + (choice.impact.morale || 0))),
      leadershipEffectiveness: Math.max(0, Math.min(100, prev.leadershipEffectiveness + (choice.impact.leadership || 0)))
    }));

    // Add coach response
    const coachResponse: CoachingMessage = {
      id: `msg_${Date.now()}`,
      speaker: 'coach',
      content: choice.text,
      type: 'action',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, coachResponse]);

    // Generate real AI character response based on choice
    const getCharacterResponse = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        
        // Use the first involved character for response
        const respondingCharacter = selectedIssue!.involvedCharacters[0];
        if (!respondingCharacter) {
          throw new Error('No involved characters found for this issue');
        }
        
        const response = await fetch(`${BACKEND_URL}/coaching/team-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            characterId: respondingCharacter.toLowerCase().replace(' ', '_'),
            issue: selectedIssue,
            choice: choice.action,
            context: {
              coachingApproach: choice.action,
              teamDynamics: selectedIssue!.description,
              otherCharacters: selectedIssue!.involvedCharacters.slice(1)
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const characterResponse: CoachingMessage = {
          id: Date.now(),
          sender: 'character',
          content: data.message,
          type: 'response',
          timestamp: new Date(),
          characterName: data.character || respondingCharacter
        };
        
        setMessages(prev => [...prev, characterResponse]);
      } catch (error) {
        console.error('Character response error:', error);
        // Fallback to hardcoded response
        const fallbackResponse = generateCharacterResponse(choice, selectedIssue!);
        setMessages(prev => [...prev, fallbackResponse]);
      }
    };

    setTimeout(getCharacterResponse, 2000);
  };

  const generateCharacterResponse = (choice: CoachingChoice, issue: TeamIssue): CoachingMessage => {
    const character = issue.involvedCharacters[Math.floor(Math.random() * issue.involvedCharacters.length)];
    
    const responses = {
      'Achilles': [
        "Fine, but I want everyone to know that honor in battle is non-negotiable.",
        "I appreciate the direct approach, Coach. Let's solve this.",
        "As long as we're focused on victory, I'm listening."
      ],
      'Loki': [
        "Oh, this should be entertaining. Please, do continue.",
        "I suppose I can share my... perspective. *grins*",
        "Rules? How delightfully optimistic of you, Coach."
      ],
      'Einstein': [
        "Statistically speaking, open communication improves team performance by 23.7%.",
        "I appreciate the logical structure to this discussion.",
        "Perhaps we should quantify our objectives before proceeding?"
      ]
    };

    const characterResponses = responses[character as keyof typeof responses] || [
      `${character} nods thoughtfully.`,
      `${character} seems willing to participate.`,
      `${character} looks ready to discuss the issue.`
    ];

    return {
      id: `msg_${Date.now()}`,
      speaker: character,
      content: characterResponses[Math.floor(Math.random() * characterResponses.length)],
      type: 'dialogue',
      timestamp: new Date()
    };
  };

  const endSession = () => {
    if (!activeSession || !selectedIssue) return;

    // Mark issue as addressed
    setTeamIssues(prev => prev.filter(issue => issue.id !== selectedIssue.id));
    
    // Add completion message
    const completionMessage: CoachingMessage = {
      id: `msg_${Date.now()}`,
      speaker: 'system',
      content: `Coaching session completed. Duration: ${Math.floor(sessionTimer / 60)}:${(sessionTimer % 60).toString().padStart(2, '0')}`,
      type: 'notification',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, completionMessage]);
    setActiveSession(null);
    setSelectedIssue(null);
  };

  const getSeverityColor = (severity: TeamIssue['severity']) => {
    const colors = {
      low: 'text-green-400 border-green-500/30 bg-green-500/10',
      medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      high: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      critical: 'text-red-400 border-red-500/30 bg-red-500/10'
    };
    return colors[severity];
  };

  const getTypeIcon = (type: TeamIssue['type']) => {
    const icons = {
      conflict: <Users className="w-5 h-5" />,
      performance: <TrendingUp className="w-5 h-5" />,
      chemistry: <Heart className="w-5 h-5" />,
      strategy: <Target className="w-5 h-5" />,
      morale: <Award className="w-5 h-5" />
    };
    return icons[type];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          Team Management Coaching
        </h1>
        <p className="text-gray-400">
          Lead your team through conflicts, strategy reviews, and performance challenges
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Team Metrics Sidebar */}
        <div className="space-y-6">
          {/* Current Metrics */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Team Health
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Team Morale</span>
                  <span className="text-white">{teamMetrics.overallMorale}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${teamMetrics.overallMorale}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Team Chemistry</span>
                  <span className="text-white">{teamMetrics.teamChemistry}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${teamMetrics.teamChemistry}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Communication</span>
                  <span className="text-white">{teamMetrics.communicationScore}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${teamMetrics.communicationScore}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Leadership</span>
                  <span className="text-white">{teamMetrics.leadershipEffectiveness}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${teamMetrics.leadershipEffectiveness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Issues */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Team Issues ({teamIssues.length})
            </h3>
            
            <div className="space-y-3">
              {teamIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-blue-500/50 ${getSeverityColor(issue.severity)}`}
                  onClick={() => !activeSession && startCoachingSession(issue)}
                >
                  <div className="flex items-start gap-3">
                    {getTypeIcon(issue.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm">{issue.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{issue.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{issue.timeframe}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
              
              {teamIssues.length === 0 && (
                <div className="text-center py-6">
                  <Award className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-semibold">All Clear!</p>
                  <p className="text-sm text-gray-400">No urgent team issues</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Coaching Area */}
        <div className="lg:col-span-2">
          {activeSession ? (
            /* Active Session */
            <div className="bg-gray-900/50 rounded-xl border border-gray-700 h-[600px] flex flex-col">
              {/* Session Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{activeSession.title}</h2>
                    <p className="text-sm text-gray-400">
                      Phase {activeSession.currentPhase} of {activeSession.totalPhases} • 
                      {activeSession.participants.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-300">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {formatTime(sessionTimer)}
                    </div>
                    <button
                      onClick={endSession}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      End Session
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`${
                    message.type === 'notification' ? 'text-center' : ''
                  }`}>
                    {message.type === 'notification' ? (
                      <div className="inline-flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                        <Settings className="w-4 h-4" />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      <div className={`flex items-start gap-3 ${
                        message.speaker === 'coach' ? 'flex-row-reverse' : ''
                      }`}>
                        <div className="text-2xl">
                          {message.speaker === 'coach' ? '👨‍💼' : 
                           message.speaker === 'Achilles' ? '⚔️' :
                           message.speaker === 'Loki' ? '🎭' :
                           message.speaker === 'Einstein' ? '🧠' :
                           '👤'}
                        </div>
                        <div className={`max-w-md ${message.speaker === 'coach' ? 'items-end' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${
                            message.speaker === 'coach' ? 'justify-end' : ''
                          }`}>
                            <span className="font-semibold text-white text-sm">
                              {message.speaker === 'coach' ? 'You (Coach)' : message.speaker}
                            </span>
                            <span className="text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className={`inline-block px-4 py-2 rounded-lg ${
                            message.speaker === 'coach'
                              ? 'bg-blue-600 text-white'
                              : message.type === 'action'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-800 text-gray-200'
                          }`}>
                            {message.content}
                          </div>
                          
                          {/* Choices */}
                          {message.choices && (
                            <div className="mt-3 space-y-2">
                              {message.choices.map((choice) => (
                                <button
                                  key={choice.id}
                                  onClick={() => handleCoachChoice(choice)}
                                  className="block w-full text-left p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
                                >
                                  {choice.text}
                                  {choice.consequences && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      → {choice.consequences}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            /* No Active Session */
            <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-8 text-center h-[600px] flex items-center justify-center">
              <div>
                <Brain className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Ready to Coach</h3>
                <p className="text-gray-400 mb-6">
                  Select a team issue from the sidebar to start a coaching session
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-semibold text-white text-sm mb-2">Conflict Resolution</h4>
                    <p className="text-xs text-gray-400">Mediate character disputes and personality clashes</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-semibold text-white text-sm mb-2">Performance Analysis</h4>
                    <p className="text-xs text-gray-400">Address individual and team performance issues</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-semibold text-white text-sm mb-2">Team Building</h4>
                    <p className="text-xs text-gray-400">Boost morale and strengthen team bonds</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-semibold text-white text-sm mb-2">Strategy Review</h4>
                    <p className="text-xs text-gray-400">Analyze and adjust team tactics</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}