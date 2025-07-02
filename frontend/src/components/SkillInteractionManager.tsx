'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Star,
  Clock,
  Target,
  Sparkles,
  Flame,
  Shield,
  Users,
  Brain,
  Heart,
  Eye,
  ArrowRight,
  Plus,
  Check,
  X,
  Info,
  Lightbulb,
  Award,
  TrendingUp
} from 'lucide-react';
import {
  SkillInteraction,
  SkillSynergy,
  ActiveInteraction,
  getAvailableInteractions,
  activateInteraction,
  updateInteractionCooldowns,
  calculateCombinedBonuses,
  createDemoSkillSynergy,
  coreSkillInteractions,
  signatureInteractions,
  archetypeInteractions
} from '@/data/skillInteractions';

interface SkillInteractionManagerProps {
  character: {
    id: string;
    name: string;
    avatar: string;
    archetype: string;
    coreSkills: Record<string, { level: number; experience: number; maxLevel: number }>;
    signatureSkills: Record<string, { level: number; experience: number; maxLevel: number }>;
  };
  onInteractionActivate?: (interaction: SkillInteraction, bonuses: Record<string, number>) => void;
}

export default function SkillInteractionManager({
  character,
  onInteractionActivate
}: SkillInteractionManagerProps) {
  const [synergy, setSynergy] = useState<SkillSynergy>(createDemoSkillSynergy(character.id));
  const [selectedInteraction, setSelectedInteraction] = useState<SkillInteraction | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'mastered'>('available');
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>('all');

  // Get available interactions based on character skills
  const availableInteractions = getAvailableInteractions(
    character.id.split('_')[0], // Extract character template ID
    character.archetype,
    character.coreSkills,
    character.signatureSkills
  );

  // Filter interactions by rarity
  const filteredInteractions = availableInteractions.filter(interaction =>
    filterRarity === 'all' || interaction.rarity === filterRarity
  );

  // Update cooldowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSynergy(prev => updateInteractionCooldowns(prev, 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleActivateInteraction = (interaction: SkillInteraction) => {
    const result = activateInteraction(synergy, interaction.id);
    if (result.success) {
      setSynergy(result.updatedSynergy);
      const bonuses = calculateCombinedBonuses(result.updatedSynergy.activeInteractions);
      onInteractionActivate?.(interaction, bonuses);
    }
  };

  const rarityColors = {
    common: 'border-gray-500 bg-gray-500/10 text-gray-300',
    uncommon: 'border-green-500 bg-green-500/10 text-green-300',
    rare: 'border-blue-500 bg-blue-500/10 text-blue-300',
    epic: 'border-purple-500 bg-purple-500/10 text-purple-300',
    legendary: 'border-yellow-500 bg-yellow-500/10 text-yellow-300'
  };

  const effectTypeIcons = {
    combat: Flame,
    utility: Lightbulb,
    passive: Shield,
    social: Users
  };

  const tabs = [
    { id: 'available', label: 'Available', count: filteredInteractions.length },
    { id: 'active', label: 'Active', count: synergy.activeInteractions.length },
    { id: 'mastered', label: 'Mastered', count: synergy.masteredInteractions.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Zap className="w-8 h-8 text-yellow-400" />
          Skill Interactions
        </h1>
        <p className="text-gray-400">
          Combine core and signature skills for powerful synergy effects
        </p>
      </div>

      {/* Character Info */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">{character.avatar}</div>
          <div>
            <h2 className="text-xl font-bold text-white">{character.name}</h2>
            <p className="text-gray-400 capitalize">{character.archetype}</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-yellow-400">{synergy.comboCount}</div>
            <div className="text-sm text-gray-400">Total Combos</div>
          </div>
        </div>

        {/* Active Bonuses */}
        {synergy.activeInteractions.length > 0 && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-2 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Active Bonuses
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {Object.entries(calculateCombinedBonuses(synergy.activeInteractions)).map(([bonus, value]) => (
                <div key={bonus} className="flex justify-between">
                  <span className="text-gray-300 capitalize">{bonus.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                  <span className="text-green-400 font-bold">+{value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
              <span className="bg-black/30 px-2 py-1 rounded text-xs">{tab.count}</span>
            </button>
          ))}
        </div>

        {activeTab === 'available' && (
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        {/* Available Interactions */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {filteredInteractions.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No Interactions Available</h3>
                <p className="text-gray-500">Level up your skills to unlock powerful combinations</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInteractions.map((interaction) => {
                  const EffectIcon = effectTypeIcons[interaction.effects.type];
                  const isOnCooldown = synergy.activeInteractions.some(ai => 
                    ai.interactionId === interaction.id && ai.remainingCooldown > 0
                  );
                  const cooldownTime = synergy.activeInteractions.find(ai => 
                    ai.interactionId === interaction.id
                  )?.remainingCooldown || 0;

                  return (
                    <motion.div
                      key={interaction.id}
                      className={`${rarityColors[interaction.rarity]} border-2 rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                        isOnCooldown ? 'opacity-50' : 'hover:scale-102'
                      }`}
                      whileHover={!isOnCooldown ? { scale: 1.02 } : {}}
                      whileTap={!isOnCooldown ? { scale: 0.98 } : {}}
                      onClick={() => !isOnCooldown && setSelectedInteraction(interaction)}
                    >
                      {/* Rarity Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${rarityColors[interaction.rarity]}`}>
                          {interaction.rarity}
                        </span>
                      </div>

                      {/* Interaction Info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-2xl">{interaction.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">{interaction.name}</h3>
                          <p className="text-gray-300 text-sm">{interaction.description}</p>
                        </div>
                        <EffectIcon className="w-5 h-5 text-blue-400" />
                      </div>

                      {/* Requirements */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-1">Requirements:</div>
                        <div className="flex flex-wrap gap-1">
                          {interaction.requirements.coreSkills.map((req, index) => (
                            <span key={index} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              {req.skill} {req.minLevel}+
                            </span>
                          ))}
                          {interaction.requirements.signatureSkills.map((req, index) => (
                            <span key={index} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                              {req.skill} {req.minLevel}+
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Effects Preview */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-1">Effects:</div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(interaction.effects.bonuses).slice(0, 4).map(([bonus, value]) => (
                            <div key={bonus} className="flex justify-between">
                              <span className="text-gray-300 capitalize">{bonus.slice(0, 8)}:</span>
                              <span className="text-green-400">+{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOnCooldown) handleActivateInteraction(interaction);
                        }}
                        disabled={isOnCooldown}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                          isOnCooldown
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isOnCooldown ? (
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            {Math.ceil(cooldownTime)}s
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Activate
                          </div>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Active Interactions */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {synergy.activeInteractions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No Active Interactions</h3>
                <p className="text-gray-500">Activate skill combinations to see them here</p>
              </div>
            ) : (
              synergy.activeInteractions.map((activeInteraction) => {
                const interaction = [...coreSkillInteractions, ...signatureInteractions, ...archetypeInteractions]
                  .find(i => i.id === activeInteraction.interactionId);
                
                if (!interaction) return null;

                const remainingTime = activeInteraction.duration ? 
                  Math.max(0, activeInteraction.duration - (Date.now() - activeInteraction.activatedAt.getTime()) / 1000) : 
                  Infinity;

                return (
                  <motion.div
                    key={activeInteraction.interactionId}
                    className="bg-green-500/20 border border-green-500/50 rounded-xl p-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{interaction.icon}</div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{interaction.name}</h3>
                          <p className="text-gray-300 text-sm">{interaction.description}</p>
                        </div>
                      </div>
                      {activeInteraction.duration && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{Math.ceil(remainingTime)}s</div>
                          <div className="text-xs text-gray-400">Remaining</div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {Object.entries(activeInteraction.bonuses).map(([bonus, value]) => (
                        <div key={bonus} className="flex justify-between">
                          <span className="text-gray-300 capitalize">{bonus.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          <span className="text-green-400 font-bold">+{value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Mastered Interactions */}
        {activeTab === 'mastered' && (
          <div className="space-y-4">
            {synergy.masteredInteractions.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No Mastered Interactions</h3>
                <p className="text-gray-500">Use interactions 10+ times to master them for enhanced effects</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {synergy.masteredInteractions.map((interactionId) => {
                  const interaction = [...coreSkillInteractions, ...signatureInteractions, ...archetypeInteractions]
                    .find(i => i.id === interactionId);
                  
                  if (!interaction) return null;

                  return (
                    <div
                      key={interactionId}
                      className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">{interaction.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {interaction.name}
                            <Award className="w-4 h-4 text-yellow-400" />
                          </h3>
                          <p className="text-gray-300 text-sm">{interaction.description}</p>
                        </div>
                      </div>
                      <div className="text-xs text-yellow-400 font-semibold">
                        MASTERED: Enhanced effects and reduced cooldown
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interaction Detail Modal */}
      <AnimatePresence>
        {selectedInteraction && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedInteraction(null)}
          >
            <motion.div
              className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="text-4xl">{selectedInteraction.icon}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedInteraction.name}</h2>
                  <p className="text-gray-300 mb-3">{selectedInteraction.description}</p>
                  <span className={`text-sm px-3 py-1 rounded-full capitalize ${rarityColors[selectedInteraction.rarity]}`}>
                    {selectedInteraction.rarity}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedInteraction(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedInteraction.requirements.coreSkills.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Core Skills:</div>
                        {selectedInteraction.requirements.coreSkills.map((req, index) => (
                          <div key={index} className="flex items-center justify-between bg-blue-500/20 p-2 rounded">
                            <span className="text-blue-400 capitalize">{req.skill}</span>
                            <span className="text-white">Level {req.minLevel}+</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedInteraction.requirements.signatureSkills.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Signature Skills:</div>
                        {selectedInteraction.requirements.signatureSkills.map((req, index) => (
                          <div key={index} className="flex items-center justify-between bg-purple-500/20 p-2 rounded">
                            <span className="text-purple-400 capitalize">{req.skill}</span>
                            <span className="text-white">Level {req.minLevel}+</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Effects</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedInteraction.effects.bonuses).map(([bonus, value]) => (
                      <div key={bonus} className="flex justify-between bg-green-500/20 p-2 rounded">
                        <span className="text-gray-300 capitalize">{bonus.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <span className="text-green-400 font-bold">+{value}</span>
                      </div>
                    ))}
                  </div>
                  
                  {(selectedInteraction.effects.duration || selectedInteraction.effects.cooldown) && (
                    <div className="mt-3 flex gap-4 text-sm">
                      {selectedInteraction.effects.duration && (
                        <div className="text-gray-400">
                          Duration: <span className="text-white">{selectedInteraction.effects.duration}s</span>
                        </div>
                      )}
                      {selectedInteraction.effects.cooldown && (
                        <div className="text-gray-400">
                          Cooldown: <span className="text-white">{selectedInteraction.effects.cooldown}s</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleActivateInteraction(selectedInteraction);
                    setSelectedInteraction(null);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                >
                  Activate Interaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}