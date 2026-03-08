export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.speed = 200;
        this.health = 100;
        this.maxHealth = 100;
        this.arrows = 20;
        this.maxArrows = 30;
        this.lastShot = 0;
        this.shootCooldown = 500;
        this.lastPos = { x, y };
        this.direction = 'down';
        this.isMoving = false;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.reloadDuration = 2000;
        this.hasTorch = true;

        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 3;
        this.fps = 10;
        this.frameTimer = 0;
        this.frameInterval = 1000/this.fps;
        this.torchIntensity = 1.0;
        this.torchFlicker = 0;

        this.isInvincible = false;
        this.invincibilityDuration = 1000; // 1 second
        this.invincibilityTimer = 0;
        this.isKnockedBack = false;
        this.knockbackDuration = 200; // 0.2 seconds
        this.knockbackTimer = 0;
        this.knockbackSpeed = 400;
        this.knockbackDir = { x: 0, y: 0 };

        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegenRate = 25; // per second
        this.sprintSpeedMultiplier = 1.5;
        this.isSprinting = false;
        this.staminaUsageRate = 30; // per second
    }

    update(deltaTime, keys, canvasWidth, canvasHeight) {
        this.lastPos = { x: this.x, y: this.y };
        this.isMoving = false;
        this.isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];

        // Update invincibility
        if (this.isInvincible) {
            this.invincibilityTimer += deltaTime * 1000;
            if (this.invincibilityTimer >= this.invincibilityDuration) {
                this.isInvincible = false;
                this.invincibilityTimer = 0;
            }
        }

        // Handle knockback
        if (this.isKnockedBack) {
            this.knockbackTimer += deltaTime * 1000;
            this.x += this.knockbackDir.x * this.knockbackSpeed * deltaTime;
            this.y += this.knockbackDir.y * this.knockbackSpeed * deltaTime;
            
            if (this.knockbackTimer >= this.knockbackDuration) {
                this.isKnockedBack = false;
                this.knockbackTimer = 0;
            }
        }

        // Update stamina
        if (!this.isMoving) {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * deltaTime);
        } else if (this.isSprinting && this.stamina > 0) {
            this.stamina = Math.max(0, this.stamina - this.staminaUsageRate * deltaTime);
        }

        if (this.isReloading) {
            this.reloadTimer += deltaTime * 1000;
            if (this.reloadTimer >= this.reloadDuration) {
                this.isReloading = false;
                this.reloadTimer = 0;
                this.arrows = 5;
                
                // Play reload complete sound
                const engine = window.gameEngine;
                if (engine && engine.audioManager) {
                    setTimeout(() => {
                        engine.audioManager.play('reloadComplete');
                    }, 0);
                }
            }
        }

        // Only allow movement input if not being knocked back
        if (!this.isKnockedBack) {
            let currentSpeed = this.isReloading ? this.speed * 0.5 : this.speed;
            
            // Apply sprint speed if stamina available and sprint key pressed
            if (this.isSprinting && this.stamina > 0) {
                currentSpeed *= this.sprintSpeedMultiplier;
            }

            if (keys['KeyW'] || keys['ArrowUp']) {
                this.y -= currentSpeed * deltaTime;
                this.direction = 'up';
                this.isMoving = true;
            }
            if (keys['KeyS'] || keys['ArrowDown']) {
                this.y += currentSpeed * deltaTime;
                this.direction = 'down';
                this.isMoving = true;
            }
            if (keys['KeyA'] || keys['ArrowLeft']) {
                this.x -= currentSpeed * deltaTime;
                this.direction = 'left';
                this.isMoving = true;
            }
            if (keys['KeyD'] || keys['ArrowRight']) {
                this.x += currentSpeed * deltaTime;
                this.direction = 'right';
                this.isMoving = true;
            }
        }

        // Keep player within bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvasHeight) this.y = canvasHeight - this.height;

        if (this.isMoving) {
            if (this.frameTimer > this.frameInterval) {
                this.frameX = (this.frameX + 1) % this.maxFrame;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime * 1000;
            }
        } else {
            this.frameX = 0;
        }

        if (this.direction === 'up') this.frameY = 0;
        else if (this.direction === 'right') this.frameY = 1;
        else if (this.direction === 'down') this.frameY = 2;
        else if (this.direction === 'left') this.frameY = 3;
    }

    draw(ctx) {
        // Flashing effect when invincible
        if (this.isInvincible) {
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.invincibilityTimer / 100);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 5, this.width/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.hasTorch) {
            this.torchFlicker += 0.1;
            const flickerIntensity = this.torchIntensity * (0.85 + 0.15 * Math.sin(this.torchFlicker));
            
            const gradient = ctx.createRadialGradient(
                this.x + this.width/2, 
                this.y + this.height/2, 
                10,
                this.x + this.width/2, 
                this.y + this.height/2, 
                200
            );
            gradient.addColorStop(0, `rgba(255, 200, 100, ${flickerIntensity * 0.4})`);
            gradient.addColorStop(0.3, `rgba(255, 150, 50, ${flickerIntensity * 0.2})`);
            gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 200, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#663931';
        ctx.fillRect(this.x + 8, this.y + 15, 16, 25);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;

        switch(this.direction) {
            case 'up':
                ctx.beginPath();
                ctx.arc(this.x + 16, this.y + 15, 10, Math.PI, 0, true);
                ctx.stroke();
                break;
            case 'right':
                ctx.beginPath();
                ctx.arc(this.x + this.width - 5, this.y + 25, 10, Math.PI * 1.5, Math.PI * 0.5, false);
                ctx.stroke();
                break;
            case 'down':
                ctx.beginPath();
                ctx.arc(this.x + 16, this.y + 35, 10, 0, Math.PI, false);
                ctx.stroke();
                break;
            case 'left':
                ctx.beginPath();
                ctx.arc(this.x + 5, this.y + 25, 10, Math.PI * 0.5, Math.PI * 1.5, false);
                ctx.stroke();
                break;
        }

        if (this.hasTorch) {
            ctx.fillStyle = '#8B4513';
            switch(this.direction) {
                case 'up':
                    ctx.fillRect(this.x + 22, this.y + 20, 4, 15);
                    break;
                case 'right': 
                    ctx.fillRect(this.x + 5, this.y + 20, 4, 15);
                    break;
                case 'down':
                    ctx.fillRect(this.x + 6, this.y + 20, 4, 15);
                    break;
                case 'left':
                    ctx.fillRect(this.x + 23, this.y + 20, 4, 15);
                    break;
            }
            
            const flameSize = 6 + Math.random() * 2;
            const flameX = this.direction === 'left' ? this.x + 25 : 
                          this.direction === 'right' ? this.x + 7 : 
                          this.direction === 'up' ? this.x + 24 : this.x + 8;
            const flameY = this.direction === 'up' ? this.y + 18 : this.y + 18;
            
            const flameGradient = ctx.createRadialGradient(
                flameX, flameY, 0,
                flameX, flameY, flameSize
            );
            flameGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
            flameGradient.addColorStop(0.4, 'rgba(255, 150, 50, 0.8)');
            flameGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            
            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();

        if (this.direction === 'left') {
            ctx.arc(this.x + this.width/2 - 3, this.y + 8, 2, 0, Math.PI * 2);
        } else if (this.direction === 'right') {
            ctx.arc(this.x + this.width/2 + 3, this.y + 8, 2, 0, Math.PI * 2);
        } else if (this.direction === 'up') {
            ctx.arc(this.x + this.width/2 - 3, this.y + 8, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width/2 + 3, this.y + 8, 2, 0, Math.PI * 2);
        } else {
            ctx.arc(this.x + this.width/2 - 3, this.y + 8, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width/2 + 3, this.y + 8, 2, 0, Math.PI * 2);
        }

        ctx.fill();

        if (this.isReloading) {
            const reloadProgress = this.reloadTimer / this.reloadDuration;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x, this.y - 15, this.width, 5);

            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.fillRect(this.x, this.y - 15, this.width * reloadProgress, 5);

            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('RELOADING', this.x + this.width/2, this.y - 20);
        }

        // After drawing player, add stamina bar if not full
        if (this.stamina < this.maxStamina) {
            const staminaWidth = 30;
            const staminaHeight = 4;
            const staminaY = this.y - 25;
            
            // Background bar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x + (this.width - staminaWidth) / 2, staminaY, staminaWidth, staminaHeight);
            
            // Stamina level
            ctx.fillStyle = this.stamina > 30 ? '#4CAF50' : '#F44336'; // Green if good, red if low
            const currentWidth = (this.stamina / this.maxStamina) * staminaWidth;
            ctx.fillRect(this.x + (this.width - staminaWidth) / 2, staminaY, currentWidth, staminaHeight);
        }

        // Reset opacity
        if (this.isInvincible) {
            ctx.globalAlpha = 1;
        }
    }

    canShoot() {
        if (this.arrows <= 0 && !this.isReloading) {
            this.startReloading();
            return false;
        }
        return Date.now() - this.lastShot > this.shootCooldown && this.arrows > 0 && !this.isReloading;
    }

    startReloading() {
        this.isReloading = true;
        this.reloadTimer = 0;
        
        // Play reload start sound
        const engine = window.gameEngine;
        if (engine && engine.audioManager) {
            setTimeout(() => {
                engine.audioManager.play('reloadStart');
            }, 0);
        }
    }

    takeDamage(amount) {
        // Only take damage if not invincible
        if (!this.isInvincible) {
            this.health = Math.max(0, this.health - amount);
            this.setInvincible();
        }
    }
    
    setInvincible() {
        this.isInvincible = true;
        this.invincibilityTimer = 0;
    }
    
    applyKnockback(sourceX, sourceY) {
        // Direction away from damage source
        const dx = this.x + this.width/2 - sourceX;
        const dy = this.y + this.height/2 - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and set knockback direction
        this.knockbackDir = {
            x: dist > 0 ? dx / dist : 0,
            y: dist > 0 ? dy / dist : -1
        };
        
        this.isKnockedBack = true;
        this.knockbackTimer = 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    restoreArrows(amount) {
        this.arrows = Math.min(this.maxArrows, this.arrows + amount);
    }

    reset() {
        this.x = 400;
        this.y = 300;
        this.health = this.maxHealth;
        this.arrows = 20;
        this.direction = 'down';
        this.stamina = this.maxStamina;
    }
}