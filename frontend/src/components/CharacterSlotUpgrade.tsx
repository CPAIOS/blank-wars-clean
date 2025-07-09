'use client';

import React, { useState, useEffect } from 'react';
import { Users, Coins, AlertCircle, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';

interface CharacterSlotUpgradeProps {
  currency: {
    coins: number;
    gems: number;
  };
  onCurrencyUpdate: (coins: number, gems: number) => void;
}

interface UpgradeResult {
  success: boolean;
  user?: {
    character_slot_capacity: number;
  };
  error?: string;
}

export default function CharacterSlotUpgrade({ currency, onCurrencyUpdate }: CharacterSlotUpgradeProps) {
  const { userProfile, updateUserProfile } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate upgrade cost based on current capacity
  const calculateUpgradeCost = (currentCapacity: number): number => {
    // Base cost: 5000, increases by 2500 for every 3 slots
    const tierMultiplier = Math.floor((currentCapacity - 12) / 3);
    return 5000 + (tierMultiplier * 2500);
  };

  const currentCapacity = userProfile?.character_slot_capacity || 12;
  const upgradeCost = calculateUpgradeCost(currentCapacity);
  const canAfford = currency.coins >= upgradeCost;

  const handleUpgrade = async () => {
    if (!canAfford || isUpgrading) return;

    setIsUpgrading(true);
    setError(null);

    try {
      const response = await apiClient.post<UpgradeResult>('/api/headquarters/upgrade-character-slots', {
        cost: upgradeCost
      });
      
      if (response.data.success && response.data.user) {
        // Update user profile with new capacity
        updateUserProfile({
          ...userProfile!,
          character_slot_capacity: response.data.user.character_slot_capacity
        });

        // Update currency
        onCurrencyUpdate(currency.coins - upgradeCost, currency.gems);

        // Show success animation
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(response.data.error || 'Upgrade failed');
      }
    } catch (err: any) {
      console.error('Error upgrading character slots:', err);
      setError(err.response?.data?.error || 'Failed to upgrade character slots');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Character Slot Capacity
      </h2>
      
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-600/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Expand Your Roster</h3>
            <p className="text-gray-400 text-sm">
              Increase your character collection capacity to own more fighters
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">
              {currentCapacity}
            </div>
            <div className="text-xs text-gray-400">Current Slots</div>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Next Upgrade</span>
            <span className="text-white font-semibold flex items-center gap-1">
              <Plus className="w-4 h-4" />3 Slots
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300">Cost</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                {upgradeCost.toLocaleString()}
              </span>
              <Coins className={`w-4 h-4 ${canAfford ? 'text-yellow-400' : 'text-red-400'}`} />
            </div>
          </div>
          
          <button
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
              canAfford 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canAfford || isUpgrading}
            onClick={handleUpgrade}
          >
            <AnimatePresence mode="wait">
              {isUpgrading ? (
                <motion.div
                  key="upgrading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Upgrading...
                </motion.div>
              ) : (
                <motion.div
                  key="upgrade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Upgrade Character Capacity
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-3"
            >
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Success!</span>
                <span className="text-sm">Character capacity increased to {currentCapacity}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3"
            >
              <div className="flex items-center gap-2 text-red-400">
                <X className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-xs text-gray-400 text-center">
          <AlertCircle className="w-3 h-3 inline mr-1" />
          Character slots determine how many unique fighters you can own
        </div>

        {/* Progress Bar to Next Milestone */}
        {currentCapacity < 99 && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Progress to Elite Collector</span>
              <span>{currentCapacity} / 30 slots</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((currentCapacity / 30) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}