import { HeadquartersState } from '../types/headquarters';
import { Character } from '../data/characters';

export interface ConfessionalMessage {
  id: number;
  type: 'character' | 'hostmaster';
  content: string;
  timestamp: Date;
}

export interface ConfessionalData {
  activeCharacter: string | null;
  isInterviewing: boolean;
  isPaused: boolean;
  questionCount: number;
  messages: ConfessionalMessage[];
  isLoading: boolean;
}

/**
 * Clear all confessional timeouts
 */
export const clearAllConfessionalTimeouts = (
  confessionalTimeouts: React.MutableRefObject<Set<NodeJS.Timeout>>
) => {
  confessionalTimeouts.current.forEach(timeout => clearTimeout(timeout));
  confessionalTimeouts.current.clear();
  console.log('🧹 Cleared all confessional timeouts');
};

/**
 * Start a confessional interview for a character
 */
export const startConfessional = async (
  characterName: string,
  availableCharacters: Character[],
  confessionalTimeouts: React.MutableRefObject<Set<NodeJS.Timeout>>,
  setConfessionalData: (data: ConfessionalData) => void,
  headquarters: any
) => {
  console.log('🎬 Starting confessional for:', characterName);
  
  // Immediately clear any existing interviews and timeouts
  clearAllConfessionalTimeouts(confessionalTimeouts);
  
  const character = availableCharacters.find(c => c.id === characterName);
  console.log('🎭 Found character:', character?.name, 'ID:', character?.id);
  if (!character) return;

  const initialQuestion = `the living arrangements and how you're adjusting to sharing space with the other fighters`;

  // Create initial confessional data
  const initialConfessionalData: ConfessionalData = {
    activeCharacter: characterName,
    isInterviewing: true,
    isPaused: false,
    questionCount: 1,
    messages: [],
    isLoading: false
  };

  // Set new interview data (complete replacement, not updating previous state)
  setConfessionalData(initialConfessionalData);

  // Automatically generate character's response to the initial question
  const timeoutId = setTimeout(() => {
    generateCharacterResponse(characterName, initialQuestion, availableCharacters, headquarters, initialConfessionalData, confessionalTimeouts, setConfessionalData);
  }, 1500);
  
  confessionalTimeouts.current.add(timeoutId);
};


/**
 * Pause confessional interview
 */
export const pauseConfessional = (
  setConfessionalData: (updater: (prev: any) => any) => void
) => {
  console.log('⏸️ Pausing confessional interview');
  setConfessionalData(prev => ({
    ...prev,
    isPaused: true
  }));
};

/**
 * Continue confessional interview
 */
export const continueConfessional = (
  confessionalData: ConfessionalData,
  confessionalTimeouts: React.MutableRefObject<Set<NodeJS.Timeout>>,
  availableCharacters: Character[],
  headquarters: HeadquartersState,
  setConfessionalData: (updater: (prev: ConfessionalData) => ConfessionalData) => void
) => {
  if (!confessionalData.activeCharacter) return;
  
  console.log('▶️ Continuing confessional interview');
  setConfessionalData(prev => ({
    ...prev,
    isPaused: false
  }));

  // Find the last HOSTMASTER question and continue from there
  const lastHostmasterMessage = confessionalData.messages
    .filter(m => m.type === 'hostmaster')
    .pop();
  
  if (lastHostmasterMessage) {
    const continueTimeoutId = setTimeout(() => {
      generateCharacterResponse(confessionalData.activeCharacter!, lastHostmasterMessage.content, availableCharacters, headquarters, confessionalData, confessionalTimeouts, setConfessionalData);
    }, 1000);
    confessionalTimeouts.current.add(continueTimeoutId);
  }
};

