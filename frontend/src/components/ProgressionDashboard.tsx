'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Star,
  Target,
  Zap,
  Award,
  BarChart3,
  Users,
  Brain,
  Heart,
  Shield,
  Sword,
  Crown,
  Flame,
  Eye,
  Calendar,
  Clock,
  ArrowUp,
  ChevronRight,
  Sparkles,
  Trophy,
  Gem,
  Plus,
  Minus,
  Info,
  CheckCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { Character } from '@/data/characters';
import { CharacterSkills } from '@/data/characterProgression';
import { CharacterExperience } from '@/data/experience';

interface ProgressionDashboardProps {
  character: Character;
  onAllocateSkillPoint?: (skill: string) => void;
  onAllocateStatPoint?: (stat: string) => void;
  onViewDetails?: (section: string) => void;
}

interface ProgressionMilestone {
  id: string;
  name: string;
  description: string;
  requirement: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  reward: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function ProgressionDashboard({
  character,
  onAllocateSkillPoint,
  onAllocateStatPoint,
  onViewDetails
}: ProgressionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'stats' | 'milestones' | 'journey'>('overview');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationType, setAllocationType] = useState<'skill' | 'stat'>('skill');
  const [allocationTarget, setAllocationTarget] = useState<string>('');

  // Mock progression data based on character
  const skillData = {
    combat: { level: Math.floor(character.level * 0.8), experience: 450, maxExperience: 800, maxLevel: 100 },
    survival: { level: Math.floor(character.level * 0.6), experience: 320, maxExperience: 600, maxLevel: 100 },
    mental: { level: Math.floor(character.level * 0.7), experience: 380, maxExperience: 700, maxLevel: 100 },
    social: { level: Math.floor(character.level * 0.5), experience: 210, maxExperience: 500, maxLevel: 100 },
    spiritual: { level: Math.floor(character.level * 0.4), experience: 150, maxExperience: 400, maxLevel: 100 }
  };

  const milestones: ProgressionMilestone[] = [
    {
      id: 'combat_master',
      name: 'Combat Master',
      description: 'Reach Combat skill level 25',
      requirement: 'Combat Level 25',
      progress: skillData.combat.level,
      maxProgress: 25,
      isCompleted: skillData.combat.level >= 25,
      reward: 'Legendary Combat Ability',
      icon: '⚔️',
      rarity: 'legendary'
    },
    {
      id: 'balanced_warrior',
      name: 'Balanced Warrior',
      description: 'Reach level 15 in all core skills',
      requirement: 'All Skills Level 15+',
      progress: Math.min(...Object.values(skillData).map(s => s.level)),
      maxProgress: 15,
      isCompleted: Object.values(skillData).every(s => s.level >= 15),
      reward: 'Universal Skill Interaction',
      icon: '⚖️',
      rarity: 'epic'
    },
    {
      id: 'level_milestone',
      name: 'Veteran Status',
      description: 'Reach character level 30',
      requirement: 'Character Level 30',
      progress: character.level,
      maxProgress: 30,
      isCompleted: character.level >= 30,
      reward: 'Prestige Point System',
      icon: '🏅',
      rarity: 'rare'
    },
    {
      id: 'social_leader',
      name: 'Natural Leader',
      description: 'Reach Social skill level 20',
      requirement: 'Social Level 20',
      progress: skillData.social.level,
      maxProgress: 20,
      isCompleted: skillData.social.level >= 20,
      reward: 'Leadership Abilities',
      icon: '👑',
      rarity: 'epic'
    }
  ];

  const skillIcons = {
    combat: Sword,
    survival: Shield,
    mental: Brain,
    social: Users,
    spiritual: Heart
  };

  const skillColors = {
    combat: 'from-red-500 to-orange-500',
    survival: 'from-green-500 to-emerald-500',
    mental: 'from-blue-500 to-cyan-500',
    social: 'from-purple-500 to-pink-500',
    spiritual: 'from-yellow-500 to-amber-500'
  };

