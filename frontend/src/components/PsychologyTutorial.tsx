'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Heart, Users, Target, AlertTriangle, CheckCircle,
  ArrowRight, ArrowLeft, Play, Pause, RotateCcw, Eye,
  MessageCircle, Clock, Activity, Zap, Shield, Book,
  Lightbulb, Star, Award, TrendingUp, TrendingDown
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  objective: string;
  psychologyFocus: string;
  scenario: string;
  choices: TutorialChoice[];
  correctChoice: number;
  explanation: string;
  tips: string[];
}

interface TutorialChoice {
  text: string;
  outcome: string;
  psychologyImpact: 'positive' | 'negative' | 'neutral';
  reasoning: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'intro-psychology',
    title: 'Understanding AI Psychology',
    description: 'Learn the fundamental concepts of managing AI personalities with authentic psychological needs.',
    objective: 'Recognize the importance of psychology in _____ WARS',
    psychologyFocus: 'Basic Psychology Recognition',
    scenario: 'Achilles stands before you, his eyes burning with barely contained rage. His psychological profile shows: High Pride, Anger Management Issues, Loyalty to Friends. How do you approach him?',
    choices: [
      {
        text: 'Command him directly to attack the enemy',
        outcome: 'Achilles becomes angry and refuses, attacking a teammate instead',
        psychologyImpact: 'negative',
        reasoning: 'Direct commands trigger his pride and anger issues'
      },
      {
        text: 'Appeal to his honor and the safety of his companions',
        outcome: 'Achilles nods with respect and follows your guidance',
        psychologyImpact: 'positive',
        reasoning: 'This approach acknowledges his pride while triggering his loyalty'
      },
      {
        text: 'Ignore his psychological state and focus on tactics',
        outcome: 'Achilles becomes unpredictable and may go rogue',
        psychologyImpact: 'negative',
        reasoning: 'Ignoring psychology leads to uncontrolled behavior'
      }
    ],
    correctChoice: 1,
    explanation: 'In _____ WARS, every character has authentic psychological needs. Achilles responds to honor and loyalty, not force. Understanding psychology is the key to victory.',
    tips: [
      'Always read character psychology profiles before battle',
      'Match your coaching style to each character\'s personality',
      'Psychology affects battle performance more than raw stats'
    ]
  },
  {
    id: 'morale-management',
    title: 'Managing Team Morale',
    description: 'Learn how individual psychology affects team dynamics and battle outcomes.',
    objective: 'Successfully manage declining team morale',
    psychologyFocus: 'Morale and Team Dynamics',
    scenario: 'Your team\'s morale is dropping rapidly. Achilles is frustrated, Holmes is becoming obsessive, and team chemistry is failing. What\'s your priority?',
    choices: [
      {
        text: 'Focus all attention on the strongest character (Achilles)',
        outcome: 'Other characters feel neglected, morale drops further',
        psychologyImpact: 'negative',
        reasoning: 'Neglecting team members creates jealousy and resentment'
      },
      {
        text: 'Address the team as a whole with a motivational speech',
        outcome: 'Modest improvement, but individual issues remain unresolved',
        psychologyImpact: 'neutral',
        reasoning: 'Generic approaches don\'t address specific psychological needs'
      },
      {
        text: 'Identify and address each character\'s specific psychological needs',
        outcome: 'Targeted coaching restores individual confidence and team unity',
        psychologyImpact: 'positive',
        reasoning: 'Personalized psychology management is most effective'
      }
    ],
    correctChoice: 2,
    explanation: 'Each character requires personalized psychological attention. Group solutions rarely work with complex personalities like legendary figures.',
    tips: [
      'Monitor individual morale as closely as team morale',
      'Different personality types need different motivation approaches',
      'Addressing root psychological causes prevents recurring issues'
    ]
  },
  {
    id: 'coaching-timing',
    title: 'Timing Your Interventions',
    description: 'Master the critical skill of when to intervene with coaching during battle.',
    objective: 'Learn optimal timing for psychological interventions',
    psychologyFocus: 'Intervention Timing and Crisis Management',
    scenario: 'Mid-battle, you notice Achilles\' rage meter climbing toward the danger zone. His next turn is coming up. When do you coach him?',
    choices: [
      {
        text: 'Wait until his rage peaks - maximum psychological impact',
        outcome: 'Too late! Achilles goes berserk and attacks teammates',
        psychologyImpact: 'negative',
        reasoning: 'Waiting for crisis makes intervention much harder'
      },
      {
        text: 'Intervene now while he\'s still responsive',
        outcome: 'Perfect timing! Achilles calms down and channels rage productively',
        psychologyImpact: 'positive',
        reasoning: 'Early intervention prevents psychological crisis'
      },
      {
        text: 'Coach him before his rage even starts building',
        outcome: 'Achilles dismisses your advice as unnecessary',
        psychologyImpact: 'neutral',
        reasoning: 'Too early - he doesn\'t see the need for help yet'
      }
    ],
    correctChoice: 1,
    explanation: 'Timing is crucial in psychology management. Intervene when characters are stressed but still receptive, not after they\'ve lost control.',
    tips: [
      'Watch for early warning signs in character behavior',
      'Preventive coaching is more effective than crisis management',
      'Each character has different tolerance levels for stress'
    ]
  },
  {
    id: 'relationship-dynamics',
    title: 'Managing Character Relationships',
    description: 'Understand how character relationships affect psychology and battle performance.',
    objective: 'Navigate complex interpersonal dynamics',
    psychologyFocus: 'Relationship Psychology and Conflict Resolution',
    scenario: 'Holmes and Dracula are in your team. Holmes distrusts Dracula\'s manipulative nature, while Dracula finds Holmes\' logic boring. Tension is rising. What do you do?',
    choices: [
      {
        text: 'Keep them separated and avoid putting them together',
        outcome: 'Miss out on powerful combination abilities, limit team potential',
        psychologyImpact: 'neutral',
        reasoning: 'Safe but doesn\'t address underlying issues or maximize potential'
      },
      {
        text: 'Force them to work together regardless of their issues',
        outcome: 'Conflict escalates, both characters become unreliable',
        psychologyImpact: 'negative',
        reasoning: 'Forced cooperation without addressing psychology creates hostility'
      },
      {
        text: 'Mediate their differences and find common ground',
        outcome: 'They develop mutual respect, unlocking powerful team combinations',
        psychologyImpact: 'positive',
        reasoning: 'Understanding each other\'s psychology builds stronger bonds'
      }
    ],
    correctChoice: 2,
    explanation: 'Character relationships are key to unlocking the full potential of your team. Managing interpersonal psychology creates powerful synergies.',
    tips: [
      'Look for shared values between conflicting characters',
      'Strong relationships unlock unique combination abilities',
      'Relationship conflicts affect individual psychology and performance'
    ]
  },
  {
    id: 'crisis-management',
    title: 'Handling Psychological Crises',
    description: 'Learn to manage severe psychological breakdowns during critical battles.',
    objective: 'Successfully handle a character\'s mental breakdown',
    psychologyFocus: 'Crisis Psychology and Emergency Intervention',
    scenario: 'Achilles has just witnessed a teammate fall in battle. His trauma is triggering a complete psychological breakdown. He\'s screaming, attacking randomly, and your battle is falling apart. What\'s your emergency response?',
    choices: [
      {
        text: 'Try to snap him out of it with harsh commands',
        outcome: 'Makes the breakdown worse, Achilles becomes completely uncontrollable',
        psychologyImpact: 'negative',
        reasoning: 'Harsh methods worsen psychological trauma'
      },
      {
        text: 'Remove him from battle immediately to protect the team',
        outcome: 'Team loses a powerful member but prevents further damage',
        psychologyImpact: 'neutral',
        reasoning: 'Protective but doesn\'t address the underlying trauma'
      },
      {
        text: 'Use trauma-informed coaching to address his grief and guilt',
        outcome: 'Achilles recovers, channels grief into protective fury for remaining teammates',
        psychologyImpact: 'positive',
        reasoning: 'Addressing trauma psychology can transform breakdown into strength'
      }
    ],
    correctChoice: 2,
    explanation: 'Psychological crises are opportunities for growth when handled with proper understanding. Trauma-informed approaches can turn breakdowns into breakthroughs.',
    tips: [
      'Never ignore or dismiss psychological trauma',
      'Crisis intervention requires specialized psychology knowledge',
      'Properly handled crises can strengthen character psychology long-term'
    ]
  }
];

