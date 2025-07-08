     /Users/gabrielgreenstein/blank-wars-clean/frontend/src/components/tem
      p/ImprovedBattleArena_REAL.tsx)
  ⎿ 368:  const coachingSystem = useCoachingSystem({                       
    441:  const coachingRef = useRef<HTMLDivElement>(null);
    1079:    const coachingBonus = 20; // Insisting gives a bonus to adhere
    … +1 line (ctrl+r to expand)


⏺ Let me search for any functions that manipulate team chemistry or handle
  coaching workflows:

⏺ Task(Search coaching functions)
  ⎿  Done (9 tool uses · 48.0k tokens · 3m 54.0s)                          

⏺ Perfect! Now I can see the full scope of remaining coaching functions to
  extract. Let me prioritize the most important ones:

⏺ Update Todos
  ⎿  ☒ Identify remaining coaching-related functions in component          
     ☐ Extract strategy management functions (handleStrategyRecommendation, 
       handleCharacterStrategyChange, insistOnStrategy)
     ☐ Extract team chemistry functions (handleTeamChatMessage,
       conductTeamHuddle, buildTeamFromCards)
     ☐ Test deep coaching integration
     ☐ Extract coaching workflow functions (initializeCharacterStrategies,
       areAllCharacterStrategiesComplete)
     ☐ Update component to use new coaching functions

⏺ Let me start by reading the strategy management functions to understand
  their implementation:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 30 lines (ctrl+r to expand)

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 50 lines (ctrl+r to expand)

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 30 lines (ctrl+r to expand)

⏺ Let me continue reading the character strategy functions:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 50 lines (ctrl+r to expand)

⏺ Now let me read the checkForBerserk function:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 25 lines (ctrl+r to expand)

⏺ Now let me read the rest of handleTeamChatMessage:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 25 lines (ctrl+r to expand)

⏺ Perfect! Now I have a good understanding of the strategy management
  functions. Let me start adding them to the coaching hook. I'll add these
  functions to the existing useCoachingSystem.ts:

⏺ Read(src/hooks/temp/useCoachingSystem.ts)
  ⎿  Read 10 lines (ctrl+r to expand)

⏺ I need to add the strategy management functions to the coaching hook. Let
   me add them after the existing functions:

⏺ Update(src/hooks/temp/useCoachingSystem.ts)
  ⎿  Updated src/hooks/temp/useCoachingSystem.ts with 163 additions        
       288        actions.setShowCoachingModal(false);
       289      }, [state.selectedCharacterForCoaching, state.playerTeam, 
             actions]);
       290    
       291 +    // Strategy Management Functions
       292 +    const handleStrategyRecommendation = useCallback(async 
           + (type: 'attack' | 'defense' | 'special', strategy: string) => 
     {
       293 +      // Coach recommends a strategy
       294 +      actions.setCoachingMessages(prev => [...prev, `Coach: I 
           + recommend ${strategy} for ${type}!`]);
       295 +      actions.setPendingStrategy({ type, strategy });
       296 +      
       297 +      // Character may disagree based on training level
       298 +      const obedienceRoll = Math.random() * 100;
       299 +      const disagreementChance = 100 - 
           + (state.player1?.trainingLevel || 50);
       300 +      
       301 +      if (obedienceRoll < disagreementChance) {
       302 +        // Character disagrees
       303 +        actions.setShowDisagreement(true);
       304 +        const response = await getCharacterOpinion(type, 
           + strategy);
       305 +        actions.setCharacterResponse(response);
       306 +        actions.setCoachingMessages(prev => [...prev, 
           + `${state.player1?.name}: ${response}`]);
       307 +      } else {
       308 +        // Character agrees
       309 +        actions.setSelectedStrategies(prev => ({ ...prev, 
           + [type]: strategy }));
       310 +        actions.setCoachingMessages(prev => [...prev, 
           + `${state.player1?.name}: Understood, coach!`]);
       311 +        actions.setPendingStrategy(null);
       312 +      }
       313 +    }, [state.player1, actions]);
       314 +  
       315 +    const getCharacterOpinion = useCallback(async (type: 
     string,
           +  strategy: string): Promise<string> => {
       316 +      // Generate fallback response based on character 
           + personality
       317 +      const fallbackResponses = [
       318 +        `I think ${strategy} could work, but I prefer my own 
           + approach.`,
       319 +        `${strategy} for ${type}? I've got a better idea, 
           + coach.`,
       320 +        `Trust me coach, I know what I'm doing better than that 
           + ${strategy} plan.`,
       321 +        `I'll consider ${strategy}, but I might improvise based 
           + on what I see.`,
       322 +        `That ${strategy} strategy might work, but I'm feeling 
           + something different.`
       323 +      ];
       324 +      const fallback = 
           + fallbackResponses[Math.floor(Math.random() * 
           + fallbackResponses.length)];
       325 +      
       326 +      try {
       327 +        const timeoutPromise = new Promise((_, reject) => 
       328 +          timeoutManager.setTimeout(() => reject(new Error('API 
           + timeout')), 2000)
       329 +        );
       330 +          
       331 +        const response = await Promise.race([
       332 +          fetch('http://localhost:3006/api/chat', {
       333 +            method: 'POST',
       334 +            headers: { 'Content-Type': 'application/json' },
       335 +            body: JSON.stringify({
       336 +              character: state.player1?.name,
       337 +              message: `Coach wants me to use ${strategy} for 
           + ${type}. What do you think?`,
       338 +              battleContext: {
       339 +                round: state.currentRound,
       340 +                playerHealth: 
           + Math.round(((state.player1?.currentHp || 0) / 
           + (state.player1?.maxHp || 1)) * 100),
       341 +                enemyHealth: 
           + Math.round(((state.player2?.currentHp || 0) / 
           + (state.player2?.maxHp || 1)) * 100)
       342 +              }
       343 +            })
       344 +          }),
       345 +          timeoutPromise
       346 +        ]);
       347 +  
       348 +        if (response && response.ok) {
       349 +          const data = await response.json();
       350 +          return data.response;
       351 +        }
       352 +      } catch (error) {
       353 +        console.warn('Character opinion API not available, 
     using
           +  fallback');
       354 +      }
       355 +      
       356 +      return fallback;
       357 +    }, [state.player1, state.player2, state.currentRound, 
           + timeoutManager]);
       358 +  
       359 +    const insistOnStrategy = useCallback(() => {
       360 +      if (!state.pendingStrategy) return;
       361 +      
       362 +      // Coach insists - another training check
       363 +      const insistRoll = Math.random() * 100;
       364 +      const coachingBonus = 20; // Insisting gives a bonus to 
           + adherence
       365 +      const adherenceBonus = 10; // Base adherence bonus
       366 +      
       367 +      if (insistRoll < (state.player1?.trainingLevel || 50) + 
           + adherenceBonus) {
       368 +        actions.setCoachingMessages(prev => [...prev, 
       369 +          'Coach: I insist! Trust me on this!',
       370 +          `${state.player1?.name}: Fine... I'll follow your 
           + lead, coach.`
       371 +        ]);
       372 +        actions.setSelectedStrategies(prev => ({ 
       373 +          ...prev, 
       374 +          [state.pendingStrategy!.type]: 
           + state.pendingStrategy!.strategy 
       375 +        }));
       376 +        actions.setShowDisagreement(false);
       377 +        actions.setPendingStrategy(null);
       378 +      } else {
       379 +        // Character still refuses
       380 +        actions.setCoachingMessages(prev => [...prev, 
       381 +          'Coach: You must listen to me!',
       382 +          `${state.player1?.name}: No! I know what I'm doing!`
       383 +        ]);
       384 +        checkForBerserk();
       385 +      }
       386 +    }, [state.pendingStrategy, state.player1, actions]);
       387 +  
       388 +    const checkForBerserk = useCallback(() => {
       389 +      // Small chance of going berserk when refusing orders
       390 +      const berserkChance = (state.player1?.trainingLevel || 
     50)
           +  < 50 ? 10 : 2;
       391 +      const berserkRoll = Math.random() * 100;
       392 +      
       393 +      if (berserkRoll < berserkChance) {
       394 +        actions.setCoachingMessages(prev => [...prev, 
       395 +          `⚠️ ${state.player1?.name} has gone BERSERK! They're 
           + fighting on pure instinct!`
       396 +        ]);
       397 +        // Note: status effects modification would need to be 
           + handled in the component
       398 +        speak(`${state.player1?.name} has entered a berserk 
           + rage!`);
       399 +      }
       400 +    }, [state.player1, actions, speak]);
       401 +  
       402 +    const handleCharacterStrategyChange = 
           + useCallback((characterId: string, category: 'attack' | 
           + 'defense' | 'special', strategy: string) => {
       403 +      actions.setCharacterStrategies(prev => {
       404 +        const newMap = new Map(prev);
       405 +        const currentStrategy = newMap.get(characterId) || {
       406 +          characterId,
       407 +          attack: null,
       408 +          defense: null,
       409 +          special: null,
       410 +          isComplete: false
       411 +        };
       412 +        
       413 +        const updatedStrategy = {
       414 +          ...currentStrategy,
       415 +          [category]: strategy
       416 +        };
       417 +        
       418 +        // Check if all categories are selected
       419 +        updatedStrategy.isComplete = !!(updatedStrategy.attack 
           + && updatedStrategy.defense && updatedStrategy.special);
       420 +        
       421 +        newMap.set(characterId, updatedStrategy);
       422 +        return newMap;
       423 +      });
       424 +    }, [actions]);
       425 +  
       426 +    const initializeCharacterStrategies = useCallback(() => {
       427 +      const newMap = new Map<string, any>();
       428 +      state.playerTeam.characters.forEach(character => {
       429 +        newMap.set(character.id, {
       430 +          characterId: character.id,
       431 +          attack: null,
       432 +          defense: null,
       433 +          special: null,
       434 +          isComplete: false
       435 +        });
       436 +      });
       437 +      actions.setCharacterStrategies(newMap);
       438 +    }, [state.playerTeam.characters, actions]);
       439 +  
       440 +    const areAllCharacterStrategiesComplete = useCallback(() => 
           + {
       441 +      return 
           + Array.from(state.characterStrategies.values()).every(strategy 
           + => strategy.isComplete);
       442 +    }, [state.characterStrategies]);
       443 +  
       444 +    const handleAllCharacterStrategiesComplete = useCallback(() 
           + => {
       445 +      if (areAllCharacterStrategiesComplete()) {
       446 +        // Timer management would need to be handled in the 
           + component or passed as an action
       447 +        // actions.setTimer(null);
       448 +        // actions.setIsTimerActive(false);
       449 +        // actions.handleTimerExpired();
       450 +        console.log('All character strategies complete');
       451 +      }
       452 +    }, [areAllCharacterStrategiesComplete]);
       453 +  
       454      // Get coaching statistics
       455      const getCoachingStats = useCallback(() => {
       456        const hasActiveSession = state.activeCoachingSession !== 
             null;

⏺ Now I need to add these new functions to the return statement of the
  hook:

⏺ Update(src/hooks/temp/useCoachingSystem.ts)
  ⎿  Updated src/hooks/temp/useCoachingSystem.ts with 10 additions
       482        conductIndividualCoaching,
       483        executeCoachingSession,
       484        
       485 +      // Strategy management functions
       486 +      handleStrategyRecommendation,
       487 +      getCharacterOpinion,
       488 +      insistOnStrategy,
       489 +      checkForBerserk,
       490 +      handleCharacterStrategyChange,
       491 +      initializeCharacterStrategies,
       492 +      areAllCharacterStrategiesComplete,
       493 +      handleAllCharacterStrategiesComplete,
       494 +      
       495        // Utilities
       496        getCoachingStats,
       497        

⏺ Update Todos
  ⎿  ☒ Identify remaining coaching-related functions in component          
     ☒ Extract strategy management functions (handleStrategyRecommendation, 
       handleCharacterStrategyChange, insistOnStrategy)
     ☒ Extract coaching workflow functions (initializeCharacterStrategies, 
       areAllCharacterStrategiesComplete)
     ☐ Extract team chemistry functions (handleTeamChatMessage, 
       conductTeamHuddle, buildTeamFromCards)
     ☐ Test deep coaching integration
     ☐ Update component to use new coaching functions

⏺ Great! Now let me extract the team chemistry functions. Let me read the
  handleTeamChatMessage, conductTeamHuddle, and buildTeamFromCards
  functions:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 20 lines (ctrl+r to expand)

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 15 lines (ctrl+r to expand)

⏺ Now let me find the buildTeamFromCards function:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 20 lines (ctrl+r to expand)

⏺ Perfect! Now let me add these team chemistry functions to the coaching
  hook:

⏺ Update(src/hooks/temp/useCoachingSystem.ts)
  ⎿  Updated src/hooks/temp/useCoachingSystem.ts with 54 additions         
       451        }
       452      }, [areAllCharacterStrategiesComplete]);
       453    
       454 +    // Team Chemistry & Communication Functions
       455 +    const handleTeamChatMessage = useCallback((message: string) 
           + => {
       456 +      // Add coach message to team chat log
       457 +      actions.setCoachingMessages(prev => [...prev, `Coach: 
           + ${message}`]);
       458 +      
       459 +      // Could trigger team chemistry changes based on message 
           + tone
       460 +      // TODO: Analyze message sentiment and adjust team morale
       461 +    }, [actions]);
       462 +  
       463 +    const conductTeamHuddle = useCallback(() => {
       464 +      // Set phase and announcement
       465 +      if (actions.setPhase) 
           + actions.setPhase('pre_battle_huddle');
       466 +      if (actions.setCurrentAnnouncement) {
       467 +        actions.setCurrentAnnouncement('The teams gather for 
           + their pre-battle huddles! Team chemistry and psychology will 
     be
           +  tested!');
       468 +      }
       469 +      
       470 +      // Show team chemistry and psychology info
       471 +      const huddleMessages = [
       472 +        `Team ${state.playerTeam.name} - Coach 
           + ${state.playerTeam.coachName} is leading the huddle.`, 
       473 +        `Current Team Chemistry: 
           + ${Math.round(state.playerTeam.teamChemistry * 10) / 10}% | 
     Team
           +  Morale: ${state.playerMorale}%`,
       474 +        `Your starting lineup: 
           + ${state.playerTeam.characters.map(char => char.name).join(', 
           + ')}.`,
       475 +        `Review their strengths and weaknesses before battle.`
       476 +      ];
       477 +  
       478 +      const delay = 2000;
       479 +      huddleMessages.forEach((msg, index) => {
       480 +        const capturedMsg = msg;
       481 +        timeoutManager.setTimeout(() => {
       482 +          if (actions.setCurrentAnnouncement) 
           + actions.setCurrentAnnouncement(capturedMsg);
       483 +          speak(capturedMsg);
       484 +        }, delay * (index + 1));
       485 +      });
       486 +  
       487 +      const totalDelay = delay * huddleMessages.length + 2000;
       488 +      timeoutManager.setTimeout(() => {
       489 +        // Start strategy selection after huddle
       490 +        if (actions.startStrategySelection) 
           + actions.startStrategySelection();
       491 +      }, totalDelay);
       492 +    }, [state.playerTeam, state.playerMorale, actions, 
           + timeoutManager, speak]);
       493 +  
       494 +    const buildTeamFromCards = useCallback((playerCards: any[], 
           + selectedTeamCards: string[], setShowCardCollection: (show: 
           + boolean) => void, setSelectedTeamCards: (cards: string[]) => 
           + void) => {
       495 +      const selectedCards = playerCards.filter(card => 
           + selectedTeamCards.includes(card.id));
       496 +      if (selectedCards.length === 3) {
       497 +        const newTeam = {
       498 +          ...state.playerTeam,
       499 +          characters: selectedCards,
       500 +          teamChemistry: 50, // Will be recalculated
       501 +        };
       502 +        actions.setPlayerTeam(newTeam);
       503 +        setShowCardCollection(false);
       504 +        setSelectedTeamCards([]);
       505 +      }
       506 +    }, [state.playerTeam, actions]);
       507 +  
       508      // Get coaching statistics
       509      const getCoachingStats = useCallback(() => {
       510        const hasActiveSession = state.activeCoachingSession !== 
             null;

⏺ Now I need to add these new functions to the return statement:

⏺ Update(src/hooks/temp/useCoachingSystem.ts)
  ⎿  Updated src/hooks/temp/useCoachingSystem.ts with 5 additions
       546        areAllCharacterStrategiesComplete,
       547        handleAllCharacterStrategiesComplete,
       548        
       549 +      // Team chemistry & communication functions
       550 +      handleTeamChatMessage,
       551 +      conductTeamHuddle,
       552 +      buildTeamFromCards,
       553 +      
       554        // Utilities
       555        getCoachingStats,
       556        

⏺ Update Todos
  ⎿  ☒ Identify remaining coaching-related functions in component          
     ☒ Extract strategy management functions (handleStrategyRecommendation, 
       handleCharacterStrategyChange, insistOnStrategy)
     ☒ Extract team chemistry functions (handleTeamChatMessage, 
       conductTeamHuddle, buildTeamFromCards)
     ☒ Extract coaching workflow functions (initializeCharacterStrategies, 
       areAllCharacterStrategiesComplete)
     ☐ Update component to use new coaching functions
     ☐ Test deep coaching integration

⏺ Perfect! Now I need to update the component to use these new coaching
  functions. Let me add them to the actions object:

⏺ Update(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Updated src/components/temp/ImprovedBattleArena_REAL.tsx with 11      
     additions
       396        checkForChaos: psychologySystem.checkForChaos,
       397        conductIndividualCoaching: 
             coachingSystem.conductIndividualCoaching,
       398        executeCoachingSession: 
             coachingSystem.executeCoachingSession,
       399 +      handleStrategyRecommendation: 
           + coachingSystem.handleStrategyRecommendation,
       400 +      getCharacterOpinion: coachingSystem.getCharacterOpinion,
       401 +      insistOnStrategy: coachingSystem.insistOnStrategy,
       402 +      checkForBerserk: coachingSystem.checkForBerserk,
       403 +      handleCharacterStrategyChange: 
           + coachingSystem.handleCharacterStrategyChange,
       404 +      initializeCharacterStrategies: 
           + coachingSystem.initializeCharacterStrategies,
       405 +      areAllCharacterStrategiesComplete: 
           + coachingSystem.areAllCharacterStrategiesComplete,
       406 +      handleAllCharacterStrategiesComplete: 
           + coachingSystem.handleAllCharacterStrategiesComplete,
       407 +      handleTeamChatMessage: 
           + coachingSystem.handleTeamChatMessage,
       408 +      conductTeamHuddle: coachingSystem.conductTeamHuddle,
       409 +      buildTeamFromCards: coachingSystem.buildTeamFromCards,
       410        executeCombatRound: () => { console.log('Combat round 
             placeholder'); },
       411        calculateBattleRewards: () => { console.log('Battle 
             rewards placeholder'); },
       412        headquartersEffects

⏺ Now I need to find where these functions are called in the component and
  update them to use the actions object. Let me search for them:

⏺ Bash(grep -n "handleStrategyRecommendation\|insistOnStrategy\|handleChara
      cterStrategyChange\|initializeCharacterStrategies\|handleTeamChatMess
      age\|conductTeamHuddle\…)
  ⎿ 387:    conductTeamHuddle: () => {                                     
    399:    handleStrategyRecommendation: coachingSystem.handleStrategyReco
    mmendation,
    … +21 lines (ctrl+r to expand)


⏺ I see there's a conflict - there's a conductTeamHuddle function in the
  actions object (line 387) and also a local function definition (line
  835). Let me check the actions object function:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 10 lines (ctrl+r to expand)

⏺ I see there are two different conductTeamHuddle functions. The one in the
   actions object is simpler, and the local one (line 835) is more
  detailed. Let me replace the actions object one with the coaching system
  version and then remove the local function. But first, let me update the
  direct function calls to use the actions object:

⏺ Update(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Updated src/components/temp/ImprovedBattleArena_REAL.tsx with 4       
     additions and 4 removals
       867        announceStrategySelection();
       868        
       869        // Initialize character-specific strategies
       870 -      initializeCharacterStrategies();
       870 +      actions.initializeCharacterStrategies();
       871        
       872        setCoachingMessages(prev => [
       873          ...(currentRound === 1 ? [`Welcome, Coach! This is your 
             pre-battle strategy session. Set individual strategies for 
     each
              team member.`] : prev),
     ...
       1702              currentMatch={currentMatch}
       1703              playerTeam={playerTeam}
       1704              characterStrategies={characterStrategies}
       1705 -            onStrategyChange={handleCharacterStrategyChange}
       1705 +            
     onStrategyChange={actions.handleCharacterStrategyChange}
            + onStrategyChange={actions.handleCharacterStrategyChange}
       1706              
              
     onAllStrategiesComplete={handleAllCharacterStrategiesComplete}
       1707              coachingMessages={coachingMessages}
       1708              timeRemaining={timer || 0}
     ...
       1792                currentRound={currentRound}
       1793                currentMatch={currentMatch}
       1794                isVisible={true}
       1795 -              onSendCoachMessage={handleTeamChatMessage}
       1795 +              
     onSendCoachMessage={actions.handleTeamChatMessage}
            + onSendCoachMessage={actions.handleTeamChatMessage}
       1796              />
       1797            </div>
       1798          </div>
     ...
       1989                      Cancel
       1990                    </button>
       1991                    <button
       1992 -                    onClick={buildTeamFromCards}
       1992 +                    onClick={actions.buildTeamFromCards}
       1993                      disabled={selectedTeamCards.length !== 3}
       1994                      className={`px-6 py-2 rounded-lg 
              font-semibold transition-colors ${
       1995                        selectedTeamCards.length === 3

⏺ Now I need to replace the actions object conductTeamHuddle with the
  coaching system version:

⏺ Update(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Updated src/components/temp/ImprovedBattleArena_REAL.tsx with 1       
     addition and 8 removals
       384        announceRoundStart,
       385        announceAction,
       386        announceMessage,
       387 -      conductTeamHuddle: () => {
       388 -        setPhase('team_huddle');
       389 -        setCurrentAnnouncement('🗣️ Team captains conduct 
           - strategic huddles...');
       390 -        safeSetTimeout(() => {
       391 -          setPhase('pre_battle_huddle');
       392 -          setCurrentAnnouncement('Teams are ready! The battle 
     is
           -  about to begin!');
       393 -        }, 5000);
       394 -      },
       387 +      conductTeamHuddle: coachingSystem.conductTeamHuddle,
       388        convertToBattleCharacter,
       389        checkForChaos: psychologySystem.checkForChaos,
       390        conductIndividualCoaching: 
             coachingSystem.conductIndividualCoaching,

⏺ There's an issue with the hook - it needs some additional actions like
  setPhase and setCurrentAnnouncement. Let me update the coaching hook
  interface to include these:

⏺ Update(src/hooks/temp/useCoachingSystem.ts)
  ⎿  Updated src/hooks/temp/useCoachingSystem.ts with 3 additions          
       16        setPendingStrategy: (strategy: any) => void;
       17        setCharacterStrategies: (strategies: Map<string, any>) => 
            void;
       18        setPlayerTeam: (team: Team | ((prev: Team) => Team)) => 
            void;
       19 +      setPhase?: (phase: string) => void;
       20 +      setCurrentAnnouncement?: (announcement: string) => void;
       21 +      startStrategySelection?: () => void;
       22      };
       23      timeoutManager: {
       24        setTimeout: (cb: () => void, delay: number) => any;

⏺ Now I need to pass these actions to the coaching system hook. Let me
  check the current actions object to see which functions are available:

⏺ Bash(grep -n "setPhase\|setCurrentAnnouncement\|startStrategySelection"
      /Users/gabrielgreenstein/blank-wars-clean/frontend/src/hooks/temp/use
      BattleState.ts)
  ⎿ 422:    setPhase: useCallback((phase: BattlePhase) => dispatch({ type: 
    'SET_PHASE', payload: phase }), []),
    423:    setCurrentAnnouncement: useCallback((announcement: string) => d
    … +2 lines (ctrl+r to expand)


⏺ Great! They exist. Let me check if startStrategySelection exists:

⏺ Bash(grep -n "startStrategySelection" /Users/gabrielgreenstein/blank-wars
      -clean/frontend/src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿ 852:      startStrategySelection(); // Move to strategy selection after
     huddle
    856:  const startStrategySelection = () => {


⏺ I need to add startStrategySelection to the actions object as well. Let
  me add it:

⏺ Read(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Read 15 lines (ctrl+r to expand)

⏺ This function is quite complex and involves many state setters. For now,
  I'll add a simple version to the actions object. Let me add it:

⏺ Update(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Updated src/components/temp/ImprovedBattleArena_REAL.tsx with 1       
     addition
       400        handleTeamChatMessage: 
             coachingSystem.handleTeamChatMessage,
       401        conductTeamHuddle: coachingSystem.conductTeamHuddle,
       402        buildTeamFromCards: coachingSystem.buildTeamFromCards,
       403 +      startStrategySelection,
       404        executeCombatRound: () => { console.log('Combat round 
             placeholder'); },
       405        calculateBattleRewards: () => { console.log('Battle 
             rewards placeholder'); },
       406        headquartersEffects

⏺ Now I can remove the original function definitions from the component.
  Let me start with the strategy management functions:

⏺ Update(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Updated src/components/temp/ImprovedBattleArena_REAL.tsx with 1       
     addition and 22 removals
       1009        };
       1010      }, [player1, player2, safeSetTimeout, safeClearTimeout]);
       1011    
       1012 -    const handleStrategyRecommendation = async (type: 'attack' 
     | 'defense' | 'special', strategy: string) => {
            - | 'defense' | 'special', strategy: string) => {
       1013 -      // Coach recommends a strategy
       1014 -      setCoachingMessages(prev => [...prev, `Coach: I 
     recommend
            -  ${strategy} for ${type}!`]);
       1015 -      setPendingStrategy({ type, strategy });
       1016 -      
       1017 -      // Character may disagree based on training level
       1018 -      const obedienceRoll = Math.random() * 100;
       1019 -      const disagreementChance = 100 - player1.trainingLevel;
       1020 -      
       1021 -      if (obedienceRoll < disagreementChance) {
       1022 -        // Character disagrees
       1023 -        setShowDisagreement(true);
       1024 -        const response = await getCharacterOpinion(type, 
            - strategy);
       1025 -        setCharacterResponse(response);
       1026 -        setCoachingMessages(prev => [...prev, 
     `${player1.name}:
            -  ${response}`]);
       1027 -      } else {
       1028 -        // Character agrees
       1029 -        setSelectedStrategies(prev => ({ ...prev, [type]: 
            - strategy }));
       1030 -        setCoachingMessages(prev => [...prev, 
     `${player1.name}:
            -  Understood, coach!`]);
       1031 -        setPendingStrategy(null);
       1032 -      }
       1033 -    };
       1012 +    // handleStrategyRecommendation function moved to 
     useCoachingSystem hook
            + useCoachingSystem hook
       1013    
       1014      const getCharacterOpinion = async (type: string, strategy: 
              string): Promise<string> => {
       1015        // Generate fallback response based on character 
              personality

⏺ Let me continue removing the other functions:

⏺ Update(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Updated src/components/temp/ImprovedBattleArena_REAL.tsx with 2       
     additions and 68 removals
       1011    
       1012      // handleStrategyRecommendation function moved to 
              useCoachingSystem hook
       1013    
       1014 -    const getCharacterOpinion = async (type: string, strategy: 
     string): Promise<string> => {
            - string): Promise<string> => {
       1015 -      // Generate fallback response based on character 
            - personality
       1016 -      const fallbackResponses = [
       1017 -        `I think ${strategy} could work, but I prefer my own 
            - approach.`,
       1018 -        `${strategy} for ${type}? I've got a better idea, 
            - coach.`,
       1019 -        `Trust me coach, I know what I'm doing better than 
     that
            -  ${strategy} plan.`,
       1020 -        `I'll consider ${strategy}, but I might improvise 
     based
            -  on what I see.`,
       1021 -        `That ${strategy} strategy might work, but I'm feeling 
            - something different.`
       1022 -      ];
       1023 -      const fallback = 
            - fallbackResponses[Math.floor(Math.random() * 
            - fallbackResponses.length)];
       1024 -      
       1025 -      try {
       1026 -        const timeoutPromise = new Promise((_, reject) => 
       1027 -          safeSetTimeout(() => reject(new Error('API 
            - timeout')), 2000)
       1028 -        );
       1029 -          
       1030 -        const response = await Promise.race([
       1031 -          fetch('http://localhost:3006/api/chat', {
       1032 -            method: 'POST',
       1033 -            headers: { 'Content-Type': 'application/json' },
       1034 -            body: JSON.stringify({
       1035 -              character: player1.name,
       1036 -              message: `Coach wants me to use ${strategy} for 
            - ${type}. What do you think?`,
       1037 -              battleContext: {
       1038 -                round: currentRound,
       1039 -                playerHealth: Math.round((player1.currentHp / 
            - player1.maxHp) * 100),
       1040 -                enemyHealth: Math.round((player2.currentHp / 
            - player2.maxHp) * 100)
       1041 -              }
       1042 -            })
       1043 -          }),
       1044 -          timeoutPromise
       1045 -        ]);
       1014 +    // getCharacterOpinion function moved to useCoachingSystem 
     hook
            + hook
       1015    
       1016 -        if (response.ok) {
       1017 -          const data = await response.json();
       1018 -          return data.response;
       1019 -        }
       1020 -      } catch (error) {
       1021 -        console.warn('Character opinion API not available, 
            - using fallback');
       1022 -      }
       1023 -      
       1024 -      return fallback;
       1025 -    };
       1016 +    // insistOnStrategy function moved to useCoachingSystem 
     hook
            + hook
       1017    
       1018 -    const insistOnStrategy = () => {
       1019 -      if (!pendingStrategy) return;
       1020 -      
       1021 -      // Coach insists - another training check
       1022 -      const insistRoll = Math.random() * 100;
       1023 -      const coachingBonus = 20; // Insisting gives a bonus to 
            - adherence
       1024 -      const adherenceBonus = 10; // Base adherence bonus
       1025 -      
       1026 -      if (insistRoll < player1.trainingLevel + adherenceBonus) 
            - {
       1027 -        setCoachingMessages(prev => [...prev, 
       1028 -          'Coach: I insist! Trust me on this!',
       1029 -          `${player1.name}: Fine... I'll follow your lead, 
            - coach.`
       1030 -        ]);
       1031 -        setSelectedStrategies(prev => ({ ...prev, 
            - [pendingStrategy.type]: pendingStrategy.strategy }));
       1032 -        setShowDisagreement(false);
       1033 -        setPendingStrategy(null);
       1034 -      } else {
       1035 -        // Character still refuses
       1036 -        setCoachingMessages(prev => [...prev, 
       1037 -          'Coach: You must listen to me!',
       1038 -          `${player1.name}: No! I know what I'm doing!`
       1039 -        ]);
       1040 -        checkForBerserk();
       1041 -      }
       1042 -    };
       1043 -  
       1018      // Character-specific strategy handlers
       1019      const handleCharacterStrategyChange = (characterId: 
     string,
               category: 'attack' | 'defense' | 'special', strategy: 
     string)
               => {
       1020        setCharacterStrategies(prev => {

⏺ Let me continue removing the other functions:

⏺ Update(src/components/temp/ImprovedBattleArena_REAL.tsx)
  ⎿  Updated src/components/temp/ImprovedBattleArena_REAL.tsx with 1       
     addition and 24 removals
       1015    
       1016      // insistOnStrategy function moved to useCoachingSystem 
              hook
       1017    
       1018 -    // Character-specific strategy handlers
       1019 -    const handleCharacterStrategyChange = (characterId: 
     string,
            -  category: 'attack' | 'defense' | 'special', strategy: 
     string)
            -  => {
       1020 -      setCharacterStrategies(prev => {
       1021 -        const newMap = new Map(prev);
       1022 -        const currentStrategy = newMap.get(characterId) || {
       1023 -          characterId,
       1024 -          attack: null,
       1025 -          defense: null,
       1026 -          special: null,
       1027 -          isComplete: false
       1028 -        };
       1029 -        
       1030 -        const updatedStrategy = {
       1031 -          ...currentStrategy,
       1032 -          [category]: strategy
       1033 -        };
       1034 -        
       1035 -        // Check if all categories are selected
       1036 -        updatedStrategy.isComplete = !!(updatedStrategy.attack 
            - && updatedStrategy.defense && updatedStrategy.special);
       1037 -        
       1038 -        newMap.set(characterId, updatedStrategy);
       1039 -        return newMap;
       1040 -      });
       1041 -    };
       1018 +    // handleCharacterStrategyChange function moved to 
     useCoachingSystem hook
            + useCoachingSystem hook
       1019    
       1020      const initializeCharacterStrategies = () => {
       1021        const newMap = new Map<string, any>();
  ⎿ API Error: 500 
    {"type":"error","error":{"type":"api_error","message":"Internal server 
    error"}}

> hi, what happened?
  ⎿ API Error: 500 
    {"type":"error","error":{"type":"api_error","message":"Internal server 
    error"}}

> oh no is this session fried?
  ⎿ API Error: 500 
    {"type":"error","error":{"type":"api_error","message":"Internal server 
    error"}}

> hello
  ⎿ API Error: 500 
    {"type":"error","error":{"type":"api_error","message":"Internal server 
    error"}}

> ⎿ API Error: 500 
      {"type":"error","error":{"type":"api_error","message":"Internal 
  server 
      error"}}
  ⎿ API Error: 500 
    {"type":"error","error":{"type":"api_error","message":"Internal server 
    error"}}

> what does API Error: 500 mean?
  ⎿ API Error: 500 
    {"type":"error","error":{"type":"api_error","message":"Internal server 
    error"}}