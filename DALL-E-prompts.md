# DALL-E Prompts for Blank Wars HQ Bed Graphics

This file contains prompts for generating bed graphics to be used in the HQ bed system.

## 🛏️ Bed Graphics Prompts

### 1. Single Bed
```
Top-down isometric view of a simple single bed with wooden frame, white mattress and pillow, suitable for cramped apartment bedroom, clean minimal pixel art style, no background, 64x64 resolution optimized
```

### 2. Bunk Bed
```
Top-down isometric view of metal bunk bed with ladder, two mattresses stacked, silver/gray frame, white bedding, minimal apartment style, clean pixel art, no background, 64x64 resolution
```

### 3. Couch
```
Top-down isometric view of small apartment couch/sofa, dark fabric, suitable for sleeping, cramped living space furniture, minimal pixel art style, no background, 64x64 resolution
```

### 4. Air Mattress
```
Top-down isometric view of inflated air mattress on floor, blue/gray color, slightly deflated edges showing temporary nature, minimal pixel art style, no background, 64x64 resolution
```

### 5. Floor Sleeping Area
```
Top-down isometric view of bare floor area with thin blanket, pillow on hard surface, sparse sleeping arrangement, minimal pixel art style, showing discomfort, no background, 64x64 resolution
```

## 📝 Usage Notes

- All prompts are optimized for 64x64 pixel resolution
- Designed for top-down isometric view to match game UI
- No background specified for easy integration
- Minimal pixel art style for consistency with game aesthetic

## 🔧 Implementation

Once generated, these graphics can be integrated into the `BedComponent.tsx` file located at:
`/frontend/src/components/BedComponent.tsx`

The component currently uses Lucide React icons but can be easily updated to use the generated bed graphics.

## 🎨 Comfort Level Visual Guide

The bed graphics should visually represent comfort levels:
- **Single Bed**: High quality, inviting (+15 comfort)
- **Bunk Bed**: Decent quality, functional (+10 comfort) 
- **Couch**: Makeshift sleeping, acceptable (+5 comfort)
- **Air Mattress**: Temporary, minimal (+2 comfort)
- **Floor**: Harsh conditions, uncomfortable (-10 comfort)