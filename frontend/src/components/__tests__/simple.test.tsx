import React from 'react'
import { render, screen } from '@testing-library/react'

// Simple component to test basic React testing setup
function SimpleComponent() {
  return (
    <div>
      <h1>Hello World</h1>
      <button>Click me</button>
    </div>
  )
}

describe('Simple Component Tests', () => {
  it('should render hello world', () => {
    render(<SimpleComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should have accessible button', () => {
    render(<SimpleComponent />)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })
})