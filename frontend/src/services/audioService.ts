// Audio Service for _____ Wars
// Handles text-to-speech, sound effects, and audio management

export interface AudioSettings {
  masterVolume: number; // 0-1
  voiceVolume: number; // 0-1
  sfxVolume: number; // 0-1
  musicVolume: number; // 0-1
  enableTTS: boolean;
  preferredVoice: string | null;
  speechRate: number; // 0.1-10
  speechPitch: number; // 0-2
}

export interface VoiceProfile {
  name: string;
  voiceURI: string;
  lang: string;
  localService: boolean;
  gender?: 'male' | 'female' | 'neutral';
  personality?: 'heroic' | 'mysterious' | 'wise' | 'fierce' | 'calm';
}

export class AudioService {
  private static instance: AudioService;
  private settings: AudioSettings;
  private speechSynthesis: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;
  private audioContext: AudioContext | null = null;
  private backgroundMusicSource: AudioBufferSourceNode | null = null;
  private backgroundMusicGain: GainNode | null = null;

  private constructor() {
    this.settings = {
      masterVolume: 0.8,
      voiceVolume: 0.7,
      sfxVolume: 0.6,
      musicVolume: 0.4,
      enableTTS: true,
      preferredVoice: null,
      speechRate: 1.0,
      speechPitch: 1.0
    };

    // Initialize Web Speech API if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      this.initializeVoices();
    }
    
    // Initialize Web Audio API
    this.initializeAudioContext();
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private async initializeVoices(): Promise<void> {
    if (!this.speechSynthesis) return;

    // Wait for voices to be loaded
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.availableVoices = this.speechSynthesis!.getVoices();
        if (this.availableVoices.length > 0) {
          this.isInitialized = true;
          resolve();
        } else {
          // Some browsers load voices asynchronously
          setTimeout(loadVoices, 100);
        }
      };

