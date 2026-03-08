import { applyBossStartEffects } from './boss_effects.js';

export class LevelManager {
    constructor(bosses) {
        this.bosses = bosses;
        this.currentLevel = 0;
        this.originalBosses = [...bosses]; // Keep a copy for reset
        this.onBossChange = null; // Callback for when boss changes
    }
    
    getCurrentBoss() {
        if (this.currentLevel < this.bosses.length) {
            return this.bosses[this.currentLevel];
        }
        return null;
    }
    
    startLevel() {
        this.currentLevel = 0;
        // Apply boss effects at level start
        const firstBoss = this.getCurrentBoss();
        if (firstBoss) {
            applyBossStartEffects(firstBoss);
        }
        
        if (this.onBossChange) {
            this.onBossChange(this.currentLevel);
        }
    }
    
    advanceLevel() {
        this.currentLevel++;
        
        // Apply boss effects to the new boss
        const newBoss = this.getCurrentBoss();
        if (newBoss) {
            applyBossStartEffects(newBoss);
        }
        
        if (this.onBossChange) {
            this.onBossChange(this.currentLevel);
        }
        return this.currentLevel < this.bosses.length;
    }
    
    reset() {
        // Reset all bosses and start from the first one
        this.currentLevel = 0;
        
        // Reset each boss's health
        for (let i = 0; i < this.bosses.length; i++) {
            this.bosses[i].health = this.bosses[i].maxHealth;
            this.bosses[i].x = 600;
            this.bosses[i].y = 300;
        }
        
        if (this.onBossChange) {
            this.onBossChange(this.currentLevel);
        }
    }
}