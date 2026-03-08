// Boss transition module - handles transitions between boss battles
import { healPlayerAfterBossFight } from './boss_effects.js';

export class TransitionManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d');
        this.isActive = false;
        this.currentPhase = 'none';
        this.phaseTime = 0;
        this.currentBoss = null;
        this.nextBoss = null;
        this.engine = null;
        this.levelManager = null;
        this.explosionParticles = [];
        this.announceLetters = [];
        this.vsCardPosition = 0;
        this.glowEffect = 0;
    }
    
    startBossTransition(defeatedBoss, levelManager) {
        this.isActive = true;
        this.currentPhase = 'explosion';
        this.phaseTime = 0;
        this.currentBoss = defeatedBoss;
        this.levelManager = levelManager;
        
        // Check if there is a next boss 
        const nextBossIndex = levelManager.currentLevel + 1;
        if (nextBossIndex < levelManager.bosses.length) {
            this.nextBoss = levelManager.bosses[nextBossIndex];
        } else {
            this.nextBoss = null;
        }
        
        // Create explosion particles at the boss position
        this.createExplosionParticles();
    }
    
    createExplosionParticles() {
        const centerX = this.currentBoss.x + this.currentBoss.width / 2;
        const centerY = this.currentBoss.y + this.currentBoss.height / 2;
        
        // Create 100 particles for a big explosion
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 200;
            const size = 3 + Math.random() * 12;
            const lifetime = 0.5 + Math.random() * 1.5;
            
            this.explosionParticles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: this.getRandomExplosionColor(),
                lifetime: lifetime,
                timeAlive: 0
            });
        }
    }
    
    getRandomExplosionColor() {
        const colors = [
            '#FF4500', // Red-orange
            '#FF8C00', // Dark orange
            '#FFD700', // Gold
            '#FFFF00', // Yellow
            '#FFA07A', // Light salmon
            '#FF6347'  // Tomato
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createAnnouncementText() {
        const text = "A NEW BOSS HAS APPEARED!";
        this.announceLetters = [];
        
        for (let i = 0; i < text.length; i++) {
            this.announceLetters.push({
                char: text[i],
                x: this.width / 2 - (text.length * 16) / 2 + i * 16,
                y: this.height / 2,
                originalY: this.height / 2,
                vx: 0,
                vy: -50 - Math.random() * 30,
                offsetX: Math.random() * 4 - 2,
                offsetY: Math.random() * 4 - 2,
                scale: 1,
                rotation: (Math.random() - 0.5) * 0.2,
                alpha: 0,
                targetAlpha: 1,
                fireIntensity: Math.random() * 0.5 + 0.5
            });
        }
    }
    
    update(deltaTime) {
        this.phaseTime += deltaTime;
        
        switch (this.currentPhase) {
            case 'explosion':
                // Update explosion particles
                for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
                    const particle = this.explosionParticles[i];
                    particle.x += particle.vx * deltaTime;
                    particle.y += particle.vy * deltaTime;
                    particle.timeAlive += deltaTime;
                    
                    // Remove expired particles
                    if (particle.timeAlive >= particle.lifetime) {
                        this.explosionParticles.splice(i, 1);
                    }
                }
                
                // After 1 second, transition to the announcement phase
                if (this.phaseTime >= 1.0 && this.nextBoss) {
                    // Heal player after defeating a boss
                    if (this.engine && this.engine.player) {
                        const healAmount = healPlayerAfterBossFight(this.engine.player);
                        if (this.engine.uiManager) {
                            this.engine.uiManager.updateHealthBar(this.engine.player.health);
                            // Show healing effect
                            this.engine.uiManager.showHealEffect(healAmount);
                        }
                    }
                    
                    this.currentPhase = 'announce';
                    this.phaseTime = 0;
                    this.createAnnouncementText();
                } else if (this.phaseTime >= 1.0 && !this.nextBoss) {
                    // If there's no next boss, we've won the game
                    this.isActive = false;
                    if (this.engine) {
                        this.engine.handleBossDefeat();
                    }
                }
                break;
                
            case 'announce':
                // Update announcement letters
                for (const letter of this.announceLetters) {
                    // Update alpha
                    if (letter.alpha < letter.targetAlpha) {
                        letter.alpha = Math.min(letter.alpha + deltaTime * 4, letter.targetAlpha);
                    }
                    
                    // Update position based on velocity
                    letter.y += letter.vy * deltaTime;
                    
                    // Slow down the letters
                    letter.vy *= 0.95;
                    
                    // Bounce when they get too high
                    if (letter.y < letter.originalY - 20) {
                        letter.vy = Math.abs(letter.vy) * 0.5;
                    }
                    
                    // Apply some random movement
                    letter.offsetX = Math.sin(this.phaseTime * 5 + Math.random()) * 2;
                    letter.offsetY = Math.cos(this.phaseTime * 5 + Math.random()) * 2;
                }
                
                // After 2 seconds, transition to VS screen
                if (this.phaseTime >= 2.0) {
                    this.currentPhase = 'versus';
                    this.phaseTime = 0;
                    this.vsCardPosition = -this.width / 2;
                }
                break;
                
            case 'versus':
                // Animate VS card sliding in
                if (this.vsCardPosition < 0) {
                    this.vsCardPosition += 1500 * deltaTime;
                    if (this.vsCardPosition > 0) {
                        this.vsCardPosition = 0;
                    }
                }
                
                // Pulse glow effect
                this.glowEffect = Math.sin(this.phaseTime * 5) * 0.3 + 0.7;
                
                // After 2 seconds, end transition and actually advance the level
                if (this.phaseTime >= 2.0) {
                    this.isActive = false;
                    
                    // Actually advance the level here
                    if (this.levelManager) {
                        // First advance the level in the level manager
                        const hasNextBoss = this.levelManager.advanceLevel();
                        
                        // Then notify the engine to complete the boss defeat processing
                        if (this.engine) {
                            if (hasNextBoss) {
                                // Reset projectiles if there's another boss
                                this.engine.projectiles = [];
                                this.engine.bossProjectiles = [];
                                this.engine.player.restoreArrows(5);
                                this.engine.uiManager.updateArrowCount(this.engine.player.arrows);
                            } else {
                                // Victory if no more bosses
                                this.engine.endGame(true);
                            }
                        }
                    }
                }
                break;
        }
    }
    
    render(ctx) {
        // Start with a clear canvas
        ctx.fillStyle = '#f5e8c9';  // Old paper color
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw appropriate transition content based on current phase
        switch (this.currentPhase) {
            case 'explosion':
                this.renderExplosion(ctx);
                break;
                
            case 'announce':
                this.renderAnnouncement(ctx);
                break;
                
            case 'versus':
                this.renderVersusScreen(ctx);
                break;
        }
    }
    
    renderExplosion(ctx) {
        // Draw each explosion particle
        for (const particle of this.explosionParticles) {
            const alpha = 1 - (particle.timeAlive / particle.lifetime);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset global alpha
        ctx.globalAlpha = 1;
        
        // Draw defeated boss name and "DEFEATED" text
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#442205';
        ctx.fillText(`${this.currentBoss.name} DEFEATED!`, this.width / 2, this.height / 2);
    }
    
    renderAnnouncement(ctx) {
        // Draw fire effect background
        this.renderFireBackground(ctx);
        
        // Draw each letter with fire effect
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (const letter of this.announceLetters) {
            ctx.save();
            ctx.translate(letter.x + letter.offsetX, letter.y + letter.offsetY);
            ctx.rotate(letter.rotation);
            ctx.scale(letter.scale, letter.scale);
            
            // Draw fire effect under letter
            this.renderLetterFire(ctx, letter);
            
            // Draw letter
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 255, 255, ${letter.alpha})`;
            ctx.fillText(letter.char, 0, 0);
            
            // Add outer glow
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = `rgba(255, 200, 100, ${letter.alpha * 0.6})`;
            ctx.fillText(letter.char, 2, 2);
            ctx.fillText(letter.char, -2, -2);
            
            ctx.restore();
        }
    }
    
    renderLetterFire(ctx, letter) {
        // Draw flame effect under each letter
        const flickerIntensity = letter.fireIntensity * (0.7 + 0.3 * Math.sin(this.phaseTime * 10 + letter.x));
        
        const gradient = ctx.createRadialGradient(
            0, 5, 0,
            0, 5, 15
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 100, ${flickerIntensity * letter.alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${flickerIntensity * 0.8 * letter.alpha})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 5, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderFireBackground(ctx) {
        // Create a fiery background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#800000');   // Dark red at top
        gradient.addColorStop(0.5, '#B22222'); // Firebrick
        gradient.addColorStop(1, '#FF4500');   // Orange-red at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Add random fire particles
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.width;
            const y = this.height - (Math.random() * this.height * 0.3);
            const size = 20 + Math.random() * 40;
            
            const flickerIntensity = 0.5 + 0.5 * Math.sin(this.phaseTime * 10 + i);
            
            const particleGradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, size
            );
            
            particleGradient.addColorStop(0, `rgba(255, 255, 100, ${flickerIntensity * 0.6})`);
            particleGradient.addColorStop(0.5, `rgba(255, 100, 0, ${flickerIntensity * 0.4})`);
            particleGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderVersusScreen(ctx) {
        // Draw background
        const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
        gradient.addColorStop(0, '#800000');  // Dark red
        gradient.addColorStop(0.5, '#442205'); // Brown
        gradient.addColorStop(1, '#000000');  // Black
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw boss character card
        this.renderBossCard(ctx);
        
        // Draw "VS" text
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow to VS text
        const glowRadius = 10 * this.glowEffect;
        ctx.shadowColor = 'rgba(255, 200, 0, 0.8)';
        ctx.shadowBlur = glowRadius;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = '#FFD700';  // Gold
        ctx.fillText('VS', this.width / 2, this.height / 2);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Draw boss name
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(this.nextBoss.name, this.width / 2, this.height - 100);
    }
    
    renderBossCard(ctx) {
        // Create boss showcase area
        const cardWidth = this.width * 0.7;
        const cardHeight = this.height * 0.6;
        const cardX = this.width / 2 - cardWidth / 2 + this.vsCardPosition;
        const cardY = this.height / 2 - cardHeight / 2;
        
        // Card background
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        
        // Card border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 5;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        
        // Draw boss (larger than normal)
        const bossScale = 2;
        const bossCenterX = cardX + cardWidth / 2;
        const bossCenterY = cardY + cardHeight / 2;
        
        // Save context for boss drawing
        ctx.save();
        ctx.translate(bossCenterX, bossCenterY);
        ctx.scale(bossScale, bossScale);
        
        // Draw the boss centered (adjusting for the boss's size)
        if (this.nextBoss) {
            const originalX = this.nextBoss.x;
            const originalY = this.nextBoss.y;
            
            // Temporarily position the boss at the origin for drawing
            this.nextBoss.x = -this.nextBoss.width / 2;
            this.nextBoss.y = -this.nextBoss.height / 2;
            
            // Draw boss
            this.nextBoss.draw(ctx);
            
            // Restore boss position
            this.nextBoss.x = originalX;
            this.nextBoss.y = originalY;
        }
        
        ctx.restore();
        
        // Add glow effect to the card
        ctx.save();
        ctx.globalAlpha = 0.3 * this.glowEffect;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 10;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        ctx.restore();
    }
}