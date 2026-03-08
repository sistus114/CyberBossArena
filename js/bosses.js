export class Boss {
    constructor(x, y, name, health, weapon) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.name = name;
        this.health = health;
        this.maxHealth = health;
        this.speed = 100;
        this.weapon = weapon;
        this.attackCooldown = 2000; // ms
        this.lastAttack = 0;
        this.direction = 'left';
        this.isAttacking = false;
        
        // AI pattern
        this.state = 'chase'; // chase, attack, retreat
        this.targetX = x;
        this.targetY = y;
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 3;
        this.fps = 8;
        this.frameTimer = 0;
        this.frameInterval = 1000/this.fps;
        this.attackAnimationTime = 0;
        this.attackAnimationDuration = 500; // ms
    }
    
    update(deltaTime, player, engine) {
        // Animation update
        if (this.frameTimer > this.frameInterval) {
            this.frameX = (this.frameX + 1) % this.maxFrame;
            this.frameTimer = 0;
        } else {
            this.frameTimer += deltaTime * 1000;
        }
        
        // Attack cooldown check
        if (Date.now() - this.lastAttack > this.attackCooldown) {
            this.attack(player, engine);
            this.lastAttack = Date.now();
            this.isAttacking = true;
            this.attackAnimationTime = 0;
        }
        
        // Update attack animation
        if (this.isAttacking) {
            this.attackAnimationTime += deltaTime * 1000;
            if (this.attackAnimationTime >= this.attackAnimationDuration) {
                this.isAttacking = false;
            }
        }
        
        // Determine state based on health
        if (this.health < this.maxHealth * 0.3) {
            this.state = Math.random() > 0.7 ? 'retreat' : 'chase';
        } else if (this.health < this.maxHealth * 0.7) {
            this.state = Math.random() > 0.5 ? 'attack' : 'chase';
        } else {
            this.state = 'chase';
        }
        
        // Update based on state
        if (this.state === 'chase') {
            this.chasePlayer(deltaTime, player);
        } else if (this.state === 'retreat') {
            this.retreat(deltaTime, player, engine.width, engine.height);
        } else if (this.state === 'attack') {
            // Attack is handled by the attack method
        }
        
        // Update direction
        if (player.x < this.x) this.direction = 'left';
        else this.direction = 'right';
    }
    
    chasePlayer(deltaTime, player) {
        // Simple chase logic
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) { // Only chase if not too close
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }
    }
    
    retreat(deltaTime, player, canvasWidth, canvasHeight) {
        // Move away from player
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) { // Only retreat if too close
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
            
            // Stay within canvas bounds
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > canvasHeight) this.y = canvasHeight - this.height;
        }
    }
    
    attack(player, engine) {
        // To be implemented by subclasses
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }
    
    draw(ctx) {
        // Base drawing method to be overridden by child classes
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 5, this.width/2, 15, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class GoblinBoss extends Boss {
    constructor(x, y, weapon) {
        super(x, y, 'Goblin Chief', 150, weapon);
        this.color = '#6B8E23'; // Olive green for goblin
        this.projectileSpeed = 300;
    }
    
    attack(player, engine) {
        // Throw a knife at the player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const projectile = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            width: 10,
            height: 10,
            damage: 10,
            speedX: (dx / distance) * this.projectileSpeed,
            speedY: (dy / distance) * this.projectileSpeed,
            update(deltaTime) {
                this.x += this.speedX * deltaTime;
                this.y += this.speedY * deltaTime;
            },
            draw(ctx) {
                // Draw knife
                ctx.fillStyle = '#666';
                ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
                
                // Draw handle
                ctx.fillStyle = '#8B4513';
                const angle = Math.atan2(this.speedY, this.speedX);
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(angle);
                ctx.fillRect(-5, -2, 10, 4);
                ctx.restore();
            }
        };
        
        engine.bossProjectiles.push(projectile);
        
        // Play attack sound
        if (engine.audioManager) {
            engine.audioManager.play('goblinAttack');
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 12, this.y + 22, 40, 35);
        
        // Head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 7, this.y + 18, 3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/2 + 7, this.y + 18, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 25, 7, 0, Math.PI, false);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 - 15, this.y + 12);
        ctx.lineTo(this.x + this.width/2 - 25, this.y);
        ctx.lineTo(this.x + this.width/2 - 10, this.y + 15);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 + 15, this.y + 12);
        ctx.lineTo(this.x + this.width/2 + 25, this.y);
        ctx.lineTo(this.x + this.width/2 + 10, this.y + 15);
        ctx.fill();
        
        // Weapon (sword)
        if (this.isAttacking) {
            // Attack animation
            ctx.fillStyle = '#CCC';
            if (this.direction === 'right') {
                ctx.fillRect(this.x + this.width - 5, this.y + 30, 20, 5);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + this.width + 15, this.y + 28, 10, 9);
            } else {
                ctx.fillRect(this.x - 15, this.y + 30, 20, 5);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 25, this.y + 28, 10, 9);
            }
        } else {
            // Normal position
            ctx.fillStyle = '#CCC';
            if (this.direction === 'right') {
                ctx.fillRect(this.x + this.width - 5, this.y + 40, 15, 5);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + this.width + 10, this.y + 38, 8, 9);
            } else {
                ctx.fillRect(this.x - 10, this.y + 40, 15, 5);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x - 18, this.y + 38, 8, 9);
            }
        }
    }
}

