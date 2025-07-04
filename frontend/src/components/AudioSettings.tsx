'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Check,
  Mic,
  Music,
  Zap,
  User
} from 'lucide-react';
import { audioService, AudioSettings, VoiceProfile } from '@/services/audioService';

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioSettingsComponent({
  isOpen,
  onClose
}: AudioSettingsProps) {
  const [settings, setSettings] = useState<AudioSettings>(audioService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [testText] = useState("Welcome to the arena! This is a test of the battle announcer voice.");
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  const initializeAudio = useCallback(async () => {
    await audioService.waitForInitialization();
    const voices = audioService.getAvailableVoices();
    setAvailableVoices(voices);
    setSelectedVoice(settings.preferredVoice);
  }, [settings.preferredVoice]);

  useEffect(() => {
    if (isOpen) {
      initializeAudio();
    }
  }, [isOpen, initializeAudio]);

  const updateSetting = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    audioService.updateSettings({ [key]: value });
  };

  const resetToDefaults = () => {
    const defaultSettings: AudioSettings = {
      masterVolume: 0.8,
      voiceVolume: 0.7,
      sfxVolume: 0.6,
      musicVolume: 0.4,
      enableTTS: true,
      preferredVoice: null,
      speechRate: 1.0,
      speechPitch: 1.0
    };
    setSettings(defaultSettings);
    audioService.updateSettings(defaultSettings);
    setSelectedVoice(null);
  };

  const testVoice = async (voice?: VoiceProfile) => {
    if (isTestPlaying) {
      audioService.stopSpeaking();
      setIsTestPlaying(false);
      return;
    }

    setIsTestPlaying(true);
    
    await audioService.speak(testText, {
      voice: voice || undefined,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      volume: settings.voiceVolume,
      interrupt: true,
      onEnd: () => setIsTestPlaying(false),
      onError: () => setIsTestPlaying(false)
    });
  };

  const selectVoice = (voice: VoiceProfile | null) => {
    const voiceURI = voice?.voiceURI || null;
    setSelectedVoice(voiceURI);
    updateSetting('preferredVoice', voiceURI);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            Audio Settings
          </h1>
          <div className="flex gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all text-sm flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
            >
              Done
            </button>
          </div>
        </div>

        {/* Volume Controls */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-400" />
              Volume Controls
            </h2>
            
            <div className="space-y-4">
              {/* Master Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Master Volume
                  </label>
                  <span className="text-gray-400">{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.masterVolume}
                  onChange={(e) => updateSetting('masterVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Voice Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice & Announcer
                  </label>
                  <span className="text-gray-400">{Math.round(settings.voiceVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.voiceVolume}
                  onChange={(e) => updateSetting('voiceVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Sound Effects Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Sound Effects
                  </label>
                  <span className="text-gray-400">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.sfxVolume}
                  onChange={(e) => updateSetting('sfxVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Music Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Background Music
                  </label>
                  <span className="text-gray-400">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.musicVolume}
                  onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Text-to-Speech Settings */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-400" />
              Voice Settings
            </h2>

            {/* Enable TTS */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-white">Enable Voice Announcements</label>
              <button
                onClick={() => updateSetting('enableTTS', !settings.enableTTS)}
                className={`relative w-12 h-6 rounded-full transition-all ${
                  settings.enableTTS ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    settings.enableTTS ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {settings.enableTTS && (
              <>
                {/* Speech Rate */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white">Speech Rate</label>
                    <span className="text-gray-400">{settings.speechRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={(e) => updateSetting('speechRate', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Speech Pitch */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white">Speech Pitch</label>
                    <span className="text-gray-400">{settings.speechPitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.speechPitch}
                    onChange={(e) => updateSetting('speechPitch', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Voice Test */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white">Test Voice</label>
                    <button
                      onClick={() => testVoice()}
                      disabled={!settings.enableTTS}
                      className={`px-3 py-1 rounded-lg transition-all text-sm flex items-center gap-1 ${
                        isTestPlaying
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:opacity-50'
                      }`}
                    >
                      {isTestPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Test
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm">{testText}</p>
                </div>
              </>
            )}
          </div>

          {/* Voice Selection */}
          {settings.enableTTS && availableVoices.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-white mb-4">
                Voice Selection ({availableVoices.length} available)
              </h2>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Default/Auto option */}
                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedVoice === null
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }`}
                  onClick={() => selectVoice(null)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">Auto-Select</div>
                      <div className="text-gray-400 text-sm">Automatically choose the best voice</div>
                    </div>
                    {selectedVoice === null && (
                      <Check className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </div>

                {availableVoices.map((voice) => (
                  <div
                    key={voice.voiceURI}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedVoice === voice.voiceURI
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                    }`}
                    onClick={() => selectVoice(voice)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-semibold">{voice.name}</div>
                        <div className="text-gray-400 text-sm">
                          {voice.lang} • {voice.gender} • {voice.personality}
                          {voice.localService && ' • Local'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            testVoice(voice);
                          }}
                          className="p-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-all"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        {selectedVoice === voice.voiceURI && (
                          <Check className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
            <h3 className="text-blue-400 font-semibold mb-2">Audio Tips</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Voice announcements enhance the battle experience with real-time commentary</li>
              <li>• Adjust speech rate and pitch to find your preferred announcer style</li>
              <li>• Different voices may work better for different characters</li>
              <li>• Master volume affects all audio, while individual sliders control specific types</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}