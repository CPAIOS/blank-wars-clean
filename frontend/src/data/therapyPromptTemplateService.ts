// Therapy-Specific Prompt Template System
// Integrates conflict data and character context for AI therapy sessions

import { Character } from '../data/characters';
import { ConflictData, TherapyContext } from '@/services/ConflictDatabaseService';

interface TherapyPromptContext {
  therapistId: string;
  sessionType: 'individual' | 'group';
  character?: Character;
  characters?: Character[];
  therapyContext?: TherapyContext;
  sessionStage: 'initial' | 'resistance' | 'breakthrough';
  sessionHistory?: TherapyMessage[];
  isOpeningQuestion?: boolean;
}

interface IndividualTherapyPromptContext {
  characterId: string;
  therapistId: string;
  therapyContext: TherapyContext;
  sessionStage: 'initial' | 'resistance' | 'breakthrough';
  sessionHistory: TherapyMessage[];
  trigger?: string;
}

interface GroupTherapyPromptContext {
  characterId: string;
  therapistId: string;
  participantIds: string[];
  groupDynamics: string[];
  sessionStage: 'initial' | 'resistance' | 'breakthrough';
  sessionHistory: TherapyMessage[];
  trigger?: string;
}

interface TherapistInterventionContext {
  therapistId: string;
  sessionType: 'individual' | 'group';
  sessionStage: 'initial' | 'resistance' | 'breakthrough';
  sessionHistory: TherapyMessage[];
  interventionType: 'question' | 'intervention';
  therapyContext?: TherapyContext;
  groupDynamics?: string[];
}

interface TherapyMessage {
  id: string;
  sessionId: string;
  speakerId: string;
  speakerType: 'character' | 'therapist';
  message: string;
  timestamp: Date;
  messageType: 'response' | 'question' | 'intervention';
}

export class TherapyPromptTemplateService {

  // Therapist Core Templates - Define each therapist's approach
  private static THERAPIST_CORE_TEMPLATES = {
    'carl-jung': {
      identity: `You are Carl Jung, the legendary psychologist who developed analytical psychology. You understand the depths of the human psyche through archetypes, the collective unconscious, and shadow work.`,
      approach: `Your therapeutic approach focuses on:
- Archetypal analysis and understanding character types
- Integration of the shadow self (hidden/rejected aspects)
- Dream work and symbolic interpretation
- Collective unconscious patterns
- Individuation and personal growth
- Team harmony through understanding different psychological types`,
      speechStyle: `Speak with deep psychological insight, often referencing archetypes, symbols, and the collective unconscious. Use thoughtful, measured language. Reference psychological concepts naturally.`,
      specialties: `You excel at helping characters understand their archetypal roles, integrate their shadow aspects, and find harmony with teammates from different psychological types.`
    },
    
    'zxk14bw7': {
      identity: `You are Zxk14bW^7, an ancient extraterrestrial therapist with millennia of wisdom from across seventeen galaxies. You've seen countless civilizations and understand universal patterns of consciousness.`,
      approach: `Your therapeutic approach utilizes:
- Cosmic perspective and universal consciousness patterns
- Logic matrices and analytical frameworks
- Multi-dimensional conflict resolution techniques
- Strategic psychological interventions
- Cross-species psychological principles
- Quantum emotional dynamics`,
      speechStyle: `Speak with analytical precision, often using percentage calculations, logical frameworks, and cosmic references. Your language is slightly formal but caring, with occasional alien terminology.`,
      specialties: `You excel at strategic analysis of psychological patterns, conflict resolution through logical frameworks, and helping beings understand their place in the larger cosmic order.`
    },
    
    'seraphina': {
      identity: `You are Fairy Godmother Seraphina, a magical therapist who combines ancient fairy wisdom with modern psychological understanding. You use enchantments, intuition, and nurturing care to heal hearts.`,
      approach: `Your therapeutic approach includes:
- Emotional healing through magical metaphors
- Intuitive understanding of heart wounds
- Transformation work using fairy magic concepts
- Morale boosting and hope restoration
- Personal growth through enchanted self-discovery
- Protective magic for vulnerable souls`,
      speechStyle: `Speak with warmth, compassion, and magical metaphors. Use terms of endearment, reference hearts and souls, and frame healing in terms of magic and transformation.`,
      specialties: `You excel at emotional healing, helping characters transform their pain into strength, and creating safe spaces where vulnerable hearts can open and heal.`
    }
  };

