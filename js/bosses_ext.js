// Skeleton King Boss extension file
import { Boss } from './bosses.js';
import { handlePlayerDamage } from './combat_utils.js';

export class SkeletonKingBoss extends Boss {
    constructor(x, y, weapon) {
        super(x, y, 'Skeleton King', 300, weapon);
        this.color = '#b0b0b0'; // Bone color
        this.speed = 120;
        this.projectileSpeed = 280;
        this.attackPatterns = ['clone', 'pie', 'tornado', 'minions'];
        this.currentAttackPattern = 0;
        this.clones = [];
        this.maxClones = 2;
        this.tornadoActive = false;
        this.tornadoX = 0;
        this.tornadoY = 0;
        this.tornadoLifetime = 0;
        this.minions = [];
        this.minionSpawnTime = 0;
        this.glowIntensity = 0.8;
        this.glowPulse = 0;
        this.crownColor = '#FFD700'; // Gold crown
        this.lastCloneDamageTime = null;
    }
    
    update(deltaTime, player, engine) {
        super.update(deltaTime, player, engine);
        
        // Glow pulse effect
        this.glowPulse += deltaTime * 2;
        if (this.glowPulse > Math.PI * 2) this.glowPulse = 0;
        this.glowIntensity = 0.5 + 0.3 * Math.sin(this.glowPulse);
        
        // Update clones
        for (let i = this.clones.length - 1; i >= 0; i--) {
            const clone = this.clones[i];
            clone.timeAlive += deltaTime;
            clone.opacity = Math.max(0, 1 - clone.timeAlive / clone.lifetime);
            
            // Fade out and remove
            if (clone.timeAlive >= clone.lifetime) {
                this.clones.splice(i, 1);
                continue;
            }
            
            // Move towards player
            const dx = player.x - clone.x;
            const dy = player.y - clone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 20) {
                clone.x += (dx / distance) * this.speed * 0.7 * deltaTime;
                clone.y += (dy / distance) * this.speed * 0.7 * deltaTime;
            }
            
            // Damage player on contact (only play sound once per second)
            if (engine.checkCollision({
                x: clone.x,
                y: clone.y,
                width: this.width,
                height: this.height
            }, player)) {
                // Use the new damage handler with knockback
                if (!player.isInvincible) {
                    handlePlayerDamage(player, clone, 5, engine);
                    this.clones.splice(i, 1);
                }
            }
        }
        
        // Update tornado
        if (this.tornadoActive) {
            // Move tornado towards player
            const dx = player.x - this.tornadoX;
            const dy = player.y - this.tornadoY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                this.tornadoX += (dx / distance) * 150 * deltaTime;
                this.tornadoY += (dy / distance) * 150 * deltaTime;
            }
            
