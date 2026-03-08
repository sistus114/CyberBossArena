export class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.7;
        this.enabled = true;
        this.activeContexts = [];
        
        // Load all game sounds
        this.loadSounds();
    }
    
    loadSounds() {
        // Create audio contexts and buffer sources for each sound
        this.sounds = {
            // UI sounds
            menuClick: this.createSound([0.0, 0.05, 0.1, 0.05, 0.0], 0.2, 'sine'),
            menuHover: this.createSound([0.0, 0.05, 0.03, 0.0], 0.1, 'sine'),
            
            // Player sounds
            arrowShoot: this.createSound([0.0, 0.1, 0.2, 0.0, -0.1], 0.2, 'triangle'),
            playerHurt: this.createSound([0.3, 0.2, 0.1, 0.0, -0.1, -0.2], 0.3, 'sine'),
            playerDeath: this.createSound([0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3], 0.7, 'sine'),
            reloadStart: this.createSound([0.0, 0.1, 0.2, 0.1, 0.0], 0.3, 'sine'),
            reloadComplete: this.createSound([0.0, 0.1, 0.2, 0.3, 0.2, 0.1], 0.3, 'sine'),
            
            // Boss sounds
            bossDamage: this.createSound([0.0, -0.1, -0.15, -0.1, 0.0], 0.3, 'sine'),
            bossDefeat: this.createSound([0.3, 0.2, 0.1, 0.0, 0.1, 0.2, 0.3, 0.4], 0.8, 'sine'),
            
            // Goblin boss
            goblinAttack: this.createSound([0.0, 0.1, 0.0, -0.1], 0.3, 'triangle'),
            
            // Zombie boss
            zombieAttack: this.createSound([0.0, -0.1, -0.2, -0.1, 0.0], 0.4, 'sine'),
            
            // Chicken boss
            chickenAttack: this.createSound([0.3, 0.2, 0.1, 0.2, 0.1, 0.0], 0.3, 'sine'),
            
            // Skeleton King boss
            skeletonAttack: this.createSound([0.0, 0.1, 0.0, -0.1, 0.0], 0.4, 'sine'),
            ghostClone: this.createSound([0.0, 0.1, 0.0, -0.1, 0.0], 0.4, 'sine'),
            tornado: this.createSound([0, 0.1, 0.0, -0.1, 0], 0.4, 'sine', false)
        };
    }
    
    createSound(waveform, duration, type = 'sine', isLooping = false) {
        return {
            waveform: waveform,
            duration: duration,
            type: type,
            isLooping: isLooping,
            isPlaying: false,
            startTime: 0,
            audioContext: null,
            gainNode: null,
            oscillator: null,
            id: null
        };
    }
    
    play(soundName) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound) return;
        
        try {
            // Generate a unique ID for this sound instance
            const id = Date.now() + Math.random();
            
            // Create new audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            const oscillator = audioContext.createOscillator();
            
            // Cleanup previous playing instances if there are too many
            if (this.activeContexts.length > 20) {
                const oldestContext = this.activeContexts.shift();
                try {
                    if (oldestContext.oscillator) oldestContext.oscillator.stop();
                    if (oldestContext.context) oldestContext.context.close();
                } catch (e) {
                    // Ignore errors when closing old contexts
                }
            }
            
            // Track active context
            this.activeContexts.push({
                id,
                context: audioContext,
                oscillator,
                sound: soundName
            });
            
            // Set up oscillator with the specified type
            oscillator.type = sound.type;
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set volume
            gainNode.gain.value = this.volume * 0.5; // Reduced volume to be less harsh
            
            // Create waveform effect with smoother transitions
            const now = audioContext.currentTime;
            
            // Add attack and release envelope for smoother sound
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.02); // Quick fade in
            
            // Schedule frequency changes based on waveform with smoother transitions
            const stepTime = sound.duration / sound.waveform.length;
            sound.waveform.forEach((freq, i) => {
                const pitch = 220 * Math.pow(2, freq);
                if (i === 0) {
                    oscillator.frequency.setValueAtTime(pitch, now);
                } else {
                    oscillator.frequency.linearRampToValueAtTime(pitch, now + i * stepTime);
                }
            });
            
            // Start the oscillator
            oscillator.start(now);
            
            // Smooth fade out at the end
            gainNode.gain.linearRampToValueAtTime(0, now + sound.duration);
            
            // Stop the oscillator after duration (for non-looping sounds)
            if (!sound.isLooping) {
                oscillator.stop(now + sound.duration + 0.05); // Add slight buffer for fade out
                
                // Remove from active contexts when complete
                oscillator.onended = () => {
                    this.activeContexts = this.activeContexts.filter(ctx => ctx.id !== id);
                    try {
                        audioContext.close();
                    } catch (e) {
                        // Ignore errors when closing context
                    }
                };
            }
            
            return { id, oscillator, audioContext, soundName };
        } catch (e) {
            console.error("Audio error:", e);
            return null;
        }
    }
    
    stop(soundName) {
        if (!soundName) {
            // Stop all sounds
            this.activeContexts.forEach(ctx => {
                try {
                    if (ctx.oscillator) ctx.oscillator.stop();
                    if (ctx.context) ctx.context.close();
                } catch (e) {
                    // Ignore errors when stopping
                }
            });
            this.activeContexts = [];
            return;
        }
        
        // Try to stop specific sound
        const sound = this.sounds[soundName];
        if (!sound) return;
        
        // Match all active contexts for this sound type and stop them
        this.activeContexts.forEach(ctx => {
            try {
                if (ctx.sound === soundName) {
                    ctx.oscillator.stop();
                    ctx.context.close();
                }
            } catch (e) {
                // Ignore errors when stopping
            }
        });
        
        this.activeContexts = this.activeContexts.filter(ctx => ctx.sound !== soundName);
    }
    
    setVolume(volume) {
        this.volume = volume;
        
        // Update volume for any currently playing sounds
        this.activeContexts.forEach(ctx => {
            try {
                const gainNode = ctx.context.createGain();
                if (gainNode) {
                    gainNode.gain.value = this.volume * 0.5;
                }
            } catch (e) {
                // Ignore errors when changing volume
            }
        });
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        
        // Stop all sounds if disabled
        if (!enabled) {
            this.stop();
        }
    }
    
    // Clean up when game ends or page unloads
    cleanup() {
        this.stop();
    }
}