export default function PsychologyTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [stepScores, setStepScores] = useState<boolean[]>([]);

  const currentTutorialStep = tutorialSteps[currentStep];

  const handleChoiceSelect = (choiceIndex: number) => {
    setSelectedChoice(choiceIndex);
    setShowResult(true);
    
    const isCorrect = choiceIndex === currentTutorialStep.correctChoice;
    const newStepScores = [...stepScores];
    newStepScores[currentStep] = isCorrect;
    setStepScores(newStepScores);
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedChoice(null);
      setShowResult(false);
      setShowExplanation(false);
    } else {
      setTutorialComplete(true);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedChoice(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setSelectedChoice(null);
    setShowResult(false);
    setShowExplanation(false);
    setTutorialComplete(false);
    setScore(0);
    setStepScores([]);
  };

  const getChoiceColor = (choiceIndex: number) => {
    if (!showResult) return 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600';
    
    if (choiceIndex === currentTutorialStep.correctChoice) {
      return 'bg-green-900/50 border-green-400 text-green-300';
    } else if (choiceIndex === selectedChoice) {
      return 'bg-red-900/50 border-red-400 text-red-300';
    } else {
      return 'bg-gray-700/30 border-gray-600 opacity-60';
    }
  };

  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'neutral':
        return <Activity className="w-5 h-5 text-yellow-400" />;
    }
  };

  if (tutorialComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 flex items-center justify-center">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-gradient-to-br from-gold/20 to-yellow-600/20 rounded-xl p-8 border border-gold/50">
            <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-gold" />
            </div>
            <h1 className="text-4xl font-bold text-gold mb-4">Tutorial Complete!</h1>
            <p className="text-xl text-gray-300 mb-6">
              You&apos;ve mastered the basics of psychology management in _____ WARS
            </p>
            
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Your Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{score}</div>
                  <div className="text-gray-400">Correct Answers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{Math.round((score / tutorialSteps.length) * 100)}%</div>
                  <div className="text-gray-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{tutorialSteps.length}</div>
                  <div className="text-gray-400">Scenarios Completed</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {tutorialSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    {stepScores[index] ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={stepScores[index] ? 'text-green-300' : 'text-red-300'}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restartTutorial}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Retry Tutorial
              </button>
              <button
                onClick={() => window.location.href = '/campaign'}
                className="bg-gold hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Campaign
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Psychology Management Tutorial
          </motion.h1>
          <div className="flex items-center justify-center gap-4 text-gray-300">
            <Brain className="w-5 h-5 text-pink-400" />
            <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
            <span>•</span>
            <span>Score: {score}/{currentStep + (showResult ? 1 : 0)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
          <div 
            className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + (showResult ? 1 : 0)) / tutorialSteps.length) * 100}%` }}
          />
        </div>

        {/* Current Step */}
        <motion.div
          key={currentStep}
          className="bg-gray-800/50 rounded-xl p-8 border border-purple-500/30 mb-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{currentTutorialStep.title}</h2>
            <p className="text-gray-300 mb-4">{currentTutorialStep.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-green-300">Objective: {currentTutorialStep.objective}</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-pink-400" />
                <span className="text-pink-300">Focus: {currentTutorialStep.psychologyFocus}</span>
              </div>
            </div>
          </div>

          {/* Scenario */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 mb-6 border border-blue-400/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-400" />
              Scenario
            </h3>
            <p className="text-gray-200 leading-relaxed">{currentTutorialStep.scenario}</p>
          </div>

          {/* Choices */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              Your Response
            </h3>
            {currentTutorialStep.choices.map((choice, index) => (
              <motion.button
                key={index}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getChoiceColor(index)}`}
                onClick={() => !showResult && handleChoiceSelect(index)}
                disabled={showResult}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium mb-2">{choice.text}</p>
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 pt-2 border-t border-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          {getImpactIcon(choice.psychologyImpact)}
                          <span className="text-sm font-medium">Outcome:</span>
                        </div>
                        <p className="text-sm text-gray-300">{choice.outcome}</p>
                        <p className="text-sm text-gray-400 italic">{choice.reasoning}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Explanation */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-6 border border-green-400/30"
            >
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Explanation
              </h3>
              <p className="text-gray-200 mb-4">{currentTutorialStep.explanation}</p>
              
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showExplanation ? 'Hide' : 'Show'} Tips
              </button>
              
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-2"
                  >
                    {currentTutorialStep.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{tip}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {showResult && (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Complete Tutorial' : 'Next Step'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}