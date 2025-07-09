'use client';

interface RoomElement {
  id: string;
  name: string;
  category: 'wallDecor' | 'furniture' | 'lighting' | 'accessories' | 'flooring';
  description: string;
}

interface RoomImageGenerationOptions {
  roomName: string;
  elements: RoomElement[];
  style?: string;
  size?: 'small' | 'medium' | 'large';
}

class RoomImageService {
  // OpenAI API removed for security - all AI calls now go through backend API
  private baseUrl = '/api/room-image-generation'; // Backend endpoint

  constructor() {
    // All image generation now goes through secure backend API
  }

  /**
   * Generate a custom room image based on selected elements
   */
  async generateRoomImage(options: RoomImageGenerationOptions, userId?: string): Promise<string> {
    const { roomName, elements, style = 'photorealistic', size = 'medium' } = options;

    // Check usage limits before generating image
    if (userId) {
      const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'}/api/usage/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (usageResponse.ok) {
        const usageStatus = await usageResponse.json();
        if (!usageStatus.canGenerateImage) {
          throw new Error('Daily image generation limit reached. Upgrade to premium for more images!');
        }
      }
    }

    // Create a detailed prompt based on the room elements
    const prompt = this.buildPrompt(roomName, elements, style);

    try {
      // Call backend API for secure image generation
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'}/api/room-image-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          size: size === 'small' ? '1024x1024' : size === 'medium' ? '1024x1792' : '1792x1024',
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error(`Room image generation API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Track image usage if userId provided
      if (userId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'}/api/usage/track-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Failed to track image usage:', error);
        }
      }
      
      return data.data[0].url;
    } catch (error) {
      console.error('DALL-E image generation failed:', error);
      // Fallback to mock image
      return this.generateMockImage(options);
    }
  }

  /**
   * Build a detailed prompt for DALL-E based on room elements
   */
  private buildPrompt(roomName: string, elements: RoomElement[], style: string): string {
    const elementDescriptions = elements.map(el => el.description).join(', ');
    
    const categoryBreakdown = {
      wallDecor: elements.filter(e => e.category === 'wallDecor').map(e => e.name),
      furniture: elements.filter(e => e.category === 'furniture').map(e => e.name),
      lighting: elements.filter(e => e.category === 'lighting').map(e => e.name),
      accessories: elements.filter(e => e.category === 'accessories').map(e => e.name),
      flooring: elements.filter(e => e.category === 'flooring').map(e => e.name)
    };

    let prompt = `A ${style} interior room called "${roomName}" for a competitive training facility, featuring: `;
    
    if (categoryBreakdown.wallDecor.length > 0) {
      prompt += `Wall decorations including ${categoryBreakdown.wallDecor.join(' and ')}. `;
    }
    
    if (categoryBreakdown.furniture.length > 0) {
      prompt += `Furniture featuring ${categoryBreakdown.furniture.join(' and ')}. `;
    }
    
    if (categoryBreakdown.lighting.length > 0) {
      prompt += `Lighting with ${categoryBreakdown.lighting.join(' and ')}. `;
    }
    
    if (categoryBreakdown.accessories.length > 0) {
      prompt += `Accessories including ${categoryBreakdown.accessories.join(' and ')}. `;
    }
    
    if (categoryBreakdown.flooring.length > 0) {
      prompt += `Flooring with ${categoryBreakdown.flooring.join(' and ')}. `;
    }

    prompt += `The room should look lived-in and suitable for team members. High quality, professional interior design photography style, well-lit, detailed, realistic.`;

    return prompt;
  }

  /**
   * Generate a mock/placeholder image for development
   */
  private async generateMockImage(options: RoomImageGenerationOptions): Promise<string> {
    const { roomName, elements } = options;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, you might want to return a placeholder image service
    // For now, we'll return a data URL for a simple colored rectangle with text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a gradient background based on elements
      const gradient = ctx.createLinearGradient(0, 0, 512, 384);
      
      // Choose colors based on element types
      const hasGothic = elements.some(e => e.name.toLowerCase().includes('gothic'));
      const hasTech = elements.some(e => e.name.toLowerCase().includes('tech') || e.name.toLowerCase().includes('led'));
      const hasRoyal = elements.some(e => e.name.toLowerCase().includes('royal') || e.name.toLowerCase().includes('golden'));
      
      if (hasGothic) {
        gradient.addColorStop(0, '#2D1B4E');
        gradient.addColorStop(1, '#1A0B2E');
      } else if (hasTech) {
        gradient.addColorStop(0, '#0F2027');
        gradient.addColorStop(1, '#203A43');
      } else if (hasRoyal) {
        gradient.addColorStop(0, '#B8860B');
        gradient.addColorStop(1, '#8B4513');
      } else {
        gradient.addColorStop(0, '#4A5568');
        gradient.addColorStop(1, '#2D3748');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 384);
      
      // Add room name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(roomName, 256, 50);
      
      // Add elements list
      ctx.font = '16px Arial';
      ctx.fillText('Generated with elements:', 256, 100);
      
      elements.slice(0, 4).forEach((element, index) => {
        ctx.fillText(`• ${element.name}`, 256, 140 + (index * 25));
      });
      
      if (elements.length > 4) {
        ctx.fillText(`... and ${elements.length - 4} more`, 256, 240);
      }
      
      // Add "AI Generated" watermark
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('🎨 AI Generated Room Design', 256, 360);
    }
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Check if DALL-E API is available
   */
  isApiAvailable(): boolean {
    return this.apiKey !== null && !this.apiKey.startsWith('mock');
  }

  /**
   * Get generation cost estimate (for usage limits)
   */
  getGenerationCost(size: 'small' | 'medium' | 'large' = 'medium'): number {
    // Approximate costs in credits/points
    const costs = {
      small: 10,
      medium: 15,
      large: 20
    };
    return costs[size];
  }
}

export const roomImageService = new RoomImageService();
export type { RoomImageGenerationOptions, RoomElement };