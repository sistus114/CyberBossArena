// Special victory sequence for the final boss
import { TransitionManager } from './transitions.js';

export class VictorySequence {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.isActive = false;
        this.phase = 'none';
        this.phaseTime = 0;
        this.boss = null;
        this.shakeAmount = 0;
        this.textBubble = null;
        this.explosionParticles = [];
        this.townspeople = [];
        this.message = '';
    }
    
    startVictorySequence(boss) {
        this.isActive = true;
        this.phase = 'shake';
        this.phaseTime = 0;
        this.boss = boss;
        this.shakeAmount = 0;
        this.textBubble = {
            text: "NOOOoooOOoOo",
            x: boss.x + boss.width/2,
            y: boss.y - 20,
            width: 150,
            height: 40,
            opacity: 0
        };
        
        // Generate townspeople for the victory screen
        this.generateTownspeople();
    }
    
    generateTownspeople() {
        this.townspeople = [];
        const colors = ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3'];
        const count = 12;
        
        for (let i = 0; i < count; i++) {
            this.townspeople.push({
                x: 100 + (i % 6) * 120,
                y: this.height - 100 - (Math.floor(i / 6) * 60),
                color: colors[Math.floor(Math.random() * colors.length)],
                armAngle: Math.random() * Math.PI,
                armSpeed: 3 + Math.random() * 2,
                yOffset: 0,
                jumpSpeed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    createExplosion() {
        if (!this.boss) return;
        
        const centerX = this.boss.x + this.boss.width / 2;
        const centerY = this.boss.y + this.boss.height / 2;
        
        // Create 200 particles for an extra big explosion
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 300;
            const size = 5 + Math.random() * 20;
            const lifetime = 1.0 + Math.random() * 2.0;
            
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
            '#FF6347', // Tomato
            '#00FFFF', // Cyan (ghost color)
            '#00CED1'  // Dark turquoise (ghost color)
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(deltaTime) {
        this.phaseTime += deltaTime;
        
        switch (this.phase) {
            case 'shake':
                // Increase shake amount
                this.shakeAmount = Math.min(10, this.shakeAmount + deltaTime * 30);
                
                // Fade in text bubble
                if (this.textBubble) {
                    this.textBubble.opacity = Math.min(1, this.textBubble.opacity + deltaTime * 2);
                }
                
                // After 2 seconds, move to final words
                if (this.phaseTime >= 2.0) {
                    this.phase = 'finalWords';
                    this.phaseTime = 0;
                    if (this.textBubble) {
                        this.textBubble.text = "IVE BEEN GHOSSSssssSsSsSssTTTTED!!!!!!";
                        this.textBubble.width = 220;
                    }
                }
                break;
                
            case 'finalWords':
                // After 1 second, explode
                if (this.phaseTime >= 1.0) {
                    this.phase = 'explosion';
                    this.phaseTime = 0;
                    this.createExplosion();
                    if (this.engine && this.engine.audioManager) {
                        this.engine.audioManager.play('bossDefeat');
                    }
                }
                break;
                
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
                
                // If all particles are gone or after 2 seconds, show victory
                if (this.explosionParticles.length === 0 || this.phaseTime >= 2.0) {
                    this.phase = 'victory';
                    this.phaseTime = 0;
                    this.message = 'YOU WIN!';
                }
                break;
                
            case 'victory':
                // Animate victory message and townspeople
                for (const person of this.townspeople) {
                    person.armAngle += person.armSpeed * deltaTime;
                    person.yOffset = Math.sin(this.phaseTime * person.jumpSpeed * 5) * 10;
                }
                
                // After 1.5 seconds, show the full message
                if (this.phaseTime >= 1.5 && this.message === 'YOU WIN!') {
                    this.message = 'YOU WIN!\nYou saved the world from these monsters...';
                }
                
                // After 5 seconds total, end the sequence and show the game over screen
                if (this.phaseTime >= 5.0) {
                    this.isActive = false;
                    if (this.engine) {
                        this.engine.endGame(true);
                    }
                }
                break;
        }
    }
    
    render(ctx) {
        // Clear canvas with background color
        ctx.fillStyle = '#f5e8c9';
        ctx.fillRect(0, 0, this.width, this.height);
        
        switch (this.phase) {
            case 'shake':
            case 'finalWords':
                // Draw background
                this.engine.drawPaperTexture();
                this.engine.drawGrid();
                
                // Apply night shader
                if (this.engine.nightMode) {
                    this.engine.applyNightShader();
                }
                
                // Draw player with torch
                if (this.engine.player) {
                    this.engine.player.draw(ctx);
                }
                
                // Draw boss with shake effect
                if (this.boss) {
                    ctx.save();
                    const shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
                    const shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;
                    ctx.translate(shakeX, shakeY);
                    this.boss.draw(ctx);
                    ctx.restore();
                }
                
                // Draw text bubble
                if (this.textBubble) {
                    ctx.globalAlpha = this.textBubble.opacity;
                    
                    // Speech bubble background
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    
                    // Rounded rectangle
                    const x = this.textBubble.x - this.textBubble.width/2;
                    const y = this.textBubble.y - this.textBubble.height/2;
                    const width = this.textBubble.width;
                    const height = this.textBubble.height;
                    const radius = 10;
                    
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + width - radius, y);
                    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                    ctx.lineTo(x + width, y + height - radius);
                    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                    ctx.lineTo(x + radius, y + height);
                    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    
                    // Tail of speech bubble
                    ctx.beginPath();
                    ctx.moveTo(this.textBubble.x, this.textBubble.y + this.textBubble.height/2);
                    ctx.lineTo(this.textBubble.x - 10, this.textBubble.y + this.textBubble.height/2 + 15);
                    ctx.lineTo(this.textBubble.x + 10, this.textBubble.y + this.textBubble.height/2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    
                    // Text
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 16px "Courier New", monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(this.textBubble.text, this.textBubble.x, this.textBubble.y);
                    
                    ctx.globalAlpha = 1;
                }
                
                // Apply bloom if needed
                if (this.engine.nightMode && this.engine.bloomEnabled) {
                    this.engine.applyBloomEffect();
                }
                break;
                
            case 'explosion':
                // Draw background
                this.engine.drawPaperTexture();
                this.engine.drawGrid();
                
                // Apply night shader
                if (this.engine.nightMode) {
                    this.engine.applyNightShader();
                }
                
                // Draw player
                if (this.engine.player) {
                    this.engine.player.draw(ctx);
                }
                
                // Draw explosion particles
                for (const particle of this.explosionParticles) {
                    const alpha = 1 - (particle.timeAlive / particle.lifetime);
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = particle.color;
                    
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.globalAlpha = 1;
                
                // Apply bloom if needed
                if (this.engine.nightMode && this.engine.bloomEnabled) {
                    this.engine.applyBloomEffect();
                }
                break;
                
            case 'victory':
                // Victory screen with gradient background
                const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#4b6cb7');   // Blue
                gradient.addColorStop(1, '#182848');   // Dark blue
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, this.width, this.height);
                
                // Draw victory message
                ctx.fillStyle = '#FFD700';  // Gold
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 48px "Courier New", monospace';
                
                // Add glow effect
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 15;
                
                // Draw main title on top
                const lines = this.message.split('\n');
                ctx.fillText(lines[0], this.width/2, 150);
                
                // Draw subtitle if present
                if (lines.length > 1) {
                    ctx.font = 'bold 24px "Courier New", monospace';
                    ctx.fillText(lines[1], this.width/2, 220);
                }
                
                // Reset shadow
                ctx.shadowBlur = 0;
                
                // Draw townspeople cheering
                for (const person of this.townspeople) {
                    // Draw person
                    ctx.fillStyle = person.color;
                    
                    // Body
                    ctx.fillRect(person.x - 10, person.y - 30 + person.yOffset, 20, 30);
                    
                    // Head
                    ctx.beginPath();
                    ctx.arc(person.x, person.y - 40 + person.yOffset, 10, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Eyes
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(person.x - 3, person.y - 42 + person.yOffset, 2, 0, Math.PI * 2);
                    ctx.arc(person.x + 3, person.y - 42 + person.yOffset, 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Mouth
                    ctx.beginPath();
                    ctx.arc(person.x, person.y - 36 + person.yOffset, 5, 0, Math.PI, false);
                    ctx.stroke();
                    
                    // Arms
                    ctx.fillStyle = person.color;
                    
                    // Calculate arm positions based on animation
                    const leftArmX = person.x - 10;
                    const rightArmX = person.x + 10;
                    const armY = person.y - 25 + person.yOffset;
                    
                    // Draw moving arms
                    ctx.save();
                    
                    // Left arm
                    ctx.translate(leftArmX, armY);
                    ctx.rotate(-Math.abs(Math.sin(person.armAngle)) * Math.PI/2);
                    ctx.fillRect(0, 0, 5, 15);
                    ctx.restore();
                    
                    // Right arm
                    ctx.save();
                    ctx.translate(rightArmX, armY);
                    ctx.rotate(Math.abs(Math.sin(person.armAngle)) * Math.PI/2);
                    ctx.fillRect(-5, 0, 5, 15);
                    ctx.restore();
                }
                
                break;
        }
    }
}