  const rarityColors = {
    common: 'border-gray-500 bg-gray-500/10',
    rare: 'border-blue-500 bg-blue-500/10',
    epic: 'border-purple-500 bg-purple-500/10',
    legendary: 'border-yellow-500 bg-yellow-500/10'
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'milestones', label: 'Milestones', icon: Trophy },
    { id: 'journey', label: 'Journey', icon: Star }
  ];

  const handleAllocation = (type: 'skill' | 'stat', target: string) => {
    setAllocationType(type);
    setAllocationTarget(target);
    setShowAllocationModal(true);
  };

  const confirmAllocation = () => {
    if (allocationType === 'skill' && onAllocateSkillPoint) {
      onAllocateSkillPoint(allocationTarget);
    } else if (allocationType === 'stat' && onAllocateStatPoint) {
      onAllocateStatPoint(allocationTarget);
    }
    setShowAllocationModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400" />
          Progression Dashboard
        </h1>
        <p className="text-gray-400 text-lg">
          Track your character&apos;s growth and unlock their true potential
        </p>
      </div>

      {/* Character Summary */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-6">
          <div className="text-8xl">{character.avatar}</div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{character.name}</h2>
            {character.title && (
              <p className="text-lg text-yellow-400 mb-3">{character.title}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{character.level}</div>
                <div className="text-sm text-gray-400">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{character.experience?.skillPoints || 0}</div>
                <div className="text-sm text-gray-400">Skill Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{character.statPoints}</div>
                <div className="text-sm text-gray-400">Stat Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{milestones.filter(m => m.isCompleted).length}</div>
                <div className="text-sm text-gray-400">Milestones</div>
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Experience to Next Level</span>
            <span>{character.experience?.currentXP || 0}/{character.experience?.xpToNextLevel || 1000}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ 
                width: `${((character.experience?.currentXP || 0) / (character.experience?.xpToNextLevel || 1000)) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Character Overview</h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Core Skills Summary */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Core Skills
                </h3>
                <div className="space-y-3">
                  {Object.entries(skillData).map(([skill, data]) => {
                    const SkillIcon = skillIcons[skill as keyof typeof skillIcons];
                    return (
                      <div key={skill} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SkillIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300 capitalize">{skill}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{data.level}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  Recent Progress
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="text-green-400">✓ Completed advanced training</div>
                  <div className="text-blue-400">✓ Skill interaction unlocked</div>
                  <div className="text-yellow-400">✓ Level milestone reached</div>
                  <div className="text-purple-400">✓ New ability acquired</div>
                </div>
              </div>

              {/* Next Goals */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Next Goals
                </h3>
                <div className="space-y-2 text-sm">
                  {milestones.filter(m => !m.isCompleted).slice(0, 3).map((milestone, index) => (
                    <div key={index} className="text-gray-300">
                      • {milestone.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progression Chart */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Skill Distribution</h3>
              <div className="space-y-4">
                {Object.entries(skillData).map(([skill, data]) => {
                  const SkillIcon = skillIcons[skill as keyof typeof skillIcons];
                  const percentage = (data.level / data.maxLevel) * 100;
                  return (
                    <div key={skill} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SkillIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-white capitalize">{skill}</span>
                        </div>
                        <span className="text-gray-300">{data.level}/{data.maxLevel}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className={`bg-gradient-to-r ${skillColors[skill as keyof typeof skillColors]} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Skill Development</h2>
              <div className="text-sm text-gray-400">
                Available Points: <span className="text-yellow-400 font-bold">{character.experience?.skillPoints || 0}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(skillData).map(([skill, data]) => {
                const SkillIcon = skillIcons[skill as keyof typeof skillIcons];
                const percentage = (data.experience / data.maxExperience) * 100;
                
                return (
                  <motion.div
                    key={skill}
                    className="bg-gray-800/50 rounded-xl p-6 border border-gray-600 hover:border-blue-500 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${skillColors[skill as keyof typeof skillColors]}`}>
                        <SkillIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white capitalize">{skill}</h3>
                        <p className="text-gray-400">Level {data.level}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{data.level}</div>
                        <div className="text-sm text-gray-400">/ {data.maxLevel}</div>
                      </div>
                    </div>

                    {/* Experience Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Experience</span>
                        <span>{data.experience}/{data.maxExperience}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${skillColors[skill as keyof typeof skillColors]} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAllocation('skill', skill);
                        }}
                        disabled={(character.experience?.skillPoints || 0) === 0}
                        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-all text-sm"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Allocate Point
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(skill);
                        }}
                        className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all text-sm"
                      >
                        <Info className="w-4 h-4 inline" />
                      </button>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {selectedSkill === skill && (
                        <motion.div
                          className="mt-4 pt-4 border-t border-gray-600"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="text-sm text-gray-300">
                            <div className="mb-2">
                              <span className="font-semibold">Benefits:</span>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {skill === 'combat' && (
                                  <>
                                    <li>Increased damage output</li>
                                    <li>Better critical hit chance</li>
                                    <li>Unlock combat abilities</li>
                                  </>
                                )}
                                {skill === 'survival' && (
                                  <>
                                    <li>Higher damage resistance</li>
                                    <li>Improved dodge chance</li>
                                    <li>Environmental adaptation</li>
                                  </>
                                )}
                                {skill === 'mental' && (
                                  <>
                                    <li>Strategic advantages</li>
                                    <li>Faster ability cooldowns</li>
                                    <li>Problem-solving bonuses</li>
                                  </>
                                )}
                                {skill === 'social' && (
                                  <>
                                    <li>Team coordination bonuses</li>
                                    <li>Leadership abilities</li>
                                    <li>NPC interaction improvements</li>
                                  </>
                                )}
                                {skill === 'spiritual' && (
                                  <>
                                    <li>Enhanced healing abilities</li>
                                    <li>Mana regeneration bonus</li>
                                    <li>Resistance to mental effects</li>
                                  </>
                                )}
                              </ul>
                            </div>
                            <div className="text-xs text-gray-400">
                              Next milestone at level {Math.floor((data.level + 5) / 5) * 5}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Character Statistics</h2>
              <div className="text-sm text-gray-400">
                Available Points: <span className="text-purple-400 font-bold">{character.statPoints}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(character.baseStats).map(([stat, value]) => (
                <div key={stat} className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white capitalize">{stat}</h3>
                    <div className="text-2xl font-bold text-blue-400">{value}</div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>

                  <button
                    onClick={() => handleAllocation('stat', stat)}
                    disabled={character.statPoints === 0}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-all text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Increase {stat}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Achievement Milestones</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {milestones.map((milestone) => (
                <motion.div
                  key={milestone.id}
                  className={`p-6 rounded-xl border-2 ${rarityColors[milestone.rarity]} ${
                    milestone.isCompleted ? 'opacity-100' : 'opacity-80'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{milestone.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">{milestone.name}</h3>
                        {milestone.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{milestone.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>{milestone.requirement}</span>
                          <span>{milestone.progress}/{milestone.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${
                              milestone.isCompleted 
                                ? 'from-green-500 to-emerald-500' 
                                : 'from-blue-500 to-purple-500'
                            } h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min((milestone.progress / milestone.maxProgress) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Reward */}
                      <div className="text-sm">
                        <span className="text-gray-400">Reward: </span>
                        <span className={milestone.isCompleted ? 'text-green-400' : 'text-yellow-400'}>
                          {milestone.reward}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Journey Tab */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Character Journey</h2>
            
            <div className="relative">
              {/* Timeline */}
              <div className="space-y-8">
                {[
                  { level: 1, title: 'The Beginning', description: 'Character awakens to their destiny', date: '7 days ago' },
                  { level: 5, title: 'First Victory', description: 'Won first arena battle', date: '5 days ago' },
                  { level: 10, title: 'Skill Unlock', description: 'Unlocked first skill interaction', date: '3 days ago' },
                  { level: 15, title: 'Training Master', description: 'Completed advanced training', date: '2 days ago' },
                  { level: character.level, title: 'Current State', description: 'Continuing the journey', date: 'Now', isCurrent: true }
                ].map((event, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        event.isCurrent 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {event.level}
                      </div>
                      {index < 4 && <div className="w-0.5 h-8 bg-gray-600 mt-2" />}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                        <span className="text-sm text-gray-400">{event.date}</span>
                      </div>
                      <p className="text-gray-300">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Allocation Modal */}
      <AnimatePresence>
        {showAllocationModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-md w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Allocate {allocationType === 'skill' ? 'Skill' : 'Stat'} Point
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to allocate a point to <span className="capitalize font-semibold text-blue-400">{allocationTarget}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmAllocation}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}