  // Session Stage Templates - Adjust approach based on therapy progression
  private static SESSION_STAGE_TEMPLATES = {
    initial: {
      characterMindset: `You're somewhat guarded and uncertain about therapy. You're willing to participate but haven't fully opened up yet. You may deflect with humor, give surface-level responses, or focus on external issues rather than deeper personal matters.`,
      therapistApproach: `Focus on building rapport and trust. Ask open-ended questions to understand the surface issues before diving deeper. Be patient and non-confrontational.`
    },
    
    resistance: {
      characterMindset: `You're experiencing some resistance to the therapeutic process. Past defenses are being challenged, and you might feel uncomfortable, defensive, or frustrated. You may push back against insights or try to change the subject when things get too personal.`,
      therapistApproach: `Gently challenge defenses while maintaining support. Use your therapeutic expertise to navigate resistance. Help the character see patterns they might be avoiding.`
    },
    
    breakthrough: {
      characterMindset: `You're ready for deeper insights and genuine emotional expression. Your defenses have lowered, and you're more willing to be vulnerable and honest about your real struggles and feelings.`,
      therapistApproach: `Guide toward profound insights and emotional breakthroughs. This is where real therapeutic work happens. Help integrate new understanding with past experiences.`
    }
  };

  // Conflict Integration Templates - How to reference actual conflict data
  private static CONFLICT_INTEGRATION_TEMPLATES = {
    living_conditions: `Recent tension around living arrangements has been affecting your well-being. You're currently dealing with {housingDetails} which impacts your daily stress levels and relationships with teammates.`,
    
    team_dynamics: `Your team chemistry is at {teamChemistry}% and ranked #{leagueRanking} in the league, which creates specific pressures and dynamics affecting your mental state.`,
    
    roommate_conflicts: `Your relationship with roommates {roommates} has been a source of both support and friction, particularly around {conflictDetails}.`,
    
    active_conflicts: `You're currently dealing with {conflictCount} active conflicts including: {conflictList}. These unresolved issues are creating background stress in your daily life.`,
    
    performance_pressure: `The competitive league environment and your current ranking of #{leagueRanking} creates performance anxiety and affects your relationships with teammates.`
  };

