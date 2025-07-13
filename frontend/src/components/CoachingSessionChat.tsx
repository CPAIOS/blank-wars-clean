'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, Brain, MessageCircle, Clock, Shield } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { characterAPI } from '../services/apiClient';
import { Character } from '../data/characters';

interface Message {
  id: number;
  type: 'player' | 'character' | 'system';
  content: string;
  timestamp: Date;
  bondIncrease?: boolean;
}

interface EnhancedCharacter extends Character {
  baseName: string;
  displayBondLevel: number;
}

const loadUserCharacters = async (): Promise<EnhancedCharacter[]> => {
  try {
    const response = await characterAPI.getUserCharacters();
    const characters = response.characters || [];
    
    return characters.map((char: any) => {
      const baseName = char.name?.toLowerCase() || char.id?.split('_')[0] || 'unknown';
      return {
        ...char,
        baseName,
        displayBondLevel: char.bond_level || Math.floor((char.base_health || 80) / 10),
        // Map database fields to component expectations
        baseStats: {
          strength: char.base_attack || 70,
          vitality: char.base_health || 80,
          agility: char.base_speed || 70,
          intelligence: char.base_special || 70,
          wisdom: char.base_defense || 70,
          charisma: char.bond_level || 5
        },
        combatStats: {
          health: char.current_health || char.base_health || 80,
          maxHealth: char.max_health || char.base_health || 80,
          attack: char.base_attack || 70,
          defense: char.base_defense || 70,
          speed: char.base_speed || 70,
          criticalChance: 15,
          accuracy: 85
        },
        level: char.level || 1,
        experience: char.experience || 0,
        abilities: char.abilities || [],
        archetype: char.archetype || 'warrior',
        avatar: char.avatar_emoji || char.avatar || '⚔️',
        name: char.name || 'Unknown Character',
        personalityTraits: char.personality_traits || ['Determined'],
        speakingStyle: char.speaking_style || 'Direct',
        decisionMaking: char.decision_making || 'Analytical',
        conflictResponse: char.conflict_response || 'Confrontational'
      };
    });
  } catch (error) {
    console.error('Failed to load user characters:', error);
    return [];
  }
};

// Personal Problem Engine - Random challenges characters face
const PROBLEM_CATEGORIES = [
  'neighbor_disputes',
  'family_conflicts', 
  'work_stress',
  'relationship_issues',
  'financial_problems',
  'health_concerns',
  'identity_crisis',
  'authority_conflicts',
  'moral_dilemmas',
  'social_isolation',
  'trust_issues',
  'anger_management',
  'perfectionism',
  'impostor_syndrome',
  'grief_loss'
];