      if (this.availableVoices.length === 0) {
        this.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        loadVoices();
      } else {
        this.isInitialized = true;
        resolve();
      }
    });
  }

  public async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;
    
    let attempts = 0;
    while (!this.isInitialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  public getAvailableVoices(): VoiceProfile[] {
    if (!this.speechSynthesis) return [];

    return this.availableVoices.map(voice => ({
      name: voice.name,
      voiceURI: voice.voiceURI,
      lang: voice.lang,
      localService: voice.localService,
      gender: this.inferGender(voice.name),
      personality: this.inferPersonality(voice.name)
    }));
  }

  private inferGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const lowerName = voiceName.toLowerCase();
    if (lowerName.includes('female') || lowerName.includes('woman') || lowerName.includes('lady')) {
      return 'female';
    }
    if (lowerName.includes('male') || lowerName.includes('man') || lowerName.includes('sir')) {
      return 'male';
    }
    // Common female voice names
    if (lowerName.includes('samantha') || lowerName.includes('victoria') || lowerName.includes('karen') || lowerName.includes('susan')) {
      return 'female';
    }
    // Common male voice names
    if (lowerName.includes('alex') || lowerName.includes('daniel') || lowerName.includes('fred') || lowerName.includes('tom')) {
      return 'male';
    }
    return 'neutral';
  }

  private inferPersonality(voiceName: string): 'heroic' | 'mysterious' | 'wise' | 'fierce' | 'calm' {
    const lowerName = voiceName.toLowerCase();
    if (lowerName.includes('dramatic') || lowerName.includes('strong') || lowerName.includes('bold')) {
      return 'heroic';
    }
    if (lowerName.includes('whisper') || lowerName.includes('soft') || lowerName.includes('breathy')) {
      return 'mysterious';
    }
    if (lowerName.includes('wise') || lowerName.includes('elder') || lowerName.includes('deep')) {
      return 'wise';
    }
    if (lowerName.includes('fast') || lowerName.includes('sharp') || lowerName.includes('intense')) {
      return 'fierce';
    }
    return 'calm';
  }

  public getBestVoiceForCharacter(character: {
    name: string;
    archetype?: string;
    personality?: { traits?: string[]; motivations?: string[] };
  }): VoiceProfile | null {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) return null;

    // Character-specific voice mapping
    const characterVoices: Record<string, (voices: VoiceProfile[]) => VoiceProfile | null> = {
      'Achilles': (voices) => voices.find(v => 
        v.gender === 'male' && (v.personality === 'heroic' || v.personality === 'fierce')
      ) || voices.find(v => v.gender === 'male'),
      
      'Merlin': (voices) => voices.find(v => 
        v.gender === 'male' && v.personality === 'wise'
      ) || voices.find(v => v.gender === 'male'),
      
      'Loki': (voices) => voices.find(v => 
        v.personality === 'mysterious' || v.personality === 'fierce'
      ) || voices.find(v => v.gender === 'male'),
      
      'Fenrir': (voices) => voices.find(v => 
        v.gender === 'male' && v.personality === 'fierce'
      ) || voices.find(v => v.gender === 'male'),
      
      'Cleopatra': (voices) => voices.find(v => 
        v.gender === 'female' && (v.personality === 'wise' || v.personality === 'heroic')
      ) || voices.find(v => v.gender === 'female')
    };

    const customSelector = characterVoices[character.name];
    if (customSelector) {
      const selected = customSelector(voices);
      if (selected) return selected;
    }

    // Fallback to archetype-based selection
    if (character.archetype) {
      const archetypeVoices: Record<string, string[]> = {
        'warrior': ['male', 'heroic', 'fierce'],
        'mage': ['neutral', 'wise', 'mysterious'],
        'trickster': ['neutral', 'mysterious', 'fierce'],
        'beast': ['male', 'fierce'],
        'leader': ['female', 'heroic', 'wise']
      };

      const preferences = archetypeVoices[character.archetype.toLowerCase()];
      if (preferences) {
        for (const pref of preferences) {
          const voice = voices.find(v => v.gender === pref || v.personality === pref);
          if (voice) return voice;
        }
      }
    }

    // Default to first available voice
    return voices[0] || null;
  }

  public async speak(
    text: string,
    options: {
      voice?: VoiceProfile | null;
      rate?: number;
      pitch?: number;
      volume?: number;
      interrupt?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    if (!this.speechSynthesis || !this.settings.enableTTS) {
      options.onError?.('Speech synthesis not available or disabled');
      return;
    }

    await this.waitForInitialization();

    // Stop current speech if interrupting
    if (options.interrupt && this.currentUtterance) {
      this.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    if (options.voice) {
      const voice = this.availableVoices.find(v => v.voiceURI === options.voice!.voiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    } else if (this.settings.preferredVoice) {
      const voice = this.availableVoices.find(v => v.voiceURI === this.settings.preferredVoice!);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set speech parameters
    utterance.rate = options.rate ?? this.settings.speechRate;
    utterance.pitch = options.pitch ?? this.settings.speechPitch;
    utterance.volume = (options.volume ?? this.settings.voiceVolume) * this.settings.masterVolume;

    // Set event handlers
    utterance.onstart = () => {
      this.currentUtterance = utterance;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      this.currentUtterance = null;
      options.onError?.(event.error);
    };

    this.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.speechSynthesis?.speaking || false;
  }

  public pauseSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.pause();
    }
  }

  public resumeSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.resume();
    }
  }

  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('warsAudioSettings', JSON.stringify(this.settings));
    }
  }

  public loadSettings(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warsAudioSettings');
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        } catch (error) {
          console.warn('Failed to load audio settings:', error);
        }
      }
    }
  }

  // Announcer-specific methods
  public async speakBattleAnnouncement(
    text: string,
    type: 'intro' | 'round' | 'action' | 'victory' | 'defeat' = 'action',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    const announcerSettings = this.getAnnouncerSettings(type);
    
    await this.speak(text, {
      ...announcerSettings,
      interrupt: true,
      onStart,
      onEnd,
      onError: (error) => console.warn('Announcer speech failed:', error)
    });
  }

  private getAnnouncerSettings(type: string) {
    const baseSettings = {
      rate: 1.0,
      pitch: 1.0,
      volume: this.settings.voiceVolume
    };

    switch (type) {
      case 'intro':
        return { ...baseSettings, rate: 0.9, pitch: 1.1 }; // Slower, higher for drama
      case 'round':
        return { ...baseSettings, rate: 1.1, pitch: 1.0 }; // Slightly faster
      case 'action':
        return { ...baseSettings, rate: 1.2, pitch: 0.9 }; // Fast and lower for excitement
      case 'victory':
        return { ...baseSettings, rate: 0.8, pitch: 1.2 }; // Slow and high for celebration
      case 'defeat':
        return { ...baseSettings, rate: 0.7, pitch: 0.8 }; // Slow and low for solemnity
      default:
        return baseSettings;
    }
  }

  // Character voice methods
  public async speakAsCharacter(
    text: string,
    character: { name: string; archetype?: string; personality?: { traits?: string[]; motivations?: string[] } },
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    const voice = this.getBestVoiceForCharacter(character);
    
    await this.speak(text, {
      voice,
      interrupt: false,
      onStart,
      onEnd,
      onError: (error) => console.warn(`Character speech failed for ${character.name}:`, error)
    });
  }

  // Initialize Web Audio API
  private initializeAudioContext(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create background music gain node
      this.backgroundMusicGain = this.audioContext.createGain();
      this.backgroundMusicGain.connect(this.audioContext.destination);
      this.backgroundMusicGain.gain.value = this.settings.musicVolume * this.settings.masterVolume;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private ensureAudioContext(): boolean {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    return this.audioContext !== null;
  }

  // Synthesized sound effect methods
  public playSoundEffect(effectName: string, volume?: number): void {
    if (!this.ensureAudioContext()) {
      console.log(`Playing sound effect: ${effectName} (Web Audio not available)`);
      return;
    }

    const effectVolume = (volume ?? this.settings.sfxVolume) * this.settings.masterVolume;
    
    try {
      switch (effectName) {
        case 'sword_slash':
          this.playSwordSlash(effectVolume);
          break;
        case 'magic_cast':
          this.playMagicCast(effectVolume);
          break;
        case 'critical_hit':
          this.playCriticalHit(effectVolume);
          break;
        case 'block':
          this.playBlock(effectVolume);
          break;
        case 'button_click':
          this.playButtonClick(effectVolume);
          break;
        case 'notification':
          this.playNotification(effectVolume);
          break;
        case 'character_select':
          this.playCharacterSelect(effectVolume);
          break;
        case 'victory':
          this.playVictory(effectVolume);
          break;
        case 'defeat':
          this.playDefeat(effectVolume);
          break;
        case 'level_up':
          this.playLevelUp(effectVolume);
          break;
        default:
          console.log(`Unknown sound effect: ${effectName}`);
      }
    } catch (error) {
      console.warn(`Failed to play sound effect ${effectName}:`, error);
    }
  }

  private playSwordSlash(volume: number): void {
    const context = this.audioContext!;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Create a "whoosh" sound
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(800, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  }

  private playMagicCast(volume: number): void {
    const context = this.audioContext!;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Create a magical "sparkle" sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.4);
  }

  private playCriticalHit(volume: number): void {
    const context = this.audioContext!;
    
    // Play multiple tones for impact
    for (let i = 0; i < 3; i++) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(150 - (i * 30), context.currentTime + (i * 0.05));
      
      gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime + (i * 0.05));
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2 + (i * 0.05));
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(context.currentTime + (i * 0.05));
      oscillator.stop(context.currentTime + 0.2 + (i * 0.05));
    }
  }

  private playBlock(volume: number): void {
    const context = this.audioContext!;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Create a "clang" sound
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(300, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(volume * 0.6, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.15);
  }

  private playButtonClick(volume: number): void {
    const context = this.audioContext!;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, context.currentTime);
    
    gainNode.gain.setValueAtTime(volume * 0.2, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }

  private playNotification(volume: number): void {
    const context = this.audioContext!;
    
    // Play a pleasant two-tone notification
    const frequencies = [523.25, 659.25]; // C5, E5
    
    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, context.currentTime + (index * 0.1));
      
      gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime + (index * 0.1));
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2 + (index * 0.1));
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(context.currentTime + (index * 0.1));
      oscillator.stop(context.currentTime + 0.2 + (index * 0.1));
    });
  }

  private playCharacterSelect(volume: number): void {
    const context = this.audioContext!;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(volume * 0.25, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  }

  private playVictory(volume: number): void {
    const context = this.audioContext!;
    
    // Play a victory fanfare
    const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    melody.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, context.currentTime + (index * 0.15));
      
      gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime + (index * 0.15));
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3 + (index * 0.15));
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(context.currentTime + (index * 0.15));
      oscillator.stop(context.currentTime + 0.3 + (index * 0.15));
    });
  }

  private playDefeat(volume: number): void {
    const context = this.audioContext!;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Low, sad tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, context.currentTime + 1.0);
    
    gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 1.2);
  }

  private playLevelUp(volume: number): void {
    const context = this.audioContext!;
    
    // Ascending arpeggios
    const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
    
    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, context.currentTime + (index * 0.1));
      
      gainNode.gain.setValueAtTime(volume * 0.35, context.currentTime + (index * 0.1));
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4 + (index * 0.1));
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(context.currentTime + (index * 0.1));
      oscillator.stop(context.currentTime + 0.4 + (index * 0.1));
    });
  }

  public playBackgroundMusic(trackName: string, volume?: number, loop?: boolean): void {
    if (!this.ensureAudioContext() || !this.backgroundMusicGain) {
      console.log(`Playing background music: ${trackName} (Web Audio not available)`);
      return;
    }

    // Stop current background music
    this.stopBackgroundMusic();
    
    const musicVolume = (volume ?? this.settings.musicVolume) * this.settings.masterVolume;
    this.backgroundMusicGain.gain.value = musicVolume;
    
    // For now, just log - in future this would load actual audio files
    console.log(`Playing background music: ${trackName} at volume ${musicVolume}, loop: ${loop}`);
    
    // Simple ambient background tone as placeholder
    try {
      const context = this.audioContext!;
      const oscillator = context.createOscillator();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(220, context.currentTime);
      
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(musicVolume * 0.1, context.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.backgroundMusicGain);
      
      oscillator.start(context.currentTime);
      
      if (loop) {
        // Keep reference for stopping
        this.backgroundMusicSource = oscillator;
      } else {
        oscillator.stop(context.currentTime + 30); // 30 second placeholder
      }
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusicSource) {
      try {
        this.backgroundMusicSource.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.backgroundMusicSource = null;
    }
  }
}

// Export singleton instance
export const audioService = AudioService.getInstance();

// React hook for using audio service
export function useAudioService() {
  return audioService;
}