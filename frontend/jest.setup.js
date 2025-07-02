// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock localStorage with proper jest spy functions
global.Storage.prototype.getItem = jest.fn()
global.Storage.prototype.setItem = jest.fn()
global.Storage.prototype.removeItem = jest.fn()
global.Storage.prototype.clear = jest.fn()

// Mock Web Audio API
global.AudioContext = jest.fn(() => ({
  createGain: jest.fn(() => ({
    gain: { value: 0 },
    connect: jest.fn(),
  })),
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  destination: {},
}))

global.webkitAudioContext = global.AudioContext

// Mock scrollTo
global.scrollTo = jest.fn()

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})