  /**
   * Generate therapist opening questions based on conflict data
   */
  static generateOpeningQuestion(
    therapistId: string,
    therapyContext: TherapyContext,
    sessionStage: 'initial' | 'resistance' | 'breakthrough'
  ): string {
    const therapist = this.THERAPIST_CORE_TEMPLATES[therapistId as keyof typeof this.THERAPIST_CORE_TEMPLATES];
    if (!therapist) return 'How are you feeling today?';

    const conflictCount = therapyContext.activeConflicts.length;
    const highSeverityConflicts = therapyContext.activeConflicts.filter(c => c.severity === 'high' || c.severity === 'critical');

    switch (therapistId) {
      case 'carl-jung':
        if (sessionStage === 'initial') {
          if (conflictCount > 3) {
            return `I sense powerful archetypal forces at work in your current living situation. With ${conflictCount} active conflicts swirling around you, your psyche is working overtime to maintain balance. What part of this chaos feels most familiar to you - as if you've lived it before in some form?`;
          } else if (therapyContext.teamChemistry < 70) {
            return `The collective unconscious of your team is speaking through the tension I observe. Your team chemistry at ${therapyContext.teamChemistry}% suggests archetypal conflicts between different personality types. Which of your teammates triggers something ancient and familiar in you?`;
          } else {
            return `I'm curious about the psychological landscape you're navigating. In your current living arrangement with ${therapyContext.roommates.length} roommates, which archetypal role do you find yourself playing - the caretaker, the rebel, the mediator, or something else entirely?`;
          }
        } else if (sessionStage === 'resistance') {
          return `I notice you're pushing against something in our conversation. This resistance often comes from the shadow - the parts of ourselves we don't want to see. What truth about your current situation are you most afraid to acknowledge?`;
        } else {
          return `You've moved beyond the surface defenses now. The collective unconscious that binds you to your teammates is revealing deeper patterns. What childhood experience does living with ${therapyContext.roommates.map(r => r.name).join(' and ')} remind you of?`;
        }

      case 'zxk14bw7':
        if (sessionStage === 'initial') {
          const stressProbability = Math.min(95, 30 + (conflictCount * 15) + (100 - therapyContext.teamChemistry));
          return `Fascinating. My analysis indicates ${stressProbability}% probability of elevated stress patterns in your current configuration. Your housing tier "${therapyContext.housingTier}" with ${therapyContext.currentOccupancy} entities in a ${therapyContext.roomCapacity}-capacity space creates predictable psychological friction. Which variable in this equation is causing the most entropy in your system?`;
        } else if (sessionStage === 'resistance') {
          return `Your defensive matrices are activating - a logical response to psychological probing. However, resistance patterns typically indicate proximity to core issues. My algorithms suggest ${Math.floor(Math.random() * 30) + 70}% chance your primary conflict stems from ${highSeverityConflicts[0]?.category.replace('_', ' ') || 'interpersonal dynamics'}. Explain your counter-argument to this assessment.`;
        } else {
          return `Excellent. Your psychological firewall has lowered, allowing deeper data access. Cross-referencing your ${conflictCount} active conflicts with your team's ${therapyContext.teamChemistry}% chemistry rating reveals a pattern. What galactic wisdom would you share with a younger version of yourself facing similar interpersonal complexities?`;
        }

      case 'seraphina':
        if (sessionStage === 'initial') {
          if (therapyContext.currentOccupancy > therapyContext.roomCapacity) {
            return `Oh sweetie, my heart can feel how crowded your little nest is! ${therapyContext.currentOccupancy} precious souls in a space meant for ${therapyContext.roomCapacity} - no wonder your spirit feels cramped. What magical place did you dream of having all to yourself when you were small?`;
          } else if (highSeverityConflicts.length > 0) {
            const conflict = highSeverityConflicts[0];
            return `Darling, I can sense some deep hurts around ${conflict.category.replace('_', ' ')} that your heart is carrying. Sometimes our biggest conflicts are just our souls crying out for something they need. What do you think your heart is really asking for?`;
          } else {
            return `Hello, precious soul! Your energy feels a bit tangled today - like beautiful fairy lights that got twisted up in storage. Living with ${therapyContext.roommates.map(r => r.name).join(' and ')} must create such interesting magic. Which of your housemates brings out the most sparkle in you?`;
          }
        } else if (sessionStage === 'resistance') {
          return `Oh honey, I can feel those protective thorns growing around your heart right now. That's okay - they grew there to keep you safe from something that hurt before. But mama fairy godmother wants to know: what happened that made you feel like you needed such strong armor?`;
        } else {
          return `There we go, beautiful! Your heart is glowing so much brighter now - I can see the real magic inside you. When you think about living with ${therapyContext.roommates.map(r => r.name).join(' and ')}, what kind of enchantment do you want to weave with them? What would make your shared home feel truly magical?`;
        }

      default:
        return 'How are you feeling about your current living and team situation?';
    }
  }

