'use client';

import { Bed, Sofa } from 'lucide-react';

interface BedComponentProps {
  bed: {
    id: string;
    type: 'bed' | 'bunk_bed' | 'couch' | 'air_mattress';
    capacity: number;
    comfortBonus: number;
  };
  occupiedSlots: number; // How many characters are using this bed
  showDetails?: boolean;
}

export default function BedComponent({ bed, occupiedSlots, showDetails = false }: BedComponentProps) {
  const getBedIcon = () => {
    switch (bed.type) {
      case 'bed':
        return <Bed className="w-6 h-6 text-blue-400" />;
      case 'bunk_bed':
        return (
          <div className="relative">
            <Bed className="w-6 h-6 text-gray-400" />
            <Bed className="w-4 h-4 text-gray-400 absolute -top-1 -right-1" />
          </div>
        );
      case 'couch':
        return <Sofa className="w-6 h-6 text-orange-400" />;
      case 'air_mattress':
        return (
          <div className="w-6 h-6 bg-blue-300 rounded-lg opacity-70 flex items-center justify-center">
            <span className="text-xs text-blue-800">💨</span>
          </div>
        );
      default:
        return <Bed className="w-6 h-6 text-gray-400" />;
    }
  };

  const getBedName = () => {
    switch (bed.type) {
      case 'bed':
        return 'Single Bed';
      case 'bunk_bed':
        return 'Bunk Bed';
      case 'couch':
        return 'Couch';
      case 'air_mattress':
        return 'Air Mattress';
      default:
        return 'Unknown';
    }
  };

  const getComfortLevel = () => {
    if (bed.comfortBonus >= 15) return { text: 'Excellent', color: 'text-green-400' };
    if (bed.comfortBonus >= 10) return { text: 'Good', color: 'text-blue-400' };
    if (bed.comfortBonus >= 5) return { text: 'Fair', color: 'text-yellow-400' };
    if (bed.comfortBonus >= 0) return { text: 'Poor', color: 'text-orange-400' };
    return { text: 'Terrible', color: 'text-red-400' };
  };

  const comfort = getComfortLevel();
  const isFullyOccupied = occupiedSlots >= bed.capacity;
  const hasOverflow = occupiedSlots > bed.capacity;

  return (
    <div className={`flex flex-col items-center p-2 rounded-lg transition-all ${
      isFullyOccupied ? 'bg-gray-700/50' : 'bg-gray-800/50'
    } ${hasOverflow ? 'border border-red-500/50' : ''}`}>
      
      {/* Bed Icon */}
      <div className="relative mb-1">
        {getBedIcon()}
        
        {/* Occupancy indicator */}
        {occupiedSlots > 0 && (
          <div className={`absolute -top-1 -right-1 text-xs rounded-full w-4 h-4 flex items-center justify-center ${
            hasOverflow ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            {occupiedSlots}
          </div>
        )}
      </div>

      {/* Bed Info */}
      {showDetails && (
        <div className="text-center">
          <div className="text-xs text-gray-300 font-medium">{getBedName()}</div>
          <div className="text-xs text-gray-400">
            Sleeps {bed.capacity}
          </div>
          <div className={`text-xs ${comfort.color}`}>
            {comfort.text} (+{bed.comfortBonus})
          </div>
        </div>
      )}

      {/* Simple view */}
      {!showDetails && (
        <div className="text-xs text-gray-400 text-center">
          {bed.capacity > 1 ? `${bed.capacity} beds` : '1 bed'}
        </div>
      )}

      {/* Overflow warning */}
      {hasOverflow && (
        <div className="text-xs text-red-400 text-center mt-1">
          Overcrowded!
        </div>
      )}
    </div>
  );
}