export class ZombieBoss extends Boss {
    constructor(x, y, weapon) {
        super(x, y, 'Undead Lord', 200, weapon);
        this.color = '#6c7743'; // Grayish green for zombie
        this.speed = 70; // Slower than other bosses
        this.projectileSpeed = 250; // Increased projectile speed
    }
    
    attack(player, engine) {
        // Create a circular toxic cloud around zombie - with increased range and speed
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const vx = Math.cos(angle) * 200; // Increased speed
            const vy = Math.sin(angle) * 200;
            
            const projectile = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                width: 25, // Increased size
                height: 25,
                damage: 15,
                speedX: vx,
                speedY: vy,
                lifetime: 2.0, // Increased lifetime 
                timeAlive: 0,
                update(deltaTime) {
                    this.x += this.speedX * deltaTime;
                    this.y += this.speedY * deltaTime;
                    this.timeAlive += deltaTime;
                    
                    // Slow down less drastically
                    this.speedX *= 0.97;
                    this.speedY *= 0.97;
                    
                    // Check if lifetime is expired
                    if (this.timeAlive >= this.lifetime) {
                        return true; // Mark for removal
                    }
                    return false;
                },
                draw(ctx) {
                    // Draw toxic cloud with enhanced graphics
                    const alpha = 1 - (this.timeAlive / this.lifetime);
                    const size = 15 * (1 + this.timeAlive);
                    
                    // Outer glow
                    const gradient = ctx.createRadialGradient(
                        this.x, this.y, size * 0.4,
                        this.x, this.y, size
                    );
                    gradient.addColorStop(0, `rgba(50, 205, 50, ${alpha * 0.8})`);
                    gradient.addColorStop(1, `rgba(50, 205, 50, 0)`);
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Inner core
                    ctx.fillStyle = `rgba(30, 130, 30, ${alpha * 0.9})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            engine.bossProjectiles.push(projectile);
        }
        
        // Play attack sound
        if (engine.audioManager) {
            engine.audioManager.play('zombieAttack');
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 14, this.y + 25, 36, 32);
        
        // Head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Sunken eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 7, this.y + 18, 4, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/2 + 7, this.y + 18, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth - gaping
        ctx.fillStyle = '#500';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 25, 5, 0, Math.PI * 2, false);
        ctx.fill();
        
        // Arms - hanging and lifeless
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 8, this.y + 25, 6, 20);
        ctx.fillRect(this.x + this.width - 14, this.y + 25, 6, 20);
        
        // Weapon (bat)
        if (this.isAttacking) {
            // Attack animation
            ctx.fillStyle = '#8B4513';
            if (this.direction === 'right') {
                ctx.save();
                ctx.translate(this.x + this.width, this.y + 35);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(0, 0, 5, 25);
                ctx.fillRect(-5, 0, 15, 8);
                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(this.x, this.y + 35);
                ctx.rotate(-Math.PI / 4);
                ctx.fillRect(-5, 0, 5, 25);
                ctx.fillRect(-10, 0, 15, 8);
                ctx.restore();
            }
        } else {
            // Normal position
            ctx.fillStyle = '#8B4513';
            if (this.direction === 'right') {
                ctx.fillRect(this.x + this.width, this.y + 35, 5, 25);
                ctx.fillRect(this.x + this.width, this.y + 35, 15, 8);
            } else {
                ctx.fillRect(this.x - 5, this.y + 35, 5, 25);
                ctx.fillRect(this.x - 15, this.y + 35, 15, 8);
            }
        }
    }
}

export class ChickenBoss extends Boss {
    constructor(x, y, weapon) {
        super(x, y, 'Feathered Fiend', 120, weapon);
        this.color = '#FFA500'; // Orange for chicken
        this.speed = 150; // Faster than other bosses
        this.jumpCooldown = 3000; // ms
        this.lastJump = 0;
        this.isJumping = false;
        this.jumpHeight = 0;
        this.maxJumpHeight = 100;
        this.jumpSpeed = 300;
    }
    
    update(deltaTime, player, engine) {
        super.update(deltaTime, player, engine);
        
        // Jump logic
        if (Date.now() - this.lastJump > this.jumpCooldown && !this.isJumping) {
            this.isJumping = true;
            this.lastJump = Date.now();
            
            // Target player's position for jump
            this.targetX = player.x;
            this.targetY = player.y;
        }
        
        if (this.isJumping) {
            // Jump animation in progress
            if (this.jumpHeight < this.maxJumpHeight && this.jumpHeight >= 0) {
                // Going up
                this.jumpHeight += this.jumpSpeed * deltaTime;
                
                // Move towards target
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) {
                    this.x += (dx / distance) * this.speed * 2 * deltaTime;
                    this.y += (dy / distance) * this.speed * 2 * deltaTime;
                }
            } else if (this.jumpHeight >= this.maxJumpHeight) {
                // Start falling
                this.jumpHeight = this.maxJumpHeight - 1;
                this.jumpSpeed = -this.jumpSpeed;
            } else if (this.jumpHeight < 0) {
                // Landed
                this.jumpHeight = 0;
                this.jumpSpeed = Math.abs(this.jumpSpeed);
                this.isJumping = false;
                
                // Create shockwave on landing
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const vx = Math.cos(angle) * 200;
                    const vy = Math.sin(angle) * 200;
                    
                    const projectile = {
                        x: this.x + this.width / 2,
                        y: this.y + this.height / 2,
                        width: 30,
                        height: 10,
                        damage: 20,
                        speedX: vx,
                        speedY: vy,
                        lifetime: 3.0, 
                        timeAlive: 0,
                        update(deltaTime) {
                            this.x += this.speedX * deltaTime;
                            this.y += this.speedY * deltaTime;
                            this.timeAlive += deltaTime;
                            
                            // Slow down over time
                            this.speedX *= 0.9;
                            this.speedY *= 0.9;
                            
                            // Return true if this projectile should be removed
                            return this.timeAlive >= this.lifetime;
                        },
                        draw(ctx) {
                            // Add fade out effect as they approach lifetime
                            const alpha = Math.max(0, 1 - (this.timeAlive / this.lifetime));
                            
                            // Draw feather with transparency
                            ctx.globalAlpha = alpha;
                            ctx.fillStyle = '#FFA500';
                            ctx.save();
                            ctx.translate(this.x, this.y);
                            const angle = Math.atan2(this.speedY, this.speedX);
                            ctx.rotate(angle);
                            
                            // Feather shape
                            ctx.beginPath();
                            ctx.moveTo(0, 0);
                            ctx.lineTo(-15, 5);
                            ctx.lineTo(-5, 0);
                            ctx.lineTo(-15, -5);
                            ctx.closePath();
                            ctx.fill();
                            
                            ctx.restore();
                            ctx.globalAlpha = 1; // Reset global alpha
                        }
                    };
                    
                    engine.bossProjectiles.push(projectile);
                }
            }
        }
    }
    
    attack(player, engine) {
        // Peck attack - create three feather projectiles
        for (let i = -1; i <= 1; i++) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate angle for spread
            const angle = Math.atan2(dy, dx) + (i * Math.PI / 8);
            const vx = Math.cos(angle) * 250;
            const vy = Math.sin(angle) * 250;
            
            const projectile = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                width: 15,
                height: 8,
                damage: 10,
                speedX: vx,
                speedY: vy,
                update(deltaTime) {
                    this.x += this.speedX * deltaTime;
                    this.y += this.speedY * deltaTime;
                },
                draw(ctx) {
                    // Draw feather
                    ctx.fillStyle = '#FFA500';
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    const angle = Math.atan2(this.speedY, this.speedX);
                    ctx.rotate(angle);
                    
                    // Feather shape
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-15, 5);
                    ctx.lineTo(-5, 0);
                    ctx.lineTo(-15, -5);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                }
            };
            
            engine.bossProjectiles.push(projectile);
        }
        
        // Play attack sound
        if (engine.audioManager) {
            engine.audioManager.play('chickenAttack');
        }
    }
    
    draw(ctx) {
        // Adjust drawing based on jump height
        const yOffset = this.isJumping ? -this.jumpHeight : 0;
        
        // Shadow is always on ground level, but size changes with height
        const shadowScale = this.isJumping ? (1 - this.jumpHeight / (this.maxJumpHeight * 2)) : 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width/2, 
            this.y + this.height - 5, 
            this.width/2 * shadowScale, 
            15 * shadowScale, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 12, this.y + 22 + yOffset, 40, 35);
        
        // Head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 18 + yOffset, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000';
        if (this.direction === 'right') {
            ctx.beginPath();
            ctx.arc(this.x + this.width/2 + 7, this.y + 15 + yOffset, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x + this.width/2 - 7, this.y + 15 + yOffset, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Beak/weapon
        ctx.fillStyle = '#FF0000';
        if (this.isAttacking) {
            // Attack animation
            if (this.direction === 'right') {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2 + 15, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 + 35, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 + 15, this.y + 25 + yOffset);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2 - 15, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 - 35, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 - 15, this.y + 25 + yOffset);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            // Normal position
            if (this.direction === 'right') {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2 + 15, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 + 25, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 + 15, this.y + 23 + yOffset);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2 - 15, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 - 25, this.y + 18 + yOffset);
                ctx.lineTo(this.x + this.width/2 - 15, this.y + 23 + yOffset);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // Wings
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y + 35 + yOffset, 8, 15, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(this.x + this.width - 10, this.y + 35 + yOffset, 8, 15, -Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Feet
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 20, this.y + this.height - 8 + yOffset, 8, 8);
        ctx.fillRect(this.x + this.width - 28, this.y + this.height - 8 + yOffset, 8, 8);
    }
}