// generateCharacterResponse function - extracted from TeamHeadquarters.tsx (lines 664-837)
export const generateCharacterResponse = async (
  characterName: string, 
  hostmasterQuestion: string,
  availableCharacters: any[],
  headquarters: any,
  confessionalData: ConfessionalData,
  confessionalTimeouts: React.MutableRefObject<Set<NodeJS.Timeout>>,
  setConfessionalData: React.Dispatch<React.SetStateAction<ConfessionalData>>
) => {
  console.log('🎪 Generating response for characterName:', characterName);
  const character = availableCharacters.find(c => c.id === characterName);
  console.log('🎨 Character found:', character?.name, 'ID:', character?.id);
  if (!character) return;

  // Check if interview is paused or stopped
  if (confessionalData.isPaused || !confessionalData.isInterviewing) {
    return;
  }

  try {
    // First, generate the character's response to the HOSTMASTER question
    const characterContext = {
      characterId: character.id,
      characterName: character.name,
      personality: character.personality,
      historicalPeriod: character.historicalPeriod,
      mythology: character.mythology,
      currentBondLevel: character.bondLevel,
      previousMessages: []
    };

    // Get other characters for context
    const otherCharacters = availableCharacters
      .filter(c => c.id !== characterName)
      .map(c => c.name)
      .slice(0, 4); // Limit to 4 for prompt length

    const characterPrompt = `You are ${character.name} in the BLANK WARS reality show confessional booth. An invisible director behind the camera just asked you an inaudible question about: "${hostmasterQuestion}"

🎬 CONFESSIONAL BOOTH SETUP:
- You're alone in the confessional booth, speaking directly to the camera
- The director's voice is inaudible to viewers - only your responses are heard
- You react to their unheard question/prompt and address it naturally
- This creates authentic reality TV confessional footage

🎬 BLANK WARS REALITY SHOW CONTEXT:
- You're competing in a gladiator-style fighting tournament reality show
- Famous warriors/legends from different eras are forced to live together
- You all sleep in cramped ${headquarters.currentTier} quarters with limited privacy
- Current housemates: ${otherCharacters.join(', ')} (and others)
- There's constant drama about who gets the good bed, bathroom time, food, etc.
- Everyone's competing for prize money and trying to avoid elimination
- Alliances form and break constantly - trust no one
- The cameras are always rolling, capturing every argument and breakdown

YOUR CHARACTER ESSENCE:
- Name: ${character.name}
- Personality: ${character.personality.traits.join(', ')}
- Background: ${character.historicalPeriod} - ${character.mythology}
- Speech Style: ${character.personality.speechStyle}
- Core Motivations: ${character.personality.motivations.join(', ')}

INVISIBLE DIRECTOR RESPONSE STYLE:
- Begin your response as if reacting to their inaudible question
- Use phrases like "You want to know about..." or "That's an interesting question..." 
- Reference the topic naturally as if they just asked you about it
- Stay in character with authentic reactions to the invisible prompt
- Keep responses 1-2 sentences but make them memorable and revealing
- Show your historical personality clashing with reality TV dynamics

EXAMPLE RESPONSE PATTERNS:
- "You're asking about the living arrangements? Well, let me tell you..."
- "That's a good question about [topic]. From my perspective..."
- "You want the truth about [situation]? Here's what really happened..."
- "Interesting that you'd ask about that. The reality is..."

Remember: Only YOUR voice is heard. React to the invisible director's question naturally while staying true to your legendary character!`;

    // Generate character response via API
    console.log('🎤 Generating character response for:', character.name);
    console.log('📦 Sending characterContext:', characterContext);
    
    // Set loading state
    setConfessionalData(prev => ({ ...prev, isLoading: true }));
    
    const response = await fetch('http://localhost:3006/api/confessional-character-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterContext,
        prompt: characterPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const characterResponse = await response.json();
    console.log('✅ Character response received:', characterResponse.message?.substring(0, 100) + '...');

    // Add character response to messages
    setConfessionalData(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: Date.now(),
        type: 'character',
        content: characterResponse.message,
        timestamp: new Date()
      }],
      isLoading: false
    }));

    // After character responds, generate next HOSTMASTER question
    const hostmasterTimeoutId = setTimeout(async () => {
      try {
        const interviewContext = {
          characterName: character.name,
          characterPersonality: character.personality,
          livingConditions: headquarters.currentTier,
          previousQuestions: confessionalData.messages.filter(m => m.type === 'hostmaster').map(m => m.content),
          characterResponses: [...confessionalData.messages.filter(m => m.type === 'character').map(m => m.content), characterResponse.message]
        };

        // Set loading state for hostmaster question generation
        setConfessionalData(prev => ({ ...prev, isLoading: true }));
        
        const response = await fetch('http://localhost:3006/api/confessional-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: interviewContext,
            userResponse: characterResponse.message
          })
        });

        const data = await response.json();
        
        // Get current question count before incrementing
        const currentQuestionCount = confessionalData.questionCount;
        
        // Increment question count and clear loading state
        setConfessionalData(prev => ({
          ...prev,
          questionCount: prev.questionCount + 1,
          isLoading: false,
          messages: [...prev.messages, {
            id: Date.now(),
            type: 'hostmaster',
            content: data.hostmasterResponse,
            timestamp: new Date()
          }]
        }));

        // Only continue automatically for first 2 questions, then pause for user control
        if (currentQuestionCount < 2) {
          const continueTimeoutId = setTimeout(() => {
            generateCharacterResponse(characterName, data.hostmasterResponse, availableCharacters, headquarters, confessionalData, confessionalTimeouts, setConfessionalData);
          }, 3000);
          confessionalTimeouts.current.add(continueTimeoutId);
        } else {
          // Pause after 2-3 questions
          setConfessionalData(prev => ({
            ...prev,
            isPaused: true
          }));
        }

      } catch (error) {
        console.error('Director prompt error:', error);
        const fallbackQuestion = "your thoughts on team dynamics and how you think your teammates would describe your role in the house";
        
        // Get current question count before checking
        const currentQuestionCount = confessionalData.questionCount;
        
        setConfessionalData(prev => ({
          ...prev,
          isLoading: false,
          questionCount: prev.questionCount + 1,
          messages: [...prev.messages, {
            id: Date.now(),
            type: 'hostmaster',
            content: fallbackQuestion,
            timestamp: new Date()
          }]
        }));

        // Only continue if under the limit
        if (currentQuestionCount < 2) {
          const fallbackTimeoutId = setTimeout(() => {
            generateCharacterResponse(characterName, fallbackQuestion, availableCharacters, headquarters, confessionalData, confessionalTimeouts, setConfessionalData);
          }, 3000);
          confessionalTimeouts.current.add(fallbackTimeoutId);
        } else {
          // Pause after reaching limit
          setConfessionalData(prev => ({
            ...prev,
            isPaused: true
          }));
        }
      }
    }, 2000);
    
    confessionalTimeouts.current.add(hostmasterTimeoutId);

  } catch (error) {
    console.error('Character response error:', error);
    setConfessionalData(prev => ({ ...prev, isLoading: false }));
  }
};