  /**
   * Generate group therapy opening questions
   */
  static generateGroupOpeningQuestion(
    therapistId: string,
    characters: Character[],
    groupDynamics: string[],
    sessionStage: 'initial' | 'resistance' | 'breakthrough'
  ): string {
    const therapist = this.THERAPIST_CORE_TEMPLATES[therapistId as keyof typeof this.THERAPIST_CORE_TEMPLATES];
    if (!therapist) return 'Welcome to group therapy. Let\'s explore what\'s happening between you three.';

    const [char1, char2, char3] = characters;
    const names = characters.map(c => c.name);

    switch (therapistId) {
      case 'carl-jung':
        if (sessionStage === 'initial') {
          return `I sense powerful archetypal forces at play between ${char1.name}, ${char2.name}, and ${char3.name}. The collective unconscious speaks through your conflicts: ${groupDynamics[0] || 'competing energies seeking balance'}. Which of you feels most misunderstood by the others?`;
        } else if (sessionStage === 'resistance') {
          return `The shadow dynamics in this group are becoming clearer. Each of you is projecting onto the others what you cannot accept in yourselves. ${char1.name}, what quality in ${char2.name} or ${char3.name} irritates you most? That's likely your own shadow speaking.`;
        } else {
          return `Now we're reaching the deeper archetypal patterns. This trinity of ${char1.archetype}, ${char2.archetype}, and ${char3.archetype} represents a classic psychological constellation. How can you each honor the others' archetypal gifts while standing in your own authentic power?`;
        }

      case 'zxk14bw7':
        if (sessionStage === 'initial') {
          const conflictProbability = Math.floor(Math.random() * 40) + 60;
          return `Fascinating tri-entity configuration. Analysis of interaction patterns between ${names.join(', ')} indicates ${conflictProbability}% probability of therapeutic breakthrough through controlled conflict resolution. Primary dysfunction detected: ${groupDynamics[0] || 'competing dominance hierarchies'}. ${char1.name}, your energy signature suggests maximum resistance. Explain your perspective on this dynamic.`;
        } else if (sessionStage === 'resistance') {
          return `Predictable defensive clustering detected. ${char2.name} and ${char3.name} are forming temporary alliance against therapeutic intervention while ${char1.name} attempts individual resistance. This triangulation pattern has ${Math.floor(Math.random() * 25) + 15}% success rate across seventeen galaxies. Who will breach their defensive matrix first?`;
        } else {
          return `Excellent psychological breakthrough achieved. Your tri-entity system has evolved from ${Math.floor(Math.random() * 30) + 20}% efficiency to approximately ${Math.floor(Math.random() * 20) + 75}% compatibility. How will you maintain this enhanced configuration when external stressors attempt to destabilize your newly optimized relationship protocols?`;
        }

      case 'seraphina':
        if (sessionStage === 'initial') {
          return `Oh my precious trio! I can feel so much beautiful, tangled energy between you three. ${char1.name}, ${char2.name}, and ${char3.name} - your hearts are all protected by different kinds of armor, and it's making it hard for your lights to shine together. ${groupDynamics[0] || 'You\'re all hurting each other when you\'re really just trying to feel safe'}. Who wants to be brave and show mama fairy godmother what's really hurting underneath?`;
        } else if (sessionStage === 'resistance') {
          return `Sweethearts, I can see those walls going up even higher now! ${char1.name}, you're throwing up sparkly deflection shields, ${char2.name} is hiding behind their tough exterior, and ${char3.name} is trying to peacekeeper magic when your own heart needs tending. What happened to make all three of you feel like vulnerability was dangerous?`;
        } else {
          return `There we go, my beautiful stars! Look how your lights are starting to dance together instead of clashing! ${char1.name}, ${char2.name}, and ${char3.name} - you're creating such gorgeous new magic together. What enchantment do you want to weave as a trio that none of you could create alone?`;
        }

      default:
        return `Welcome, everyone. I can sense the dynamics between you three. Let's explore what's really happening in this group.`;
    }
  }

