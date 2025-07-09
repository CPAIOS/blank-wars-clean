import { TutorialStep } from '../hooks/useTutorial';

export const teamHeadquartersTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'HOSTMASTER v8.72 - INITIALIZATION COMPLETE',
    content: 'Greetings, Coach! I am HOSTMASTER v8.72, your AI guide to the Blank Wars tournament. Legendary fighters from across spacetime have been recruited to compete under your guidance. Your mission: train these diverse warriors, manage their team dynamics, and lead them to victory in battle.',
    position: 'center',
    actionRequired: 'none',
    nextButtonText: 'ACKNOWLEDGED'
  },
  {
    id: 'team-dashboard',
    title: 'TEAM ANALYTICS: Fighter Status',
    content: 'Analyzing your team\'s psychological states... WARNING: Stress levels at 94.3% due to overcrowded living conditions. Unhappy fighters have reduced morale and perform poorly in battles. As their coach, immediate intervention is recommended.',
    targetSelector: '[data-tutorial="team-dashboard"]',
    highlightElements: ['[data-tutorial="team-dashboard"]'],
    position: 'bottom',
    actionRequired: 'none',
    nextButtonText: 'UNDERSTOOD'
  },
  {
    id: 'character-pool',
    title: 'TEAM ROSTER: Available Fighters',
    content: 'Accessing your fighter roster... You can relocate team members between quarters to minimize personality conflicts and optimize team chemistry. Note: The documentary crew captures all interactions for the show.',
    targetSelector: '[data-tutorial="character-pool-button"]',
    highlightElements: ['[data-tutorial="character-pool-button"]'],
    position: 'bottom',
    actionRequired: 'click',
    nextButtonText: 'PROCEED'
  },
  {
    id: 'drag-character',
    title: 'DRAMA OPTIMIZATION: Manual Override',
    content: 'Initiating drag-and-drop interface... Relocate fighters strategically - some personality combinations work better than others for team performance. Use × function to return fighters to the available pool. The cameras capture everything.',
    targetSelector: '[data-tutorial="room-grid"]',
    highlightElements: ['[data-tutorial="room-grid"]'],
    position: 'top',
    actionRequired: 'drag',
    nextButtonText: 'EXECUTING'
  },
  {
    id: 'character-happiness',
    title: 'EMOTIONAL STATE TRACKER: Real-time Monitoring',
    content: 'Reading team morale... Each fighter displays their current mood via emoji indicators (😫😒😐😊🤩). Happy fighters perform 34% better in combat and create stronger team bonds. Hover for detailed psychological analysis.',
    targetSelector: '[data-tutorial="character-avatar"]:first-child',
    highlightElements: ['[data-tutorial="character-avatar"]'],
    position: 'right',
    actionRequired: 'none',
    nextButtonText: 'LOGGED'
  },
  {
    id: 'kitchen-chat',
    title: 'KITCHEN TABLE: Team Bonding',
    content: 'Accessing team common area... This is where your fighters bond, argue, and build relationships that affect their battle performance. Watch them interact naturally - these moments often reveal team dynamics that impact combat effectiveness.',
    targetSelector: '[data-tutorial="kitchen-chat-tab"]',
    highlightElements: ['[data-tutorial="kitchen-chat-tab"]'],
    position: 'bottom',
    actionRequired: 'click',
    nextButtonText: 'ACCESSING'
  },
  {
    id: 'upgrade-shop',
    title: 'FACILITIES: Training Equipment',
    content: 'Processing tournament earnings... Combat victories generate prize money for facility upgrades. Enhanced quarters increase fighter satisfaction by 23-47% and provide training bonuses. Better facilities improve team performance and morale.',
    targetSelector: '[data-tutorial="upgrade-tab"]',
    highlightElements: ['[data-tutorial="upgrade-tab"]'],
    position: 'bottom',
    actionRequired: 'none',
    nextButtonText: 'TUTORIAL COMPLETE'
  }
];

export const getTutorialStepsForComponent = (componentName: string): TutorialStep[] => {
  switch (componentName) {
    case 'team-headquarters':
      return teamHeadquartersTutorialSteps;
    default:
      return [];
  }
};