'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, HelpCircle, ExternalLink } from 'lucide-react';
import { useTutorial, TutorialStep } from '../hooks/useTutorial';

interface TutorialProps {
  className?: string;
}

export const Tutorial: React.FC<TutorialProps> = ({ className }) => {
  const {
    isActive,
    getCurrentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial
  } = useTutorial();

  const [highlightedElements, setHighlightedElements] = useState<Element[]>([]);

  const currentStep = getCurrentStep();

  // Handle element highlighting
  useEffect(() => {
    if (currentStep?.highlightElements) {
      const elements: Element[] = [];
      
      currentStep.highlightElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          elements.push(element);
          // Add highlight class
          element.classList.add('tutorial-highlight');
        }
      });
      
      setHighlightedElements(elements);
      
      // Cleanup function
      return () => {
        elements.forEach(element => {
          element.classList.remove('tutorial-highlight');
        });
        setHighlightedElements([]);
      };
    }
  }, [currentStep]);

  // Scroll to highlighted element
  useEffect(() => {
    if (currentStep?.targetSelector) {
      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [currentStep]);

  if (!isActive || !currentStep) {
    return null;
  }

  const getModalPosition = () => {
    if (currentStep.targetSelector) {
      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const modalWidth = 400;
        const modalHeight = 200;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let position;
        
        switch (currentStep.position) {
          case 'top':
            position = {
              top: Math.max(20, rect.top - modalHeight - 20),
              left: Math.max(20, Math.min(viewportWidth - modalWidth - 20, rect.left + (rect.width / 2) - (modalWidth / 2)))
            };
            break;
          case 'bottom':
            position = {
              top: Math.min(viewportHeight - modalHeight - 20, rect.bottom + 20),
              left: Math.max(20, Math.min(viewportWidth - modalWidth - 20, rect.left + (rect.width / 2) - (modalWidth / 2)))
            };
            break;
          case 'left':
            position = {
              top: Math.max(20, Math.min(viewportHeight - modalHeight - 20, rect.top + (rect.height / 2) - (modalHeight / 2))),
              left: Math.max(20, rect.left - modalWidth - 20)
            };
            break;
          case 'right':
            position = {
              top: Math.max(20, Math.min(viewportHeight - modalHeight - 20, rect.top + (rect.height / 2) - (modalHeight / 2))),
              left: Math.min(viewportWidth - modalWidth - 20, rect.right + 20)
            };
            break;
          default:
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        
        // Ensure the modal stays within viewport bounds
        if (position.top < 20 || position.left < 20 || 
            position.top + modalHeight > viewportHeight - 20 || 
            position.left + modalWidth > viewportWidth - 20) {
          return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        
        return position;
      }
    }
    
    // Default center position
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  };

  const modalPosition = getModalPosition();

  return (
    <>
      {/* Tutorial CSS */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 1000;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          border-radius: 8px !important;
          animation: tutorialPulse 2s infinite;
        }
        
        @keyframes tutorialPulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          }
        }
        
        .tutorial-overlay {
          pointer-events: none;
        }
        
        .tutorial-modal {
          pointer-events: auto;
        }
        
        /* Ensure tutorial modal appears above everything */
        .tutorial-modal {
          z-index: 9999 !important;
        }
      `}</style>

      {/* Dark Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[999] tutorial-overlay"
      />

      {/* Tutorial Modal */}
      <AnimatePresence>
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={modalPosition}
          className="fixed bg-gray-800 rounded-xl p-6 border border-gray-600 shadow-2xl z-[1000] tutorial-modal max-w-md w-full mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">{currentStep.title}</h3>
            </div>
            <button
              onClick={skipTutorial}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Step {currentStepIndex + 1} of {totalSteps}</span>
              <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-300 leading-relaxed">{currentStep.content}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <button
                onClick={skipTutorial}
                className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Skip Tutorial
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentStepIndex === totalSteps - 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
                  >
                    Complete Tutorial
                  </button>
                  <a
                    href="#"
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      // This could link to other tutorials in the future
                      alert('More tutorials coming soon! Combat training, team management, and more.');
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    More Tutorials
                  </a>
                </div>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold"
                >
                  {currentStep.nextButtonText || 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default Tutorial;