import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock all dependencies first
jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
      subscription_tier: 'free',
      level: 5,
      experience: 500,
      total_battles: 10,
      total_wins: 5,
      rating: 1200,
    },
    isAuthenticated: true,
    isLoading: false,
    tokens: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
  })
}))

// Mock audio service
jest.mock('@/services/audioService', () => ({
  audioService: {
    getInstance: () => ({
      playSound: jest.fn(),
      setMasterVolume: jest.fn(),
    })
  }
}))

// Mock all the complex child components
jest.mock('../CharacterCollection', () => ({
  __esModule: true,
  default: function CharacterCollection() {
    return <div data-testid="character-collection">Character Collection Component</div>
  }
}))

jest.mock('../ImprovedBattleArena', () => ({
  __esModule: true,
  default: function ImprovedBattleArena() {
    return <div data-testid="battle-arena">Battle Arena Component</div>
  }
}))

jest.mock('../TeamBuilder', () => ({
  __esModule: true,
  default: function TeamBuilder() {
    return <div data-testid="team-builder">Team Builder Component</div>
  }
}))

jest.mock('../CampaignProgression', () => ({
  __esModule: true,
  default: function CampaignProgression() {
    return <div data-testid="campaign">Campaign Component</div>
  }
}))

jest.mock('../UserProfile', () => ({
  __esModule: true,
  default: function UserProfile() {
    return <div data-testid="user-profile">User Profile Component</div>
  }
}))

// Mock framer-motion with proper prop filtering
jest.mock('framer-motion', () => {
  const filterMotionProps = (props: any) => {
    const {
      initial, animate, exit, variants, transition, whileHover, whileTap,
      whileInView, whileFocus, whileDrag, drag, dragConstraints, dragElastic,
      dragMomentum, onDragStart, onDragEnd, onDrag, layout, layoutId,
      ...filteredProps
    } = props;
    return filteredProps;
  };

  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => 
        React.createElement('div', { ...filterMotionProps(props), ref }, children)
      ),
      button: React.forwardRef(({ children, ...props }: any, ref: any) => 
        React.createElement('button', { ...filterMotionProps(props), ref }, children)
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
})

import MainTabSystem from '../MainTabSystem'

describe('MainTabSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render main tab system', () => {
    render(<MainTabSystem />)
    // Check that main tabs are rendered
    expect(screen.getByText('Characters')).toBeInTheDocument()
    expect(screen.getByText('Training')).toBeInTheDocument()
    expect(screen.getByText('Battle')).toBeInTheDocument()
  })

  it('should display active tab styling', () => {
    render(<MainTabSystem />)
    // The Characters tab should be active by default (blue background)
    const charactersTab = screen.getByText('Characters').closest('button')
    expect(charactersTab).toHaveClass('bg-blue-600', 'text-white')
  })

  it('should switch tabs when clicked', async () => {
    render(<MainTabSystem />)
    
    // Click on Training tab
    const trainingTab = screen.getByText('Training')
    fireEvent.click(trainingTab)
    
    // Training tab should become active
    await waitFor(() => {
      expect(trainingTab.closest('button')).toHaveClass('bg-green-600', 'text-white')
    })
  })

  it.skip('should highlight active tab', async () => {
    // Skip visual state tests for now  
  })

  it.skip('should display user information', () => {
    // Skip for now
  })

  it.skip('should show experience progress', () => {
    // Skip for now
  })

  it.skip('should handle keyboard navigation', async () => {
    // Skip for now
  })

  it.skip('should render with loading state when auth is loading', () => {
    // Skip for now
  })
})