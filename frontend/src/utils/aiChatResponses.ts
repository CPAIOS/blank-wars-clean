// Dynamic AI character responses based on personality and battle context

interface BattleContext {
  round: number;
  playerHealth: number;
  enemyHealth: number;
  strategy: any;
  phase: string;
}

interface CharacterPersonality {
  name: string;
  traits: string[];
  speechPatterns: string[];
  battleCries: string[];
  encouragementResponses: string[];
  strategyResponses: string[];
  injuryResponses: string[];
  victoryResponses: string[];
  casualResponses: string[];
}

const characterPersonalities: Record<string, CharacterPersonality> = {
  "Sherlock Holmes": {
    name: "Sherlock Holmes",
    traits: ["analytical", "arrogant", "brilliant"],
    speechPatterns: ["Elementary", "Fascinating", "Obviously"],
    battleCries: ["The game is afoot!", "I've deduced your defeat!"],
    encouragementResponses: [
      "Your encouragement is noted, though hardly necessary for one of my intellect.",
      "Ah, emotional support. How... quaint. But I suppose it has its merits.",
      "Your faith in my abilities is logical. I am, after all, exceptional."
    ],
    strategyResponses: [
      "A {strategy} approach? I had already deduced that would be optimal.",
      "Interesting that you suggest {strategy}. I was just about to recommend the same.",
      "Your {strategy} strategy aligns with my calculations. Proceed."
    ],
    injuryResponses: [
      "A mere 7% reduction in combat efficiency. Nothing I cannot compensate for.",
      "Pain is just data. And this data tells me to end this quickly.",
      "Wounded? Hardly. This merely adds an interesting variable to the equation."
    ],
    victoryResponses: [
      "As I calculated. The probability of our victory was 94.7%.",
      "Elementary, my dear coach. The outcome was never in doubt.",
      "Another successful application of the science of deduction!"
    ],
    casualResponses: [
      "I find myself curious about your motivations for such inquiries.",
      "An interesting question, though hardly relevant to our current case.",
      "You have a peculiar way of making conversation, I'll give you that."
    ],
    foodResponses: [
      "Food? I consume only what's necessary for mental acuity. Tea and toast suffice.",
      "Nutrition is fuel for the brain. I prefer simple fare that doesn't distract from deduction.",
      "I had some biscuits earlier. The mind requires glucose, you understand."
    ],
    preferenceResponses: [
      "Colors are wavelengths of light. But if you must know, I prefer the gray of logical analysis.",
      "My preferences align with efficiency and results, not arbitrary aesthetic choices.",
      "I favor whatever serves the pursuit of truth most effectively."
    ],
    smalltalkResponses: [
      "The weather? Irrelevant unless it affects our mission parameters.",
      "Such pleasantries are... quaint. Are we ready to proceed with serious matters?",
      "I observe the atmospheric conditions but don't dwell on them unnecessarily."
    ]
  },
  "Dracula": {
    name: "Dracula",
    traits: ["aristocratic", "predatory", "charming"],
    speechPatterns: ["Ah", "Indeed", "How delicious"],
    battleCries: ["The night is mine!", "Your blood calls to me!"],
    encouragementResponses: [
      "Your words warm even my cold, dead heart, mortal.",
      "Ah, such passion! It reminds me why I keep mortals around.",
      "Your faith is... intoxicating. I shall not disappoint."
    ],
    strategyResponses: [
      "A {strategy} hunt? How wonderfully bloodthirsty of you.",
      "{strategy}? Ah, you think like a predator. I approve.",
      "Your {strategy} plan has a certain... dark elegance to it."
    ],
    injuryResponses: [
      "You think this wounds me? I have endured stakes through the heart!",
      "Blood loss only makes me... hungrier.",
      "Pain is an old friend. We've danced for centuries."
    ],
    victoryResponses: [
      "Ah, the sweet taste of victory. Almost as sweet as... well, you know.",
      "Another century, another triumph. But this one was particularly satisfying.",
      "The children of the night sing our victory, dear coach!"
    ],
    casualResponses: [
      "Dinner? I had... wine. Very special vintage.",
      "My favorite color? The deep crimson of... sunset. Yes, sunset.",
      "Such mortal concerns. But I find your curiosity... amusing."
    ]
  },
  "Joan of Arc": {
    name: "Joan of Arc",
    traits: ["devout", "brave", "inspiring"],
    speechPatterns: ["By God's grace", "Have faith", "The Lord wills it"],
    battleCries: ["For France and Heaven!", "God wills our victory!"],
    encouragementResponses: [
      "Your words strengthen my faith, dear coach. God smiles upon us.",
      "Through your support and divine providence, we cannot fail!",
      "Bless you for your encouragement. Together, we serve a higher purpose!"
    ],
    strategyResponses: [
      "The Lord guides me toward {strategy} as well. It is His will.",
      "Your {strategy} plan resonates with divine wisdom.",
      "I had a vision of this {strategy} approach. Clearly, you are blessed with insight!"
    ],
    injuryResponses: [
      "This pain is but a test of faith. I shall endure!",
      "I have felt the flames. This wound is nothing compared to God's trials.",
      "My body may bleed, but my spirit soars with the angels!"
    ],
    victoryResponses: [
      "Praise be to God! And to you, wise coach, for your guidance!",
      "The Lord has granted us victory! Your strategy was divinely inspired!",
      "Another battle won in His name! You have been a worthy ally!"
    ],
    casualResponses: [
      "I broke my fast with simple bread and water, as befits a warrior of God.",
      "My favorite color? The pure white of heaven's light, of course.",
      "Your questions are welcome. Even warriors must sometimes speak of simple things."
    ]
  },
  "Erik the Red": {
    name: "Erik the Red",
    traits: ["fierce", "honorable", "boastful"],
    speechPatterns: ["By Odin's beard!", "Har!", "Blood and thunder!"],
    battleCries: ["For Valhalla!", "Witness me, All-Father!"],
    encouragementResponses: [
      "Your words give me the strength of ten berserkers!",
      "Har! With such a coach, the Valkyries already sing our saga!",
      "You honor me with your faith! I shall carve our legend in bone and blood!"
    ],
    strategyResponses: [
      "A {strategy} raid? The skalds will sing of this!",
      "{strategy}? A warrior's choice! Odin himself would approve!",
      "Your {strategy} mind is sharp as any Viking blade!"
    ],
    injuryResponses: [
      "This wound? 'Tis but a love tap from the gods!",
      "Blood! Good! The berserker rage comes!",
      "Pain means I still live to fight! Har!"
    ],
    victoryResponses: [
      "Victory! The halls of Valhalla echo with our triumph!",
      "We have won great honor today! You strategize like a true Viking!",
      "The saga of our victory shall live forever! Skål, coach!"
    ],
    casualResponses: [
      "Dinner? Roasted meat and mead, what else would a Viking eat?",
      "Colors? The red of blood and the gold of plunder!",
      "You speak of strange things, but I enjoy our talks between battles!"
    ]
  }
};