// Generate character-specific interpretation of random problem
const generatePersonalProblem = (character: EnhancedCharacter): { problem: string, intro: string } => {
  const { name, archetype } = character;
  
  // Use character's actual level and bond level to influence problem type
  const lowLevelProblems = ['identity_crisis', 'impostor_syndrome', 'social_isolation'];
  const highLevelProblems = ['moral_dilemmas', 'authority_conflicts', 'grief_loss'];
  const lowBondProblems = ['trust_issues', 'social_isolation', 'anger_management'];
  const highBondProblems = ['family_conflicts', 'relationship_issues', 'perfectionism'];
  
  let availableProblems = [...PROBLEM_CATEGORIES];
  
  // Filter problems based on character stats
  if (character.level && character.level < 5) {
    availableProblems = availableProblems.filter(p => lowLevelProblems.includes(p) || !highLevelProblems.includes(p));
  } else if (character.level && character.level > 15) {
    availableProblems = availableProblems.filter(p => highLevelProblems.includes(p) || !lowLevelProblems.includes(p));
  }
  
  if (character.displayBondLevel && character.displayBondLevel < 3) {
    availableProblems = availableProblems.filter(p => lowBondProblems.includes(p) || !highBondProblems.includes(p));
  } else if (character.displayBondLevel && character.displayBondLevel > 7) {
    availableProblems = availableProblems.filter(p => highBondProblems.includes(p) || !lowBondProblems.includes(p));
  }
  
  // Add character-specific problems based on name/identity
  if (name?.toLowerCase().includes('achilles')) {
    availableProblems.push('pride_and_honor', 'destiny_pressure');
  } else if (name?.toLowerCase().includes('merlin')) {
    availableProblems.push('magical_burden', 'prophecy_weight');
  } else if (name?.toLowerCase().includes('loki')) {
    availableProblems.push('reputation_management', 'chaos_vs_order');
  } else if (name?.toLowerCase().includes('sherlock')) {
    availableProblems.push('intellectual_isolation', 'obsessive_analysis');
  }
  
  const randomProblem = availableProblems[Math.floor(Math.random() * availableProblems.length)];
  
  const problemInterpretations: Record<string, Record<string, string>> = {
    neighbor_disputes: {
      warrior: `Coach, I'm having issues with neighboring warriors who keep challenging my honor. Every tavern visit becomes a potential duel...`,
      leader: `The neighboring kingdoms are testing our borders again. Diplomacy is failing and my people want war, but I'm not sure...`,
      scholar: `My academic colleagues are spreading rumors about my research. The jealousy in the scholarly community is toxic...`,
      trickster: `I may have pranked the wrong people... now half the town wants my head on a spike. Whoops?`,
      mage: `The local villagers fear my magic and want me gone. Even simple spells make them grab torches and pitchforks...`,
      default: `Coach, I'm having neighbor problems. They keep complaining about my... lifestyle choices.`
    },
    family_conflicts: {
      warrior: `My family doesn't understand why I chose the warrior's path. They wanted me to be a farmer like them...`,
      leader: `The royal family is pressuring me to marry for political alliance, but I want to choose my own path...`,
      scholar: `My family thinks I'm wasting my life with books and experiments. They don't understand my research...`,
      trickster: `My family is tired of my 'shenanigans' and threats to disown me. They don't appreciate my artistic vision...`,
      mage: `My magical abilities frighten my family. They look at me like I'm a stranger now...`,
      default: `Coach, my family just doesn't get me anymore. We're growing apart and I don't know how to fix it.`
    },
    work_stress: {
      warrior: `The constant battles are wearing me down. Every victory costs me friends, every defeat haunts me...`,
      leader: `Ruling is exhausting. Every decision affects thousands of lives. The weight of responsibility is crushing...`,
      scholar: `My research is stalling and I'm losing funding. The pressure to publish groundbreaking work is overwhelming...`,
      trickster: `Pulling off elaborate schemes is harder than it looks. One mistake and everything falls apart...`,
      mage: `Mastering these spells is draining my energy and sanity. The magical arts demand everything from me...`,
      default: `Coach, work is overwhelming me. I'm burning out and don't know how to cope with the pressure.`
    },
    relationship_issues: {
      warrior: `I care deeply for someone, but my warrior lifestyle keeps putting them in danger. Maybe they deserve better...`,
      leader: `It's lonely at the top. People either fear me or want something from me. True connection feels impossible...`,
      scholar: `I spend so much time with books that I've forgotten how to connect with actual people...`,
      trickster: `Nobody takes me seriously in relationships. They think everything's a joke, even my feelings...`,
      mage: `My magical powers create barriers with others. How do you love someone when you could accidentally curse them?`,
      default: `Coach, I'm struggling with relationships. I keep pushing people away or they can't handle who I really am.`
    },
    financial_problems: {
      warrior: `Mercenary work is unpredictable. Feast or famine. How do I plan for the future when I might die tomorrow?`,
      leader: `The kingdom's treasury is empty but my people still need food and protection. I'm failing them...`,
      scholar: `Research doesn't pay the bills. I'm choosing between eating and buying books for my studies...`,
      trickster: `My last con backfired spectacularly. Now I owe money to some very dangerous people...`,
      mage: `Spell components are expensive and clients don't always pay. Being a mage is financially unstable...`,
      default: `Coach, I'm broke and don't know how to get back on my feet. Money stress is consuming me.`
    },
    health_concerns: {
      warrior: `Battle wounds are catching up with me. My body isn't what it used to be, but fighting is all I know...`,
      leader: `The stress of leadership is killing me slowly. Sleepless nights, constant anxiety... I'm falling apart...`,
      scholar: `Too many late nights studying by candlelight. My eyes are failing and my back aches constantly...`,
      trickster: `One of my stunts went wrong and now I'm dealing with chronic pain. Karma's a real kick in the teeth...`,
      mage: `Magic is corrupting my body. Each spell ages me, but I can't stop using my powers...`,
      default: `Coach, I'm worried about my health. My body is giving me warning signs I can't ignore anymore.`
    },
    identity_crisis: {
      warrior: `I became a warrior for honor, but all I see is violence and death. Am I a protector or just a killer?`,
      leader: `I don't know if I'm leading because I should or because others expect it. Who am I without the crown?`,
      scholar: `I pursue knowledge, but what if my discoveries are used for evil? Am I helping or harming the world?`,
      trickster: `Behind all the jokes and tricks, I don't know who I really am. Is this persona the real me?`,
      mage: `Magic chose me, but did I choose it? Sometimes I wonder what I'd be without these powers...`,
      default: `Coach, I'm lost. I don't know who I am anymore or what I'm supposed to be doing with my life.`
    },
    authority_conflicts: {
      warrior: `My commanding officers want me to do things that go against my code of honor. Obedience vs morality...`,
      leader: `The council of elders questions every decision I make. I'm the leader but they treat me like a puppet...`,
      scholar: `The academic institution wants to censor my research. Truth vs institutional politics...`,
      trickster: `The local authorities have it out for me. Every little thing I do gets scrutinized and punished...`,
      mage: `The magical council wants to control how I use my powers. Freedom vs regulation...`,
      default: `Coach, I'm clashing with authority figures constantly. I can't seem to play by their rules.`
    },
    moral_dilemmas: {
      warrior: `I was ordered to attack civilians to win a strategic battle. Victory at the cost of innocents - is it worth it?`,
      leader: `I must choose between saving one village or many. The math is simple but the guilt will destroy me...`,
      scholar: `My research could save lives or create terrible weapons. Should I publish and risk misuse?`,
      trickster: `I discovered corruption in high places. Exposing it helps justice but ruins innocent families too...`,
      mage: `I have the power to change someone's fate with magic. Playing god feels wrong but inaction hurts people...`,
      default: `Coach, I'm facing an impossible moral choice. Every option feels wrong but doing nothing is worse.`
    },
    social_isolation: {
      warrior: `Other warriors see me as competition, civilians fear me. I'm surrounded by people but utterly alone...`,
      leader: `Leadership isolates you from everyone. I can't show weakness or vulnerability to anyone...`,
      scholar: `My intellect intimidates people. They either worship or resent me, but no one just... talks to me...`,
      trickster: `People only want me around when they need entertainment. I'm a jester, not a friend...`,
      mage: `Magic makes people uncomfortable. I'm either feared as dangerous or used for my powers...`,
      default: `Coach, I feel completely alone. I'm surrounded by people but no one really knows or understands me.`
    },
    trust_issues: {
      warrior: `I've been betrayed by allies in battle. Now I trust no one and fight alone, but isolation is killing me...`,
      leader: `Everyone around me has their own agenda. I can't tell who serves me versus who serves themselves...`,
      scholar: `Academic rivals have stolen my research before. Now I hoard knowledge and work in secret...`,
      trickster: `I've been conned by someone better than me. Now I suspect everyone of playing angles...`,
      mage: `Another mage cursed me while pretending friendship. Magical betrayal cuts deeper than steel...`,
      default: `Coach, I can't trust anyone anymore. Past betrayals have made me paranoid and defensive.`
    },
    anger_management: {
      warrior: `My battle rage doesn't turn off anymore. I'm angry all the time and it's destroying my relationships...`,
      leader: `The incompetence and selfishness around me fills me with fury. I'm becoming a tyrant...`,
      scholar: `Ignorance and anti-intellectualism make me livid. I can't control my contempt for stupidity...`,
      trickster: `When my jokes fall flat or people don't get my humor, I become irrationally angry...`,
      mage: `Magical energy amplifies my emotions. My anger literally manifests as destructive spells...`,
      default: `Coach, I have serious anger issues. My temper is ruining everything good in my life.`
    },
    perfectionism: {
      warrior: `Every technique must be flawless, every victory absolute. My perfectionism is paralyzing me...`,
      leader: `I can't accept any failure in governance. The impossible standards I set are breaking me...`,
      scholar: `My research must be perfect before publication. I've been working on the same project for years...`,
      trickster: `Every prank must be elaborate and flawless. Simple jokes feel like personal failures...`,
      mage: `Every spell must be cast perfectly or I consider it worthless. I'm never satisfied with my magic...`,
      default: `Coach, my perfectionism is crippling me. Nothing I do ever feels good enough and I'm exhausted.`
    },
    impostor_syndrome: {
      warrior: `Everyone calls me a hero but I just got lucky. Real warriors would see through my facade...`,
      leader: `I don't deserve this position. I'm just winging it and eventually everyone will realize I'm a fraud...`,
      scholar: `My colleagues are so much smarter. I don't belong in academic circles - I'm just pretending...`,
      trickster: `Other tricksters are naturally funny. I work hard for every laugh and feel like a fake...`,
      mage: `Real mages make magic look effortless. I struggle with every spell and feel like I'm pretending...`,
      default: `Coach, I feel like a complete fraud. Everyone thinks I'm competent but I'm just fooling them all.`
    },
    grief_loss: {
      warrior: `I lost my battle-brother to enemy blades. The guilt and grief are making me reckless in combat...`,
      leader: `My mentor who taught me leadership died. I feel lost without their guidance and wisdom...`,
      scholar: `My research partner passed away before we finished our life's work. I can't motivate myself to continue...`,
      trickster: `My comedy partner died and humor feels wrong now. How do you laugh when your heart is broken?`,
      mage: `My magical teacher crossed the veil. I have no one to guide my studies or understand my struggles...`,
      default: `Coach, I lost someone important to me. The grief is consuming everything and I don't know how to heal.`
    },
    // Character-specific problems
    pride_and_honor: {
      warrior: `Coach, everyone expects me to be this legendary hero, but the pressure is crushing. What if I'm not worthy of my reputation?`,
      default: `Coach, my pride has become both my strength and my weakness. It drives me forward but also isolates me from others.`
    },
    destiny_pressure: {
      warrior: `The prophecies about my fate are overwhelming. Everyone acts like my destiny is set in stone, but I want to choose my own path...`,
      default: `Coach, everyone keeps talking about my 'destiny' but I just want to live my life without cosmic expectations.`
    },
    magical_burden: {
      mage: `Coach, my magical abilities come with a terrible cost. Every spell I cast takes something from me, and I'm losing myself...`,
      scholar: `The weight of magical knowledge is crushing. I see things others can't, know things that terrify me. Wisdom is a curse...`,
      default: `Coach, my powers feel more like a burden than a gift. The responsibility is overwhelming.`
    },
    prophecy_weight: {
      mage: `I can see fragments of the future, and they're all dark. How do I carry this knowledge without going mad?`,
      scholar: `The prophecies I've studied point to terrible things ahead. Should I warn others or bear this burden alone?`,
      default: `Coach, I know things about the future that I wish I didn't. The weight of prophecy is breaking me.`
    },
    reputation_management: {
      trickster: `Coach, everyone expects me to be the villain in every story. Sometimes I play the part, but it's lonely being the bad guy...`,
      default: `Coach, my reputation precedes me everywhere I go. People see what they expect to see, not who I really am.`
    },
    chaos_vs_order: {
      trickster: `I thrive on chaos but sometimes I crave stability. I'm tired of being unpredictable even to myself...`,
      default: `Coach, I'm torn between my chaotic nature and my desire for meaningful connections and stability.`
    },
    intellectual_isolation: {
      scholar: `Coach, my mind works differently than others. I can solve any puzzle except how to connect with people on an emotional level...`,
      default: `Coach, being the smartest person in the room is incredibly lonely. No one understands how I think.`
    },
    obsessive_analysis: {
      scholar: `I can't turn off my analytical mind. I dissect every conversation, every interaction. It's exhausting and it's ruining my relationships...`,
      default: `Coach, I overanalyze everything to the point of paralysis. My mind won't let me just... be present.`
    }
  };

  const characterArchetype = archetype || 'default';
  const problemText = problemInterpretations[randomProblem]?.[characterArchetype] || 
                     problemInterpretations[randomProblem]?.['default'] || 
                     `Coach, I'm dealing with some personal challenges and could use your guidance.`;

  return {
    problem: randomProblem,
    intro: problemText
  };
};

