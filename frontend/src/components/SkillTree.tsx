'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  CheckCircle, 
  Circle, 
  Star,
  Zap,
  Info,
  Brain,
  Shield,
  Sword
} from 'lucide-react';
import { Skill, SkillCategory, coreSkills, archetypeSkills, signatureSkills, Archetype } from '@/data/skills';

interface SkillTreeProps {
  characterId: string;
  characterName: string;
  characterLevel: number;
  characterArchetype: Archetype;
  learnedSkills: string[]; // skill ids
  onLearnSkill?: (skillId: string) => void;
  trainingPoints?: number;
}

export default function SkillTree({
  characterId,
  characterName,
  characterLevel,
  characterArchetype,
  learnedSkills = [],
  onLearnSkill,
  trainingPoints = 0
}: SkillTreeProps) {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('core');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Get skills based on category
  const getSkillsForCategory = () => {
    switch (selectedCategory) {
      case 'core':
        return coreSkills;
      case 'archetype':
        return archetypeSkills[characterArchetype] || [];
      case 'signature':
        return signatureSkills[characterId] || [];
      default:
        return [];
    }
  };

  // Check if skill requirements are met
  const canLearnSkill = (skill: Skill) => {
    // Check level requirement
    if (characterLevel < skill.requirements.level) return false;
    
    // Check previous skill requirement
    if (skill.requirements.previousSkill && !learnedSkills.includes(skill.requirements.previousSkill)) {
      return false;
    }
    
    // Check archetype requirement
    if (skill.requirements.archetype && !skill.requirements.archetype.includes(characterArchetype)) {
      return false;
    }
    
    // Check if already learned
    if (learnedSkills.includes(skill.id)) return false;
    
    // Check training points
    if (trainingPoints < skill.requirements.trainingCost) return false;
    
    return true;
  };

  const getSkillStatus = (skill: Skill) => {
    if (learnedSkills.includes(skill.id)) return 'learned';
    if (canLearnSkill(skill)) return 'available';
    return 'locked';
  };

  const getCategoryIcon = (category: SkillCategory) => {
    switch (category) {
      case 'core':
        return <Brain className="w-5 h-5" />;
      case 'archetype':
        return <Shield className="w-5 h-5" />;
      case 'signature':
        return <Star className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: SkillCategory) => {
    switch (category) {
      case 'core':
        return 'from-blue-500 to-cyan-500';
      case 'archetype':
        return 'from-purple-500 to-pink-500';
      case 'signature':
        return 'from-yellow-500 to-orange-500';
    }
  };

  const skills = getSkillsForCategory();

  // Group skills by type for better organization
  const groupedSkills = skills.reduce((acc, skill) => {
    const type = skill.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {characterName}&apos;s Skill Tree
        </h2>
        <div className="flex items-center justify-center gap-4 text-gray-400">
          <span>Level {characterLevel}</span>
          <span>•</span>
          <span className="capitalize">{characterArchetype}</span>
          <span>•</span>
          <span className="text-yellow-400 flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {trainingPoints} Training Points
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          {(['core', 'archetype', 'signature'] as SkillCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r text-white shadow-lg ' + getCategoryColor(category)
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {getCategoryIcon(category)}
              <span className="capitalize">{category} Skills</span>
              <span className="text-sm opacity-75">
                ({skills.filter(s => s.category === category).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Skill Branches */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedSkills).map(([type, typeSkills]) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 capitalize">
                {type} Skills
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeSkills.map((skill) => {
                  const status = getSkillStatus(skill);
                  const isSelected = selectedSkill?.id === skill.id;
                  
                  return (
                    <motion.div
                      key={skill.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSkill(skill);
                        setShowDetails(true);
                      }}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : status === 'learned'
                          ? 'border-green-500/50 bg-green-500/10'
                          : status === 'available'
                          ? 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500'
                          : 'border-gray-600 bg-gray-800/50 opacity-60'
                      }`}
                    >
                      {/* Skill Icon & Name */}
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{skill.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{skill.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            Level {skill.requirements.level} Required
                          </p>
                        </div>
                        
                        {/* Status Icon */}
                        <div>
                          {status === 'learned' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {status === 'available' && (
                            <Circle className="w-5 h-5 text-yellow-500" />
                          )}
                          {status === 'locked' && (
                            <Lock className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <span className="text-gray-400">
                          Cost: {skill.requirements.trainingCost} TP
                        </span>
                        {skill.cooldown > 0 && (
                          <span className="text-gray-400">
                            CD: {skill.cooldown}
                          </span>
                        )}
                        {skill.energyCost > 0 && (
                          <span className="text-gray-400">
                            Energy: {skill.energyCost}
                          </span>
                        )}
                      </div>
                      
                      {/* Connection Line to Previous Skill */}
                      {skill.requirements.previousSkill && (
                        <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-gray-600" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Skill Details Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedSkill && showDetails && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="sticky top-6 bg-gray-900/90 rounded-xl border border-gray-700 p-6"
              >
                {/* Skill Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{selectedSkill.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{selectedSkill.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{selectedSkill.description}</p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Requirements
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li className={`flex items-center gap-2 ${
                      characterLevel >= selectedSkill.requirements.level ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {characterLevel >= selectedSkill.requirements.level ? '✓' : '✗'}
                      Level {selectedSkill.requirements.level}
                    </li>
                    {selectedSkill.requirements.previousSkill && (
                      <li className={`flex items-center gap-2 ${
                        learnedSkills.includes(selectedSkill.requirements.previousSkill) ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {learnedSkills.includes(selectedSkill.requirements.previousSkill) ? '✓' : '✗'}
                        Previous Skill Required
                      </li>
                    )}
                    <li className={`flex items-center gap-2 ${
                      trainingPoints >= selectedSkill.requirements.trainingCost ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trainingPoints >= selectedSkill.requirements.trainingCost ? '✓' : '✗'}
                      {selectedSkill.requirements.trainingCost} Training Points
                    </li>
                  </ul>
                </div>

                {/* Effects */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Effects
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {selectedSkill.effects.map((effect, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{effect.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Battle Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="text-gray-400">Cooldown</div>
                    <div className="text-white font-semibold">
                      {selectedSkill.cooldown === 999 ? 'Once per battle' : 
                       selectedSkill.cooldown === 0 ? 'Passive' : 
                       `${selectedSkill.cooldown} turns`}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="text-gray-400">Energy Cost</div>
                    <div className="text-white font-semibold">
                      {selectedSkill.energyCost || 'Free'}
                    </div>
                  </div>
                </div>

                {/* Learn Button */}
                {!learnedSkills.includes(selectedSkill.id) && (
                  <button
                    onClick={() => onLearnSkill?.(selectedSkill.id)}
                    disabled={!canLearnSkill(selectedSkill)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      canLearnSkill(selectedSkill)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canLearnSkill(selectedSkill) ? 'Learn Skill' : 'Requirements Not Met'}
                  </button>
                )}
                
                {learnedSkills.includes(selectedSkill.id) && (
                  <div className="w-full py-3 bg-green-500/20 border border-green-500/50 rounded-lg text-center text-green-400 font-semibold">
                    ✓ Skill Learned
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}