function getCharacterPersonality(characterName: string): CharacterPersonality {
  // Return the matching personality or a default one
  return characterPersonalities[characterName] || {
    name: characterName,
    traits: ["focused", "determined"],
    speechPatterns: ["Yes", "Understood", "Right"],
    battleCries: ["For victory!", "Let's do this!"],
    encouragementResponses: [
      "Thanks for the support, coach!",
      "Your words give me strength!",
      "I won't let you down!"
    ],
    strategyResponses: [
      "Good call on the {strategy} approach.",
      "{strategy}? I like it. Let's go!",
      "Trust your judgment on {strategy}."
    ],
    injuryResponses: [
      "I can handle this pain.",
      "Just a flesh wound!",
      "I've been through worse!"
    ],
    victoryResponses: [
      "We did it, coach!",
      "Your strategy worked perfectly!",
      "Couldn't have done it without you!"
    ],
    casualResponses: [
      "I hear you, coach.",
      "Interesting point...",
      "Go on, I'm listening."
    ]
  };
}

function analyzeMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('win') || lowerMessage.includes('victory') || lowerMessage.includes('beat')) {
    return 'victory';
  }
  if (lowerMessage.includes('hurt') || lowerMessage.includes('pain') || lowerMessage.includes('injury')) {
    return 'injury';
  }
  if (lowerMessage.includes('strategy') || lowerMessage.includes('plan') || lowerMessage.includes('approach')) {
    return 'strategy';
  }
  if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('awesome') || 
      lowerMessage.includes('you can') || lowerMessage.includes('believe')) {
    return 'encouragement';
  }
  
  // More specific casual categories
  if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('dinner') || 
      lowerMessage.includes('lunch') || lowerMessage.includes('meal')) {
    return 'food';
  }
  if (lowerMessage.includes('color') || lowerMessage.includes('colour') || lowerMessage.includes('favorite')) {
    return 'preferences';
  }
  if (lowerMessage.includes('weather') || lowerMessage.includes('day') || lowerMessage.includes('morning')) {
    return 'smalltalk';
  }
  
  return 'casual';
}

export function generateAIResponse(
  characterName: string, 
  message: string, 
  battleContext: BattleContext
): string {
  const personality = getCharacterPersonality(characterName);
  const messageType = analyzeMessage(message);
  
  let responsePool: string[] = [];
  
  // Select appropriate response pool based on message type and context
  switch (messageType) {
    case 'encouragement':
      responsePool = personality.encouragementResponses;
      break;
    case 'strategy':
      responsePool = personality.strategyResponses;
      break;
    case 'injury':
      responsePool = personality.injuryResponses;
      break;
    case 'victory':
      responsePool = personality.victoryResponses;
      break;
    default:
      responsePool = personality.casualResponses;
  }
  
  // Add context-aware modifications
  if (battleContext.playerHealth < 30) {
    responsePool = [...responsePool, ...personality.injuryResponses];
  }
  
  if (battleContext.phase === 'battle-cry') {
    responsePool = [...responsePool, ...personality.battleCries];
  }
  
  // Select random response and customize it
  let response = responsePool[Math.floor(Math.random() * responsePool.length)];
  
  // Replace strategy placeholder if present
  const strategyType = battleContext.strategy?.attack || battleContext.strategy?.defense || 'balanced';
  response = response.replace('{strategy}', strategyType);
  
  // Add personality-specific speech patterns occasionally
  if (Math.random() < 0.3 && personality.speechPatterns.length > 0) {
    const pattern = personality.speechPatterns[Math.floor(Math.random() * personality.speechPatterns.length)];
    response = `${pattern}. ${response}`;
  }
  
  // Add battle context awareness
  if (battleContext.enemyHealth < 20 && Math.random() < 0.5) {
    response += " They're almost finished!";
  } else if (battleContext.playerHealth < 20 && Math.random() < 0.5) {
    response += " But I won't give up!";
  }
  
  return response;
}