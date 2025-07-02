'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Lock, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Target,
  Map,
  Award,
  Clock,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Character } from '@/data/characters';
import { 
  EquipmentProgressionSystem,
  EquipmentProgressionNode,
  ProgressionQuest,
  getProgressionRecommendations
} from '@/data/equipmentProgression';
import { getCharacterSpecificWeapons } from '@/data/equipment';

interface EquipmentProgressionTrackerProps {
  character: Character;
  onStartQuest?: (questId: string) => void;
  onUpgradeEquipment?: (equipmentId: string) => void;
}

export default function EquipmentProgressionTracker({
  character,
  onStartQuest,
  onUpgradeEquipment
}: EquipmentProgressionTrackerProps) {
  const [selectedNode, setSelectedNode] = useState<EquipmentProgressionNode | null>(null);
  const [activeTab, setActiveTab] = useState<'progression' | 'quests' | 'recommendations'>('progression');

  const progression = EquipmentProgressionSystem.getCharacterProgression(character.id);
  const summary = EquipmentProgressionSystem.generateProgressionSummary(character.id, character);
  const recommendations = getProgressionRecommendations(character.id, character);
  const availableQuests = EquipmentProgressionSystem.getAvailableQuests(character.id);

  const ProgressionNode = ({ node, isLast = false }: { node: EquipmentProgressionNode; isLast?: boolean }) => {
    const requirements = EquipmentProgressionSystem.checkUnlockConditions(node, character);
    const isSelected = selectedNode?.equipmentId === node.equipmentId;

    return (
      <div className="flex items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative w-16 h-16 rounded-full border-4 cursor-pointer transition-all duration-200
            ${node.isUnlocked 
              ? 'bg-green-100 border-green-500 text-green-700' 
              : requirements.canUnlock
                ? 'bg-blue-100 border-blue-500 text-blue-700 animate-pulse'
                : 'bg-gray-100 border-gray-300 text-gray-500'
            }
            ${isSelected ? 'ring-4 ring-purple-300' : ''}
          `}
          onClick={() => setSelectedNode(node)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {node.isUnlocked ? (
              <CheckCircle className="w-6 h-6" />
            ) : requirements.canUnlock ? (
              <Star className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          
          {/* Rarity indicator */}
          <div className={`
            absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
            ${node.rarity === 'common' ? 'bg-gray-500 text-white' :
              node.rarity === 'rare' ? 'bg-blue-500 text-white' :
              'bg-yellow-500 text-white'
            }
          `}>
            {node.rarity === 'common' ? '1' : node.rarity === 'rare' ? '2' : '3'}
          </div>
        </motion.div>
        
        {!isLast && (
          <div className="flex items-center mx-4">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
    );
  };

  const QuestCard = ({ quest }: { quest: ProgressionQuest }) => {
    const completedSteps = quest.steps.filter(s => s.completed).length;
    const progress = (completedSteps / quest.steps.length) * 100;

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">{quest.name}</h3>
            <p className="text-sm text-gray-600">{quest.description}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Progress</div>
            <div className="font-mono text-sm">{completedSteps}/{quest.steps.length}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Quest steps */}
        <div className="space-y-2 mb-4">
          {quest.steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2 text-sm">
              {step.completed ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-gray-300" />
              )}
              <span className={step.completed ? 'text-gray-500 line-through' : 'text-gray-700'}>
                {step.description}
              </span>
            </div>
          ))}
        </div>

        {/* Rewards */}
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs text-gray-600 mb-2">Rewards</div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>{quest.rewards.experience} XP</span>
            </div>
            {quest.rewards.materials && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>{quest.rewards.materials.length} Materials</span>
              </div>
            )}
            {quest.rewards.equipment && (
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3 text-purple-500" />
                <span>{quest.rewards.equipment.length} Equipment</span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        {!quest.isCompleted && (
          <button
            onClick={() => onStartQuest?.(quest.id)}
            className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {completedSteps === 0 ? 'Start Quest' : 'Continue Quest'}
          </button>
        )}
      </motion.div>
    );
  };

  const RecommendationCard = ({ recommendation }: { recommendation: any }) => {
    const priorityColors = {
      high: 'border-red-300 bg-red-50',
      medium: 'border-yellow-300 bg-yellow-50',
      low: 'border-blue-300 bg-blue-50'
    };

    const priorityIcons = {
      high: <AlertCircle className="w-5 h-5 text-red-600" />,
      medium: <Clock className="w-5 h-5 text-yellow-600" />,
      low: <Target className="w-5 h-5 text-blue-600" />
    };

    return (
      <div className={`rounded-lg border-2 p-4 ${priorityColors[recommendation.priority]}`}>
        <div className="flex items-start gap-3">
          {priorityIcons[recommendation.priority]}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{recommendation.action}</h3>
            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
            
            {recommendation.requirements && recommendation.requirements.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-1">Requirements:</div>
                <ul className="text-xs space-y-1">
                  {recommendation.requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className={`
            text-xs font-medium px-2 py-1 rounded uppercase
            ${recommendation.priority === 'high' ? 'bg-red-200 text-red-800' :
              recommendation.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
              'bg-blue-200 text-blue-800'
            }
          `}>
            {recommendation.priority}
          </div>
        </div>
      </div>
    );
  };

  if (!progression) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Progression Available</h3>
          <p className="text-gray-600">Equipment progression not found for {character.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Equipment Progression
            </h2>
            <p className="text-purple-100 mt-1">{character.name}&apos;s advancement path</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{summary.currentProgress}%</div>
            <div className="text-sm text-purple-200">Complete</div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'progression', label: 'Progression Tree', icon: TrendingUp },
            { id: 'quests', label: `Quests (${availableQuests.length})`, icon: Map },
            { id: 'recommendations', label: `Tips (${recommendations.length})`, icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'progression' && (
            <motion.div
              key="progression"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Overall progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-600">{summary.completedUpgrades.length} / {summary.totalUpgrades}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${summary.currentProgress}%` }}
                  />
                </div>
              </div>

              {/* Weapon progression tree */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Weapon Progression</h3>
                <div className="flex items-center justify-center py-8">
                  {progression.weaponTree.map((node, index) => (
                    <ProgressionNode 
                      key={node.equipmentId} 
                      node={node} 
                      isLast={index === progression.weaponTree.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Selected node details */}
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-gray-50 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-800 mb-2">{selectedNode.equipmentId}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Required Level:</span>
                      <span className="ml-2 font-medium">{selectedNode.unlockConditions.characterLevel}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rarity:</span>
                      <span className="ml-2 font-medium capitalize">{selectedNode.rarity}</span>
                    </div>
                  </div>
                  
                  {!selectedNode.isUnlocked && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-600 mb-2">Requirements:</div>
                      {(() => {
                        const requirements = EquipmentProgressionSystem.checkUnlockConditions(selectedNode, character);
                        return (
                          <ul className="text-sm space-y-1">
                            {requirements.missingRequirements.map((req, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-500 rounded-full" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'quests' && (
            <motion.div
              key="quests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Quests</h3>
              {availableQuests.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No quests available at this time</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {availableQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">All caught up! Check back later for new opportunities.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <RecommendationCard key={index} recommendation={rec} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}