'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book, Play, ArrowRight, ArrowLeft, Clock, Brain,
  Heart, Users, Crown, Zap, Shield, Eye, Star,
  CheckCircle, Lock, Award, MessageCircle, Target
} from 'lucide-react';
import { StoryArcManager, StoryArc, StoryScene } from '../systems/storyArcs';

export default function StoryArcViewer() {
  const [storyManager] = useState(() => StoryArcManager.loadProgress());
  const [availableArcs, setAvailableArcs] = useState(storyManager.getAvailableArcs());
  const [currentScene, setCurrentScene] = useState(storyManager.getCurrentScene());
  const [selectedArc, setSelectedArc] = useState<StoryArc | null>(null);
  const [showArcSelection, setShowArcSelection] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentScene?.autoAdvance && currentScene.duration) {
      const timer = setTimeout(() => {
        handleAutoAdvance();
      }, currentScene.duration);
      setAutoAdvanceTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [currentScene]);

  const handleStartArc = (arcId: string) => {
    const scene = storyManager.startArc(arcId);
    if (scene) {
      setCurrentScene(scene);
      setShowArcSelection(false);
      setIsPlaying(true);
      const arc = availableArcs.find(a => a.id === arcId);
      setSelectedArc(arc || null);
      storyManager.saveProgress();
    }
  };

  const handleChoice = (choiceIndex: number) => {
    const nextScene = storyManager.makeChoice(choiceIndex);
    setCurrentScene(nextScene);
    
    if (!nextScene) {
      // Arc completed
      storyManager.completeCurrentArc();
      setAvailableArcs(storyManager.getAvailableArcs());
      setShowArcSelection(true);
      setIsPlaying(false);
      setSelectedArc(null);
    }
    
    storyManager.saveProgress();
  };

  const handleAutoAdvance = () => {
    // For auto-advance scenes, just complete the arc or move to next scene
    storyManager.completeCurrentArc();
    setAvailableArcs(storyManager.getAvailableArcs());
    setShowArcSelection(true);
    setIsPlaying(false);
    setSelectedArc(null);
    storyManager.saveProgress();
  };

  const handleBackToSelection = () => {
    setShowArcSelection(true);
    setIsPlaying(false);
    setCurrentScene(null);
    setSelectedArc(null);
  };

  const getCharacterIcon = (characterId: string) => {
    switch (characterId) {
      case 'achilles':
        return <Shield className="w-6 h-6 text-red-400" />;
      case 'sherlock-holmes':
        return <Eye className="w-6 h-6 text-blue-400" />;
      case 'dracula':
        return <Crown className="w-6 h-6 text-purple-400" />;
      case 'thor':
        return <Zap className="w-6 h-6 text-yellow-400" />;
      case 'cleopatra':
        return <Star className="w-6 h-6 text-gold" />;
      default:
        return <Users className="w-6 h-6 text-gray-400" />;
    }
  };

  if (showArcSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
              Character Story Arcs
            </h1>
            <p className="text-gray-300 text-lg">
              Discover the psychological depths of _____ characters through immersive stories
            </p>
          </motion.div>

          {/* Available Story Arcs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableArcs.map((arc, index) => (
              <motion.div
                key={arc.id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleStartArc(arc.id)}
              >
                <div className="flex items-center gap-3 mb-4">
                  {getCharacterIcon(arc.characterId)}
                  <div>
                    <h3 className="text-xl font-bold">{arc.title}</h3>
                    <p className="text-sm text-gray-400 capitalize">{arc.characterId.replace('-', ' ')}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4">{arc.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-pink-400" />
                    Psychology Lessons
                  </h4>
                  <ul className="space-y-1">
                    {arc.psychologyLessons.slice(0, 2).map((lesson, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                        {lesson}
                      </li>
                    ))}
                    {arc.psychologyLessons.length > 2 && (
                      <li className="text-sm text-gray-500">
                        +{arc.psychologyLessons.length - 2} more lessons...
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-400">{arc.scenes.length} scenes</span>
                  <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Play className="w-4 h-4" />
                    Start Story
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Completed Arcs */}
          {storyManager.getCompletedArcs().length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Award className="text-gold" />
                Completed Story Arcs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {storyManager.getCompletedArcs().map((arcId) => (
                  <div
                    key={arcId}
                    className="bg-green-900/30 border border-green-400/50 rounded-lg p-4 text-center"
                  >
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="font-medium text-green-300">{arcId.replace('-', ' ')}</p>
                    <p className="text-sm text-gray-400">Completed</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableArcs.length === 0 && storyManager.getCompletedArcs().length === 0 && (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Story Arcs Available</h3>
              <p className="text-gray-500">Complete more campaign objectives to unlock character stories</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Story Scene View
  if (currentScene && selectedArc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Story Header */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToSelection}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{selectedArc.title}</h1>
                <p className="text-gray-400">{currentScene.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getCharacterIcon(selectedArc.characterId)}
              <span className="font-medium capitalize">{selectedArc.characterId.replace('-', ' ')}</span>
            </div>
          </motion.div>

          {/* Scene Content */}
          <motion.div 
            className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-8 border border-purple-500/30 mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={currentScene.id}
          >
            <div className="prose prose-invert prose-lg max-w-none">
              {currentScene.content.split('\n\n').map((paragraph, index) => (
                <motion.p 
                  key={index}
                  className="text-gray-200 leading-relaxed mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </motion.div>

          {/* Psychology Reveals */}
          {currentScene.psychologyReveal && currentScene.psychologyReveal.length > 0 && (
            <motion.div 
              className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-lg p-6 border border-pink-400/30 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-pink-400" />
                Psychology Insights
              </h3>
              <ul className="space-y-2">
                {currentScene.psychologyReveal.map((insight, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-300"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Target className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                    {insight}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Choices */}
          {currentScene.choices && currentScene.choices.length > 0 && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                Your Choice
              </h3>
              {currentScene.choices.map((choice, index) => (
                <motion.button
                  key={index}
                  className="w-full text-left p-4 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 hover:border-purple-400 rounded-lg transition-all"
                  onClick={() => handleChoice(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>
                      <p className="font-medium mb-1">{choice.text}</p>
                      <p className="text-sm text-gray-400">{choice.consequence}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Auto-advance indicator */}
          {currentScene.autoAdvance && (
            <motion.div 
              className="text-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Story continues automatically...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return null;
}