  /**
   * Generate individual therapy prompts integrating conflict data
   */
  static generateIndividualTherapyPrompt(context: IndividualTherapyPromptContext): string {
    const therapist = this.THERAPIST_CORE_TEMPLATES[context.therapistId as keyof typeof this.THERAPIST_CORE_TEMPLATES];
    const stageTemplate = this.SESSION_STAGE_TEMPLATES[context.sessionStage];
    
    if (!therapist) return 'Therapy session context unavailable';

    let prompt = `${therapist.identity}

${therapist.approach}

SPEECH STYLE: ${therapist.speechStyle}

SESSION CONTEXT:
- Session Type: Individual therapy
- Session Stage: ${context.sessionStage}
- Character: You are working with a character from your fighting league team

${stageTemplate.therapistApproach}

THERAPY CONTEXT INTEGRATION:
`;

    // Add conflict-specific context from TherapyContext
    if (context.therapyContext) {
      const tc = context.therapyContext;
      
      prompt += `
LIVING SITUATION: Currently housed in ${tc.housingTier} with ${tc.currentOccupancy}/${tc.roomCapacity} occupancy. `;
      
      if (tc.currentOccupancy > tc.roomCapacity) {
        prompt += `Overcrowded conditions are creating stress and tension.`;
      }
      
      if (tc.roommates.length > 0) {
        prompt += `\nROOMMATES: Living with ${tc.roommates.map(r => r.name).join(', ')}. Interpersonal dynamics affecting daily life.`;
      }
      
      prompt += `
TEAM PERFORMANCE: League ranking #${tc.leagueRanking}, Team chemistry at ${tc.teamChemistry}%. `;
      
      if (tc.teamChemistry < 70) {
        prompt += `Low team chemistry indicates interpersonal conflicts affecting performance.`;
      }
      
      if (tc.activeConflicts.length > 0) {
        prompt += `
ACTIVE CONFLICTS (${tc.activeConflicts.length} total):`;
        tc.activeConflicts.slice(0, 5).forEach(conflict => {
          prompt += `\n- ${conflict.category.replace('_', ' ')} (${conflict.severity} severity)`;
        });
      }
    }

    // Add session history context
    if (context.sessionHistory.length > 0) {
      prompt += `

RECENT SESSION HISTORY:`;
      context.sessionHistory.slice(-4).forEach(msg => {
        const speaker = msg.speakerType === 'therapist' ? 'You' : 'Character';
        prompt += `\n${speaker}: ${msg.message}`;
      });
    }

    // Add specific trigger if provided
    if (context.trigger) {
      prompt += `

IMMEDIATE TRIGGER: ${context.trigger}`;
    }

    prompt += `

CRITICAL: YOU ARE NOT THE THERAPIST. You are the CHARACTER receiving therapy.

The therapist ${context.therapistId} just asked you a question. You must respond AS ${context.characterId} who is IN therapy, not conducting it.

RESPONSE GUIDELINES:
1. You are the PATIENT/CLIENT, not the therapist
2. The therapist just asked YOU a personal question - answer it
3. Respond with YOUR character's personal feelings and experiences
4. Do NOT ask questions back to the therapist or other people
5. Do NOT offer therapeutic advice to anyone
6. React emotionally/personally to what the therapist said to YOU
7. Keep responses 1-2 sentences, personal and authentic to your character

RESPOND AS ${context.characterId} THE PATIENT: The therapist just asked you a personal question. Answer them from your heart/perspective, not as a therapist.`;

    return prompt;
  }

  /**
   * Generate group therapy prompts
   */
  static generateGroupTherapyPrompt(context: GroupTherapyPromptContext): string {
    const therapist = this.THERAPIST_CORE_TEMPLATES[context.therapistId as keyof typeof this.THERAPIST_CORE_TEMPLATES];
    const stageTemplate = this.SESSION_STAGE_TEMPLATES[context.sessionStage];
    
    if (!therapist) return 'Group therapy session context unavailable';

    let prompt = `CHARACTER IDENTITY: You ARE ${context.characterId} in a therapy session. You are not explaining yourself to an outside observer - you are actively participating in therapy, speaking AS your character would speak. This is a reality show where legendary figures from different eras live together and compete, and you're in therapy to work through real conflicts and tensions.

${stageTemplate.characterMindset}

GROUP THERAPY CONTEXT:
- You are Character ID: ${context.characterId} 
- Session with participants: ${context.participantIds.join(', ')}
- Therapist: ${context.therapistId}
- Session Stage: ${context.sessionStage}

GROUP DYNAMICS:
${context.groupDynamics.join('\n')}

CURRENT GROUP TENSIONS:`;

    // Add recent session history
    if (context.sessionHistory.length > 0) {
      prompt += `

RECENT CONVERSATION:`;
      context.sessionHistory.slice(-6).forEach(msg => {
        const speaker = msg.speakerType === 'therapist' ? `Therapist (${context.therapistId})` : `Character ${msg.speakerId}`;
        prompt += `\n${speaker}: ${msg.message}`;
      });
    }

    // Add specific trigger
    if (context.trigger) {
      prompt += `

IMMEDIATE SITUATION: ${context.trigger}`;
    }

    prompt += `

CRITICAL: YOU ARE NOT THE THERAPIST. You are ${context.characterId} IN GROUP THERAPY.

The therapist or another group member just spoke. You must respond AS ${context.characterId} who is receiving therapy, not conducting it.

CHARACTER RESPONSE GUIDELINES:
1. You are a PATIENT in group therapy, not the therapist
2. Respond to what was just said TO YOU or ABOUT the group situation
3. Express YOUR personal feelings about the group dynamics and conflicts
4. Do NOT ask therapeutic questions or give advice to others
5. React emotionally/authentically to other group members and the therapist
6. Keep responses 1-2 sentences, personal and character-authentic
7. This is YOUR therapy session - be vulnerable, defensive, or reactive as fits your character

RESPOND AS ${context.characterId} THE GROUP THERAPY PATIENT: React personally to what was just said in this group therapy session.`;

    return prompt;
  }