// Generate coaching conversation starters based on character personality
const generateCoachingPrompts = (character: EnhancedCharacter): string[] => {
  const prompts: string[] = [];
  const { personalityTraits, archetype, level, name } = character;
  
  // Universal coaching prompts
  prompts.push(`How are you feeling mentally after recent battles?`);
  prompts.push(`What's been weighing on your mind lately?`);
  prompts.push(`Tell me about any stress or pressure you're experiencing.`);
  
  // Personality-based prompts
  if (personalityTraits?.includes('proud') || personalityTraits?.includes('Proud')) {
    prompts.push(`I know showing vulnerability is difficult for you. What challenges are you facing?`);
  }
  if (personalityTraits?.includes('ambitious') || personalityTraits?.includes('Ambitious')) {
    prompts.push(`Are your ambitions creating any internal conflicts or stress?`);
  }
  if (personalityTraits?.includes('analytical') || personalityTraits?.includes('Analytical')) {
    prompts.push(`How do you process emotions versus logic when making decisions?`);
  }
  if (personalityTraits?.includes('loyal') || personalityTraits?.includes('Loyal')) {
    prompts.push(`Do you ever feel torn between loyalty to others and your own needs?`);
  }
  
  // Archetype-based coaching
  if (archetype === 'warrior') {
    prompts.push(`As a warrior, do you struggle with the violence of battle?`);
    prompts.push(`How do you maintain honor while dealing with the brutal realities of war?`);
  }
  if (archetype === 'leader') {
    prompts.push(`What's the heaviest burden of leadership you're carrying?`);
    prompts.push(`How do you handle the responsibility of others' lives in your hands?`);
  }
  if (archetype === 'scholar') {
    prompts.push(`Do you ever feel isolated by your intelligence or knowledge?`);
    prompts.push(`How do you balance pursuit of knowledge with human connections?`);
  }
  if (archetype === 'trickster') {
    prompts.push(`Behind the humor and tricks, what are you really feeling?`);
    prompts.push(`Do you use jokes to avoid dealing with deeper emotions?`);
  }
  
  // Level-based concerns
  if (level < 10) {
    prompts.push(`As someone newer to this life, what fears do you have about your future?`);
  }
  if (level > 30) {
    prompts.push(`With your experience, do you ever feel the weight of what you've seen?`);
  }
  
  return prompts.slice(0, 4);
};

