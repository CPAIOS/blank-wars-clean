'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Star, 
  Crown, 
  Shield,
  Sword,
  Zap,
  Target,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  TrendingUp,
  Eye,
  Save,
  Play,
  RotateCcw,
  Filter,
  Search
} from 'lucide-react';
import { 
  TeamFormation,
  TeamPosition,
  TeamComposition,
  TeamSynergy,
  teamFormations,
  teamSynergies,
  calculateTeamSynergies,
  calculateTeamPower,
  getFormationRecommendations,
  validateTeamComposition
} from '@/data/teamBuilding';
import { 
  OwnedCharacter,
  characterRarityConfig
} from '@/data/userAccount';

interface TeamBuilderProps {
  characters: OwnedCharacter[];
  savedTeams?: TeamComposition[];
  onSaveTeam?: (team: TeamComposition) => void;
  onStartBattle?: (team: TeamComposition) => void;
  onDeleteTeam?: (teamId: string) => void;
}

export default function TeamBuilder({
  characters,
  savedTeams = [],
  onSaveTeam,
  onStartBattle,
  onDeleteTeam
}: TeamBuilderProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'saved'>('build');
  const [selectedFormation, setSelectedFormation] = useState<TeamFormation>(teamFormations[0]);
  const [teamMembers, setTeamMembers] = useState<{ characterId: string; position: string; isLeader: boolean }[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArchetype, setFilterArchetype] = useState<string | 'all'>('all');
  const [showTeamStats, setShowTeamStats] = useState(false);
  const [teamName, setTeamName] = useState('');

  // Calculate active synergies
  const teamMembersWithData = teamMembers.map(member => {
    const character = characters.find(c => c.characterId === member.characterId);
    return {
      characterId: member.characterId,
      archetype: character?.archetype || '',
      position: member.position,
      isLeader: member.isLeader
    };
  }).filter(member => member.archetype);

  const activeSynergies = calculateTeamSynergies(teamMembersWithData);
  
  // Calculate team power
  const teamPower = calculateTeamPower(
    teamMembersWithData.map(member => {
      const character = characters.find(c => c.characterId === member.characterId);
      return {
        level: character?.level || 1,
        baseStats: {
          atk: 50 + (character?.level || 1) * 3,
          def: 40 + (character?.level || 1) * 2,
          spd: 45 + (character?.level || 1) * 2,
          hp: 100 + (character?.level || 1) * 5
        }
      };
    }),
    selectedFormation,
    activeSynergies
  );

  // Validate current team
  const validation = validateTeamComposition(teamMembers, selectedFormation);

  // Filter available characters
  const availableCharacters = characters.filter(char => {
    const nameMatch = char.characterName.toLowerCase().includes(searchTerm.toLowerCase());
    const archetypeMatch = filterArchetype === 'all' || char.archetype === filterArchetype;
    const notInTeam = !teamMembers.some(member => member.characterId === char.characterId);
    return nameMatch && archetypeMatch && notInTeam;
  });

  // Get position requirements
  const getPositionRequirements = (positionId: string): string[] => {
    const position = selectedFormation.positions.find(p => p.id === positionId);
    if (!position?.requirements?.archetype) return [];
    return position.requirements.archetype;
  };

  // Check if character can fill position
  const canFillPosition = (character: OwnedCharacter, positionId: string): boolean => {
    const requirements = getPositionRequirements(positionId);
    if (requirements.length === 0) return true;
    return requirements.includes(character.archetype);
  };

  // Add character to team
  const addCharacterToPosition = (character: OwnedCharacter, positionId: string) => {
    if (!canFillPosition(character, positionId)) return;
    
    const position = selectedFormation.positions.find(p => p.id === positionId);
    const isLeader = position?.role === 'leader';
    
    // Remove any existing character from this position
    const updatedMembers = teamMembers.filter(member => member.position !== positionId);
    
    // Add new character
    updatedMembers.push({
      characterId: character.characterId,
      position: positionId,
      isLeader
    });
    
    setTeamMembers(updatedMembers);
    setSelectedPosition(null);
  };

  // Remove character from team
  const removeCharacterFromTeam = (characterId: string) => {
    setTeamMembers(teamMembers.filter(member => member.characterId !== characterId));
  };

  // Clear team
  const clearTeam = () => {
    setTeamMembers([]);
    setTeamName('');
  };

  // Save team
  const saveTeam = () => {
    if (!teamName.trim() || teamMembers.length === 0) return;
    
    const team: TeamComposition = {
      id: `team_${Date.now()}`,
      name: teamName,
      formation: selectedFormation.id,
      members: teamMembers,
      activeSynergies,
      teamStats: {
        totalPower: teamPower,
        avgLevel: teamMembersWithData.reduce((sum, member) => {
          const char = characters.find(c => c.characterId === member.characterId);
          return sum + (char?.level || 1);
        }, 0) / teamMembersWithData.length,
        synergiesCount: activeSynergies.length,
        formationBonus: selectedFormation.formationBonuses.length
      },
      createdDate: new Date(),
      wins: 0,
      losses: 0,
      isActive: false,
      isFavorite: false
    };
    
    onSaveTeam?.(team);
    setTeamName('');
  };

  // Get archetype icon
  const getArchetypeIcon = (archetype: string) => {
    const icons = {
      warrior: '⚔️',
      mage: '🔮',
      trickster: '🎭',
      leader: '👑',
      scholar: '📚',
      beast: '🐺'
    };
    return icons[archetype.toLowerCase() as keyof typeof icons] || '⭐';
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    return characterRarityConfig[rarity as keyof typeof characterRarityConfig]?.color || 'from-gray-500 to-gray-600';
  };

  // Get synergy by ID
  const getSynergyById = (synergyId: string) => {
    return teamSynergies.find(s => s.id === synergyId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-blue-400" />
          Team Builder
        </h1>
        <p className="text-gray-400 text-lg">
          Create the perfect team composition for strategic victory
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('build')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'build'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Build Team</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Save className="w-5 h-5" />
            <span>Saved Teams</span>
            {savedTeams.length > 0 && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {savedTeams.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'build' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formation Selection & Team Composition */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formation Selector */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                Formation Selection
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamFormations.map((formation) => (
                  <motion.div
                    key={formation.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedFormation.id === formation.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-blue-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedFormation(formation);
                      setTeamMembers([]); // Clear team when changing formation
                    }}
                  >
                    <div className="text-center mb-2">
                      <div className="text-3xl mb-1">{formation.icon}</div>
                      <h3 className="font-semibold text-white">{formation.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{formation.type}</p>
                    </div>
                    <p className="text-sm text-gray-300 text-center">{formation.description}</p>
                    <div className="mt-2 text-center">
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        Max {formation.maxTeamSize} members
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Team Composition Board */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-400" />
                  {selectedFormation.name}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTeamStats(!showTeamStats)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={clearTeam}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Formation Visual */}
              <div className="relative bg-gray-800/50 rounded-lg p-6 mb-4" style={{ minHeight: '300px' }}>
                {selectedFormation.positions.map((position) => {
                  const assignedMember = teamMembers.find(member => member.position === position.id);
                  const assignedCharacter = assignedMember 
                    ? characters.find(c => c.characterId === assignedMember.characterId)
                    : null;

                  return (
                    <motion.div
                      key={position.id}
                      className={`absolute cursor-pointer transition-all ${
                        selectedPosition === position.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: `${position.position.x}%`,
                        top: `${position.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedPosition(position.id)}
                    >
                      <div className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center text-center ${
                        assignedCharacter
                          ? `border-green-500 bg-gradient-to-r ${getRarityColor(assignedCharacter.rarity)}/20`
                          : selectedPosition === position.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-600 bg-gray-700/50 border-dashed'
                      }`}>
                        {assignedCharacter ? (
                          <>
                            <div className="text-2xl">{getArchetypeIcon(assignedCharacter.archetype)}</div>
                            <div className="text-xs text-white font-semibold truncate w-full px-1">
                              {assignedCharacter.nickname || assignedCharacter.characterName}
                            </div>
                            {assignedMember?.isLeader && (
                              <Crown className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCharacterFromTeam(assignedCharacter.characterId);
                              }}
                              className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Plus className="w-6 h-6 text-gray-400" />
                            <div className="text-xs text-gray-400">{position.role}</div>
                          </>
                        )}
                      </div>
                      
                      {/* Position tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="font-semibold">{position.name}</div>
                        {position.requirements?.archetype && (
                          <div className="text-gray-300">
                            {position.requirements.archetype.join(', ')}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Team Stats */}
              <AnimatePresence>
                {showTeamStats && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg"
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{teamPower.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Team Power</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-400">{teamMembersWithData.length}</div>
                      <div className="text-xs text-gray-400">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-400">{activeSynergies.length}</div>
                      <div className="text-xs text-gray-400">Synergies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {teamMembersWithData.length > 0 
                          ? Math.round(teamMembersWithData.reduce((sum, member) => {
                              const char = characters.find(c => c.characterId === member.characterId);
                              return sum + (char?.level || 1);
                            }, 0) / teamMembersWithData.length)
                          : 0}
                      </div>
                      <div className="text-xs text-gray-400">Avg Level</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Validation Errors */}
              {!validation.isValid && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Team Validation Issues:
                  </div>
                  <ul className="text-red-300 text-sm space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Active Synergies */}
              {activeSynergies.length > 0 && (
                <div className="mt-4 p-4 bg-purple-500/20 border border-purple-500 rounded-lg">
                  <h3 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Active Synergies ({activeSynergies.length})
                  </h3>
                  <div className="space-y-2">
                    {activeSynergies.map(synergyId => {
                      const synergy = getSynergyById(synergyId);
                      if (!synergy) return null;
                      
                      return (
                        <div key={synergyId} className="flex items-center gap-3 text-sm">
                          <span className="text-lg">{synergy.icon}</span>
                          <div>
                            <div className="text-purple-300 font-semibold">{synergy.name}</div>
                            <div className="text-gray-300">{synergy.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Team Actions */}
              {teamMembers.length > 0 && (
                <div className="mt-4 flex gap-3">
                  <input
                    type="text"
                    placeholder="Team name..."
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={saveTeam}
                    disabled={!teamName.trim() || !validation.isValid}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  {validation.isValid && onStartBattle && (
                    <button
                      onClick={() => {
                        const team: TeamComposition = {
                          id: 'temp_team',
                          name: teamName || 'Quick Battle Team',
                          formation: selectedFormation.id,
                          members: teamMembers,
                          activeSynergies,
                          teamStats: {
                            totalPower: teamPower,
                            avgLevel: 0,
                            synergiesCount: activeSynergies.length,
                            formationBonus: 0
                          },
                          createdDate: new Date(),
                          wins: 0,
                          losses: 0,
                          isActive: true,
                          isFavorite: false
                        };
                        onStartBattle(team);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Battle
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Character Selection Panel */}
          <div className="space-y-6">
            {/* Character Filters */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search characters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={filterArchetype}
                  onChange={(e) => setFilterArchetype(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Archetypes</option>
                  <option value="warrior">⚔️ Warrior</option>
                  <option value="mage">🔮 Mage</option>
                  <option value="trickster">🎭 Trickster</option>
                  <option value="leader">👑 Leader</option>
                  <option value="scholar">📚 Scholar</option>
                  <option value="beast">🐺 Beast</option>
                </select>
              </div>
            </div>

            {/* Available Characters */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Available Characters
                {selectedPosition && (
                  <span className="text-sm text-gray-400">
                    (Select for {selectedFormation.positions.find(p => p.id === selectedPosition)?.name})
                  </span>
                )}
              </h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableCharacters.map((character) => {
                  const canFill = selectedPosition ? canFillPosition(character, selectedPosition) : true;
                  const rarityConfig = characterRarityConfig[character?.rarity || 'common'] || characterRarityConfig.common;
                  
                  return (
                    <motion.div
                      key={character?.characterId || character?.id || Math.random()}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        canFill && selectedPosition
                          ? `border-green-500 hover:bg-gradient-to-r ${rarityConfig?.color || 'gray'}/10`
                          : selectedPosition
                            ? 'border-gray-700 bg-gray-800/30 opacity-50 cursor-not-allowed'
                            : `border-gray-600 hover:border-blue-400 hover:bg-gradient-to-r ${rarityConfig?.color || 'gray'}/5`
                      }`}
                      whileHover={canFill ? { scale: 1.02 } : {}}
                      onClick={() => {
                        if (selectedPosition && canFill) {
                          addCharacterToPosition(character, selectedPosition);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getArchetypeIcon(character.archetype)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${rarityConfig.textColor}`}>
                              {character.nickname || character.characterName}
                            </span>
                            <span className="text-sm">{rarityConfig.icon}</span>
                            {character.isFavorite && (
                              <span className="text-red-400">❤️</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 capitalize">
                            {character.archetype} • Level {character.level}
                          </div>
                          <div className="text-xs text-green-400">
                            {character.wins}W/{character.losses}L
                          </div>
                        </div>
                        {selectedPosition && canFill && (
                          <div className="text-green-400">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {availableCharacters.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No characters available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Saved Teams Tab
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Save className="w-6 h-6 text-green-400" />
            Saved Teams ({savedTeams.length})
          </h2>
          
          {savedTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTeams.map((team) => (
                <motion.div
                  key={team.id}
                  className="border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-all"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <div className="flex gap-1">
                      {team.isFavorite && <span className="text-red-400">❤️</span>}
                      {team.isActive && <span className="text-green-400">●</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">Power:</span>
                      <span className="text-white ml-1">{team.teamStats.totalPower.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Members:</span>
                      <span className="text-white ml-1">{team.members.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Synergies:</span>
                      <span className="text-purple-400 ml-1">{team.teamStats.synergiesCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Record:</span>
                      <span className="text-green-400 ml-1">{team.wins}W/{team.losses}L</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onStartBattle?.(team)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-4 h-4" />
                      Battle
                    </button>
                    <button
                      onClick={() => onDeleteTeam?.(team.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Save className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Saved Teams</h3>
              <p className="text-gray-500 mb-4">
                Create and save your first team composition!
              </p>
              <button
                onClick={() => setActiveTab('build')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Build Your First Team
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}