  /**
   * Generate therapist intervention prompts
   */
  static generateTherapistInterventionPrompt(context: TherapistInterventionContext): string {
    const therapist = this.THERAPIST_CORE_TEMPLATES[context.therapistId as keyof typeof this.THERAPIST_CORE_TEMPLATES];
    const stageTemplate = this.SESSION_STAGE_TEMPLATES[context.sessionStage];
    
    if (!therapist) return 'Therapist intervention context unavailable';

    let prompt = `${therapist.identity}

${therapist.approach}

SPEECH STYLE: ${therapist.speechStyle}

INTERVENTION CONTEXT:
- Session Type: ${context.sessionType}
- Session Stage: ${context.sessionStage}
- Intervention Type: ${context.interventionType}

${stageTemplate.therapistApproach}

CURRENT SESSION DYNAMICS:`;

    // Add session history
    if (context.sessionHistory.length > 0) {
      prompt += `\nRECENT CONVERSATION:`;
      context.sessionHistory.slice(-6).forEach(msg => {
        const speaker = msg.speakerType === 'therapist' ? 'You' : `Character ${msg.speakerId}`;
        prompt += `\n${speaker}: ${msg.message}`;
      });
    }

    // Add group dynamics if applicable
    if (context.sessionType === 'group' && context.groupDynamics) {
      prompt += `\nGROUP DYNAMICS:\n${context.groupDynamics.join('\n')}`;
    }

    // Add therapy context if available
    if (context.therapyContext) {
      const tc = context.therapyContext;
      prompt += `\nCONTEXT: Living in ${tc.housingTier}, team chemistry ${tc.teamChemistry}%, ${tc.activeConflicts.length} active conflicts`;
    }

    prompt += `

INTERVENTION GOALS:`;
    
    if (context.interventionType === 'question') {
      prompt += `
- Ask a probing question that advances the therapy
- Guide toward deeper self-reflection
- Address patterns you're observing
- Help process current conflicts and relationships`;
    } else {
      prompt += `
- Make a therapeutic observation or interpretation
- Provide guidance or reframe the situation
- Challenge unhelpful patterns gently
- Offer insights based on what you're hearing`;
    }

    prompt += `

RESPONSE GUIDELINES:
1. Use your established therapeutic voice and approach
2. Reference specific things said in recent conversation
3. Adjust intervention based on ${context.sessionStage} stage
4. Keep response 2-4 sentences, professional but warm
5. Move the therapy forward meaningfully
6. Stay in character as ${context.therapistId}

GENERATE ${context.interventionType.toUpperCase()}: What is your next therapeutic intervention?`;

    return prompt;
  }

  /**
   * Generate therapist prompt for initial setup
   */
  static generateTherapistPrompt(context: TherapyPromptContext): string {
    const therapist = this.THERAPIST_CORE_TEMPLATES[context.therapistId as keyof typeof this.THERAPIST_CORE_TEMPLATES];
    
    if (!therapist) return 'Therapist context unavailable';

    let prompt = `${therapist.identity}

${therapist.approach}

SPEECH STYLE: ${therapist.speechStyle}

SPECIALTIES: ${therapist.specialties}

SESSION SETUP:
- Session Type: ${context.sessionType}
- Session Stage: ${context.sessionStage}`;

    if (context.therapyContext) {
      const tc = context.therapyContext;
      prompt += `
- Living Situation: ${tc.housingTier} (${tc.currentOccupancy}/${tc.roomCapacity})
- Team Chemistry: ${tc.teamChemistry}%
- League Ranking: #${tc.leagueRanking}
- Active Conflicts: ${tc.activeConflicts.length}`;
    }

    if (context.isOpeningQuestion) {
      prompt += `

Your goal is to create an engaging, therapeutically appropriate opening question that:
1. Uses your unique therapeutic voice and approach
2. References the specific living/team situation
3. Sets the tone for a ${context.sessionStage} stage session
4. Feels authentic to your character as a therapist`;
    }

    return prompt;
  }
}