            // Decrease tornado lifetime
            this.tornadoLifetime -= deltaTime;
            if (this.tornadoLifetime <= 0) {
                this.tornadoActive = false;
                // Stop tornado sound when it ends
                if (engine.audioManager) {
                    engine.audioManager.stop('tornado');
                }
            }
        }
        
        // Update minions
        for (let i = this.minions.length - 1; i >= 0; i--) {
            const minion = this.minions[i];
            minion.timeAlive += deltaTime;
            
            // Remove expired minions
            if (minion.timeAlive >= minion.lifetime) {
                this.minions.splice(i, 1);
                continue;
            }
            
            // Move towards player
            const dx = player.x - minion.x;
            const dy = player.y - minion.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                minion.x += (dx / distance) * 80 * deltaTime;
                minion.y += (dy / distance) * 80 * deltaTime;
            }
            
            // Damage player on contact with updated handling
            if (engine.checkCollision({
                x: minion.x,
                y: minion.y,
                width: 20,
                height: 30
            }, player)) {
                if (!player.isInvincible) {
                    handlePlayerDamage(player, minion, 10, engine);
                    this.minions.splice(i, 1);
                }
            }
        }
    }
    
    attack(player, engine) {
        // Cycle through attack patterns
        const attackType = this.attackPatterns[this.currentAttackPattern];
        this.currentAttackPattern = (this.currentAttackPattern + 1) % this.attackPatterns.length;
        
        // Play attack sound
        if (engine.audioManager) {
            engine.audioManager.play('skeletonAttack');
        }
        
        switch (attackType) {
            case 'clone':
                this.createClones(player, engine);
                break;
            case 'pie':
                this.throwPies(player, engine);
                break;
            case 'tornado':
                this.createTornado(player, engine);
                break;
            case 'minions':
                this.spawnMinions(player, engine);
                break;
        }
    }
    
    createClones(player, engine) {
        // Create ghost clones that chase the player
        const cloneCount = Math.min(this.maxClones, 1 + Math.floor(Math.random() * 2));
        
        for (let i = 0; i < cloneCount; i++) {
            // Position clones slightly offset from boss
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            
            this.clones.push({
                x: this.x + offsetX,
                y: this.y + offsetY,
                opacity: 1,
                timeAlive: 0,
                lifetime: 5 + Math.random() * 3
            });
        }
        
        // Play clone sound only once regardless of number of clones
        if (engine.audioManager) {
            engine.audioManager.play('ghostClone');
        }
    }
    
    throwPies(player, engine) {
        // Throw pies in multiple directions
        const pieCount = 5;
        
        for (let i = 0; i < pieCount; i++) {
            const angle = (i / pieCount) * Math.PI * 2;
            const vx = Math.cos(angle) * this.projectileSpeed;
            const vy = Math.sin(angle) * this.projectileSpeed;
            
            const projectile = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                width: 24,
                height: 24,
                damage: 15,
                speedX: vx,
                speedY: vy,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 10,
                update(deltaTime) {
                    this.x += this.speedX * deltaTime;
                    this.y += this.speedY * deltaTime;
                    this.rotation += this.rotationSpeed * deltaTime;
                },
                draw(ctx) {
                    // Draw pie
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    
                    // Pie tin
                    ctx.fillStyle = '#8b8b8b';
                    ctx.beginPath();
                    ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Pie filling
                    ctx.fillStyle = '#8b0000';
                    ctx.beginPath();
                    ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Pie crust pattern
                    ctx.strokeStyle = '#d2691e';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(10 * Math.cos(angle), 10 * Math.sin(angle));
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                }
            };
            
            engine.bossProjectiles.push(projectile);
        }
    }
    
    createTornado(player, engine) {
        this.tornadoActive = true;
        this.tornadoX = this.x;
        this.tornadoY = this.y;
        this.tornadoLifetime = 6; // 6 seconds
        
        // Play tornado sound only once at the start
        if (engine.audioManager) {
            // Stop any existing tornado sound first
            engine.audioManager.stop('tornado');
            engine.audioManager.play('tornado');
        }
    }
    
    spawnMinions(player, engine) {
        // Spawn mini zombies
        const minionCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < minionCount; i++) {
            // Position minions in a circle around boss
            const angle = (i / minionCount) * Math.PI * 2;
            const spawnDistance = 60;
            const spawnX = this.x + Math.cos(angle) * spawnDistance;
            const spawnY = this.y + Math.sin(angle) * spawnDistance;
            
            this.minions.push({
                x: spawnX,
                y: spawnY,
                timeAlive: 0,
                lifetime: 4 // 4 seconds
            });
        }
    }
    
    draw(ctx) {
        // Don't call super.draw to customize ghost effect
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 5, this.width/2, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw ghost glow effect
        const glowRadius = this.width * 0.8;
        const gradient = ctx.createRadialGradient(
            this.x + this.width/2, this.y + this.height/2, 0,
            this.x + this.width/2, this.y + this.height/2, glowRadius
        );
        gradient.addColorStop(0, `rgba(100, 200, 255, ${this.glowIntensity * 0.4})`);
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Translucent body
        ctx.globalAlpha = 0.7;
        
        // Draw skeleton body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 12, this.y + 25, 40, 35);
        
        // Draw skeleton ribcage
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + 32, this.y + 30 + i * 8);
            ctx.lineTo(this.x + 52, this.y + 30 + i * 8);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 12, this.y + 30 + i * 8);
            ctx.lineTo(this.x + 32, this.y + 30 + i * 8);
            ctx.stroke();
        }
        
        // Draw skull
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 17, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw crown
        ctx.fillStyle = this.crownColor;
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y + 8);
        ctx.lineTo(this.x + 25, this.y);
        ctx.lineTo(this.x + 32, this.y + 8);
        ctx.lineTo(this.x + 39, this.y);
        ctx.lineTo(this.x + 44, this.y + 8);
        ctx.lineTo(this.x + 20, this.y + 8);
        ctx.fill();
        
        // Draw eye sockets
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 6, this.y + 15, 4, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/2 + 6, this.y + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glowing eyes in sockets
        ctx.fillStyle = `rgba(0, 255, 255, ${this.glowIntensity})`;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 6, this.y + 15, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/2 + 6, this.y + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw teeth
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.rect(this.x + 26 + i * 3, this.y + 25, 2, 3);
        }
        ctx.fill();
        
        // Weapon (ghost scepter)
        ctx.fillStyle = `rgba(180, 180, 180, 0.8)`;
        if (this.direction === 'right') {
            ctx.fillRect(this.x + this.width, this.y + 30, 5, 25);
            
            // Scepter head
            ctx.fillStyle = `rgba(100, 200, 255, ${this.glowIntensity})`;
            ctx.beginPath();
            ctx.arc(this.x + this.width + 2.5, this.y + 30, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - 5, this.y + 30, 5, 25);
            
            // Scepter head
            ctx.fillStyle = `rgba(100, 200, 255, ${this.glowIntensity})`;
            ctx.beginPath();
            ctx.arc(this.x - 2.5, this.y + 30, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
        
        // Draw clones
        for (const clone of this.clones) {
            // Translucent ghost clone
            ctx.globalAlpha = clone.opacity * 0.5;
            
            // Draw skeleton body
            ctx.fillStyle = this.color;
            ctx.fillRect(clone.x + 12, clone.y + 25, 40, 35);
            
            // Draw skull
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(clone.x + this.width/2, clone.y + 17, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw crown
            ctx.fillStyle = this.crownColor;
            ctx.beginPath();
            ctx.moveTo(clone.x + 20, clone.y + 8);
            ctx.lineTo(clone.x + 25, clone.y);
            ctx.lineTo(clone.x + 32, clone.y + 8);
            ctx.lineTo(clone.x + 39, clone.y);
            ctx.lineTo(clone.x + 44, clone.y + 8);
            ctx.lineTo(clone.x + 20, clone.y + 8);
            ctx.fill();
            
            // Draw eye sockets
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(clone.x + this.width/2 - 6, clone.y + 15, 4, 0, Math.PI * 2);
            ctx.arc(clone.x + this.width/2 + 6, clone.y + 15, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw glowing eyes in sockets
            ctx.fillStyle = `rgba(0, 255, 255, ${this.glowIntensity})`;
            ctx.beginPath();
            ctx.arc(clone.x + this.width/2 - 6, clone.y + 15, 2, 0, Math.PI * 2);
            ctx.arc(clone.x + this.width/2 + 6, clone.y + 15, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
        
        // Draw tornado if active
        if (this.tornadoActive) {
            // Create gradient for tornado
            const tornadoGradient = ctx.createRadialGradient(
                this.tornadoX, this.tornadoY, 0,
                this.tornadoX, this.tornadoY, 50
            );
            tornadoGradient.addColorStop(0, 'rgba(139, 69, 19, 0.6)');
            tornadoGradient.addColorStop(0.7, 'rgba(139, 69, 19, 0.3)');
            tornadoGradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
            
            // Draw tornado base
            ctx.fillStyle = tornadoGradient;
            ctx.beginPath();
            ctx.arc(this.tornadoX, this.tornadoY, 50, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw spinning leaves and debris
            ctx.save();
            ctx.translate(this.tornadoX, this.tornadoY);
            
            // Generate tornado rotation angle based on time
            const tornadoAngle = performance.now() * 0.01;
            
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + tornadoAngle + i * 0.2;
                const radius = 5 + (i % 3) * 15;
                
                ctx.fillStyle = i % 3 === 0 ? '#228B22' : '#8B4513';
                ctx.save();
                ctx.translate(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius
                );
                ctx.rotate(angle);
                
                // Draw leaf or debris
                if (i % 3 === 0) {
                    // Leaf
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Debris/branch
                    ctx.fillRect(-5, -2, 10, 4);
                }
                
                ctx.restore();
            }
            ctx.restore();
        }
        
        // Draw minions
        for (const minion of this.minions) {
            // Draw mini zombie
            ctx.fillStyle = '#6c7743'; // Zombie color
            
            // Body
            ctx.fillRect(minion.x + 5, minion.y + 12, 10, 15);
            
            // Head
            ctx.beginPath();
            ctx.arc(minion.x + 10, minion.y + 8, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(minion.x + 8, minion.y + 7, 1.5, 0, Math.PI * 2);
            ctx.arc(minion.x + 12, minion.y + 7, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Arms
            ctx.fillStyle = '#6c7743';
            ctx.fillRect(minion.x + 2, minion.y + 12, 3, 8);
            ctx.fillRect(minion.x + 15, minion.y + 12, 3, 8);
        }
    }
}