// Generate session type options
const generateSessionTypes = (character: EnhancedCharacter): string[] => {
  return [
    `Start a mental health check-in with ${character.name}`,
    `Work on ${character.name}'s stress management`,
    `Help ${character.name} process difficult experiences`
  ];
};

interface CoachingSessionChatProps {
  selectedCharacterId?: string;
  sessionType?: string;
  onCharacterChange?: (characterId: string) => void;
}

export default function CoachingSessionChat({ 
  selectedCharacterId, 
  sessionType = 'general',
  onCharacterChange 
}: CoachingSessionChatProps) {
  const [availableCharacters, setAvailableCharacters] = useState<EnhancedCharacter[]>([]);
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState(selectedCharacterId || 'achilles');
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [currentSessionType, setCurrentSessionType] = useState<string>(sessionType);

  // Load characters on component mount
  useEffect(() => {
    const loadCharacters = async () => {
      setCharactersLoading(true);
      const characters = await loadUserCharacters();
      setAvailableCharacters(characters);
      setCharactersLoading(false);
    };
    
    loadCharacters();
  }, []);

  // Update internal state when prop changes and clear messages
  useEffect(() => {
    if (selectedCharacterId && selectedCharacterId !== globalSelectedCharacterId) {
      setGlobalSelectedCharacterId(selectedCharacterId);
      setMessages([]);
      setInputMessage('');
      setIsTyping(false);
    }
  }, [selectedCharacterId, globalSelectedCharacterId]);
  
  const selectedCharacter = availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';
    console.log('🔌 [CoachingSession] Connecting to backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ CoachingSession Socket connected! Waiting for authentication...');
    });

    socketRef.current.on('auth_success', (data: { userId: string; username: string }) => {
      console.log('🔐 CoachingSession Socket authenticated!', data);
      setConnected(true);
    });

    socketRef.current.on('auth_error', (error: { error: string }) => {
      console.error('❌ CoachingSession Socket authentication failed:', error);
      setConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ CoachingSession Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('chat_response', (data: { character: string; message: string; bondIncrease?: boolean }) => {
      console.log('📨 CoachingSession response:', data);
      
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message || 'I... need a moment to think about that.',
        timestamp: new Date(),
        bondIncrease: data.bondIncrease || Math.random() > 0.5, // Higher chance of bonding in coaching
      };
      
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    });

    socketRef.current.on('chat_error', (error: { message: string }) => {
      console.error('❌ CoachingSession error:', error);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate coaching prompts and session types
  const coachingPrompts = selectedCharacter ? generateCoachingPrompts(selectedCharacter) : [];
  const sessionTypes = selectedCharacter ? generateSessionTypes(selectedCharacter) : [];

  const sendMessage = (content: string) => {
    if (!content.trim() || isTyping || !connected || !socketRef.current) {
      return;
    }

    const playerMessage: Message = {
      id: Date.now(),
      type: 'player',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setIsTyping(true);

    console.log('📤 CoachingSession message:', content);

    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter?.baseName || 'unknown',
      characterData: {
        name: selectedCharacter?.name || 'Unknown',
        archetype: selectedCharacter?.archetype || 'warrior',
        level: selectedCharacter?.level || 1,
        personality: {
          traits: selectedCharacter?.personalityTraits || ['Determined'],
          speechStyle: selectedCharacter?.speakingStyle || 'Direct',
          decisionMaking: selectedCharacter?.decisionMaking || 'Analytical',
          conflictResponse: selectedCharacter?.conflictResponse || 'Confrontational',
          interests: ['Personal growth', 'Mental wellness', 'Emotional balance', 'Self-reflection']
        },
        // Current mental/emotional state context
        mentalState: {
          currentLevel: selectedCharacter?.level || 1,
          bondLevel: selectedCharacter?.displayBondLevel || 1,
          recentStress: Math.floor(Math.random() * 100), // Could be calculated from recent battles
          emotionalOpenness: selectedCharacter?.personalityTraits?.includes('proud') ? 'low' : 'medium',
          trustLevel: selectedCharacter?.displayBondLevel || 1
        },
        conversationContext: `This is a private, confidential coaching session. You are ${selectedCharacter?.name || 'the character'}, and you're talking with your coach (the user) about personal, emotional, psychological, and mental health topics.

SESSION TYPE: ${currentSessionType}

CURRENT CHARACTER PSYCHOLOGICAL PROFILE:
- Personality: ${selectedCharacter?.personalityTraits?.join(', ') || 'Determined'}
- Communication Style: ${selectedCharacter?.speakingStyle || 'Direct'}
- Decision Making: ${selectedCharacter?.decisionMaking || 'Analytical'}
- Conflict Response: ${selectedCharacter?.conflictResponse || 'Confrontational'}
- Trust Level with Coach: ${selectedCharacter?.displayBondLevel || 1}/10
- Character Background: ${selectedCharacter?.archetype || 'warrior'} from ${selectedCharacter?.backstory || 'unknown origins'}

COACHING SESSION GUIDELINES:
- This is a safe space for vulnerability and emotional honesty
- The coach (user) is trying to help you with mental health and personal growth
- Respond based on your personality - some characters are more guarded, others more open
- Share struggles that would be realistic for your character background and personality
- Show emotional depth while staying true to your character voice
- Mental health topics might include: stress, fear, guilt, relationships, purpose, identity, trauma, goals
- Be authentic about psychological struggles that fit your character's life experiences

PSYCHOLOGICAL CONSIDERATIONS FOR ${selectedCharacter?.archetype || 'warrior'}s:
${selectedCharacter?.archetype === 'warrior' ? '- Possible PTSD from battle, survivor guilt, struggle with violence vs honor, pressure to be strong' :
  selectedCharacter?.archetype === 'leader' ? '- Leadership burden, decision fatigue, isolation, responsibility for others\' lives' :
  selectedCharacter?.archetype === 'scholar' ? '- Intellectual isolation, analysis paralysis, disconnection from emotions, impostor syndrome' :
  selectedCharacter?.archetype === 'trickster' ? '- Using humor to mask pain, fear of vulnerability, identity confusion, need for acceptance' :
  '- General stress from battles, relationships, and finding purpose in this world'}

Respond as ${selectedCharacter?.name || 'the character'} would in a real psychological coaching session, showing appropriate emotional depth while maintaining character authenticity.`,
        
        sessionContext: {
          type: currentSessionType,
          focusAreas: ['Mental health', 'Emotional wellness', 'Personal growth', 'Stress management', 'Relationship issues', 'Identity and purpose'],
          therapeuticApproach: 'Supportive coaching with psychological insight',
          confidentiality: 'This is a private, safe space for personal sharing'
        }
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
      }
    }, 15000);
  };

  const getCoachingIntro = (character: EnhancedCharacter): string => {
    // Generate a random personal problem for this character
    const personalProblem = generatePersonalProblem(character);
    
    return personalProblem.intro;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now() + 1,
          type: 'character',
          content: getCoachingIntro(selectedCharacter),
          timestamp: new Date(),
        }
      ]);
      setIsTyping(false);
    }
  }, [selectedCharacter?.id]);

  const handleCharacterChange = (characterId: string) => {
    setGlobalSelectedCharacterId(characterId);
    onCharacterChange?.(characterId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl backdrop-blur-sm border border-purple-500/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-[600px] max-h-[800px]">
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 p-4 border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter?.avatar || '👤'}</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                    Coaching Session - {selectedCharacter?.name || 'Select Character'}
                  </h3>
                  <p className="text-sm text-purple-200">Private mental health and personal development coaching</p>
                </div>
                <div className="ml-auto flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Confidential</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">Safe Space</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-purple-500/20 bg-purple-900/10">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-purple-200 mb-2">💭 Coaching Conversation Starters:</div>
                  <div className="flex flex-wrap gap-2">
                    {coachingPrompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        onClick={() => sendMessage(prompt)}
                        className="bg-purple-700/30 hover:bg-purple-600/40 text-purple-100 text-xs px-3 py-1 rounded-full border border-purple-500/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-blue-200 mb-2">🎯 Session Focus Areas:</div>
                  <div className="flex flex-wrap gap-2">
                    {sessionTypes.map((sessionType, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          setCurrentSessionType(sessionType);
                          sendMessage(sessionType);
                        }}
                        className="bg-blue-700/30 hover:bg-blue-600/40 text-blue-100 text-xs px-3 py-1 rounded-full border border-blue-500/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {sessionType}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'player'
                      ? 'bg-purple-600 text-white'
                      : message.type === 'character'
                      ? 'bg-blue-600 text-white'
                      : 'bg-yellow-600 text-white text-sm'
                  }`}>
                    <p>{message.content}</p>
                    {message.bondIncrease && (
                      <motion.div 
                        className="mt-2 flex items-center gap-1 text-xs text-yellow-200"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Star className="w-3 h-3" />
                        Trust deepened!
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-purple-500/30 bg-purple-900/10">
              <div className="text-xs text-purple-300 mb-2">
                Status: {socketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'} | 
                {isTyping ? ' 💭 Processing thoughts...' : ' ✅ Ready for coaching'} | 
                Session: {currentSessionType} | Messages: {messages.length}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputMessage);
                    }
                  }}
                  placeholder={isTyping ? 'Thinking about your question...' : `Coach ${selectedCharacter?.name || 'your team member'}...`}
                  disabled={isTyping}
                  className="flex-1 bg-gray-700 border border-purple-500/30 rounded-full px-4 py-2 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping || !socketRef.current?.connected}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}