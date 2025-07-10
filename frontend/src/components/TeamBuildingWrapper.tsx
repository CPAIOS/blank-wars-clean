'use client';

import { useState } from 'react';
import { Users, Calendar, MapPin, Trophy, Heart, Clock, Coffee, Music } from 'lucide-react';
import { createDemoCharacterCollection } from '@/data/characters';

interface TeamEvent {
  id: string;
  title: string;
  type: 'dinner' | 'retreat' | 'activity' | 'celebration';
  description: string;
  duration: string;
  participants: number;
  mood: 'casual' | 'formal' | 'fun' | 'competitive';
  icon: any;
  color: string;
}

const teamEvents: TeamEvent[] = [
  {
    id: 'team-dinner',
    title: 'Team Dinner',
    type: 'dinner',
    description: 'Casual dining experience to build rapport and discuss non-battle topics',
    duration: '2 hours',
    participants: 8,
    mood: 'casual',
    icon: Coffee,
    color: 'orange'
  },
  {
    id: 'weekend-retreat',
    title: 'Weekend Retreat',
    type: 'retreat',
    description: 'Multi-day bonding experience with workshops and recreational activities',
    duration: '2-3 days',
    participants: 12,
    mood: 'casual',
    icon: MapPin,
    color: 'green'
  },
  {
    id: 'victory-celebration',
    title: 'Victory Celebration',
    type: 'celebration',
    description: 'Celebrate recent wins and milestones with the entire team',
    duration: '3 hours',
    participants: 15,
    mood: 'fun',
    icon: Trophy,
    color: 'yellow'
  },
  {
    id: 'team-building-games',
    title: 'Team Building Games',
    type: 'activity',
    description: 'Structured activities designed to improve communication and trust',
    duration: '4 hours',
    participants: 10,
    mood: 'competitive',
    icon: Users,
    color: 'blue'
  },
  {
    id: 'karaoke-night',
    title: 'Karaoke Night',
    type: 'activity',
    description: 'Fun musical evening to let loose and see different sides of teammates',
    duration: '2 hours',
    participants: 12,
    mood: 'fun',
    icon: Music,
    color: 'purple'
  }
];

export default function TeamBuildingWrapper() {
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);
  const [plannedEvents, setPlannedEvents] = useState<TeamEvent[]>([]);
  const characters = createDemoCharacterCollection();

  const handlePlanEvent = (event: TeamEvent) => {
    setPlannedEvents(prev => [...prev, { ...event, id: `${event.id}-${Date.now()}` }]);
    setSelectedEvent(null);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      orange: 'border-orange-500/50 bg-orange-600/20 text-orange-400',
      green: 'border-green-500/50 bg-green-600/20 text-green-400',
      yellow: 'border-yellow-500/50 bg-yellow-600/20 text-yellow-400',
      blue: 'border-blue-500/50 bg-blue-600/20 text-blue-400',
      purple: 'border-purple-500/50 bg-purple-600/20 text-purple-400'
    };
    return colorMap[color] || 'border-gray-500/50 bg-gray-600/20 text-gray-400';
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Team Building Activities
          </h1>
          <p className="text-gray-300">
            Organize dinners, retreats, and activities to strengthen team bonds and morale
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Events */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Available Activities</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {teamEvents.map((event) => {
                const IconComponent = event.icon;
                return (
                  <div
                    key={event.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:bg-opacity-30 ${getColorClasses(event.color)}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <IconComponent className="w-6 h-6 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <p className="text-sm text-gray-400 capitalize">{event.type} • {event.mood}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3">{event.description}</p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.participants} people
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Planned Events */}
            {plannedEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Scheduled Events</h2>
                <div className="space-y-3">
                  {plannedEvents.map((event, index) => {
                    const IconComponent = event.icon;
                    return (
                      <div key={event.id} className="bg-black/40 border border-green-500/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5 text-green-400" />
                            <div>
                              <h3 className="font-semibold text-white">{event.title}</h3>
                              <p className="text-sm text-gray-400">Scheduled for this week</p>
                            </div>
                          </div>
                          <div className="text-green-400 text-sm font-semibold">Planned</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Event Details Sidebar */}
          <div className="bg-black/40 rounded-lg p-4 h-fit">
            {selectedEvent ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <selectedEvent.icon className={`w-8 h-8 ${getColorClasses(selectedEvent.color).split(' ')[2]}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedEvent.title}</h3>
                    <p className="text-sm text-gray-400 capitalize">{selectedEvent.type}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-gray-300">{selectedEvent.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Duration</div>
                      <div className="text-white font-semibold">{selectedEvent.duration}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Participants</div>
                      <div className="text-white font-semibold">{selectedEvent.participants}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Mood</div>
                      <div className="text-white font-semibold capitalize">{selectedEvent.mood}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Type</div>
                      <div className="text-white font-semibold capitalize">{selectedEvent.type}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handlePlanEvent(selectedEvent)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    Schedule Event
                  </button>
                  
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    Close Details
                  </button>
                </div>

                {/* Team Readiness */}
                <div className="mt-6 pt-4 border-t border-gray-600">
                  <h4 className="text-sm font-semibold text-white mb-3">Team Readiness</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Morale</span>
                      <span className="text-green-400 font-semibold">High</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Availability</span>
                      <span className="text-yellow-400 font-semibold">Good</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Interest Level</span>
                      <span className="text-green-400 font-semibold">High</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Team Building Hub</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Select an activity to view details and schedule team events
                </p>
                
                <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3">
                  <div className="text-blue-400 text-sm font-semibold mb-1">Current Team Status</div>
                  <div className="text-xs text-gray-400">
                    <div>Team Size: {characters.length}</div>
                    <div>Morale: High</div>
                    <div>Recent Events: {plannedEvents.length}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}