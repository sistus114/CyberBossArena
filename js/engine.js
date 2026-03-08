import { ArrowProjectile } from 'projectiles';
import { applyBossStartEffects, updateBossEffects } from './boss_effects.js';
import { handlePlayerDamage } from './combat_utils.js';

export default class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.player = null;
        this.levelManager = null;
        this.uiManager = null;
        this.audioManager = null;
        this.transitionManager = null;
        this.victorySequence = null;
        this.projectiles = [];
        this.bossProjectiles = [];
        this.lastTime = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.bloomEnabled = true;
        this.lastTornadoDamageTime = null;
        this.mobileControls = null;
        
        // Grid for background
        this.gridSize = 32;
        this.stains = this.generateStains();
        
        // Night mode and shader effects
        this.nightMode = false;
        this.bloomIntensity = 0.3;
        this.bloomRadius = 5;
        
        // Detect if mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Input handling
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('click', (e) => this.handleMouseClick(e));
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    setLevelManager(levelManager) {
        this.levelManager = levelManager;
    }
    
    setUIManager(uiManager) {
        this.uiManager = uiManager;
        this.uiManager.setEngine(this);
    }
    
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }
    
    setTransitionManager(transitionManager) {
        this.transitionManager = transitionManager;
    }
    
    setVictorySequence(victorySequence) {
        this.victorySequence = victorySequence;
    }
    
    setMobileControls(mobileControls) {
        this.mobileControls = mobileControls;
    }
    
    generateStains() {
        const stains = [];
        const numStains = 30;
        
        for (let i = 0; i < numStains; i++) {
            stains.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 5 + Math.random() * 20,
                alpha: 0.05 + Math.random() * 0.1
            });
        }
        
        return stains;
    }
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        // Arrow shooting
        if (this.player && !this.gameOver) {
            if (e.code === 'ArrowUp' && this.player.canShoot()) {
                this.shootArrow(0, -1);
            } else if (e.code === 'ArrowRight' && this.player.canShoot()) {
                this.shootArrow(1, 0);
            } else if (e.code === 'ArrowDown' && this.player.canShoot()) {
                this.shootArrow(0, 1);
            } else if (e.code === 'ArrowLeft' && this.player.canShoot()) {
                this.shootArrow(-1, 0);
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleMouseClick(e) {
        if (e.button === 0 && this.player && !this.gameOver && this.player.canShoot()) {
            this.shootArrowTowardsMouse();
        }
    }
    
    shootArrow(dirX, dirY) {
        if (this.player.arrows > 0) {
            const arrow = new ArrowProjectile(
                this.player.x, 
                this.player.y,
                dirX,
                dirY
            );
            
            this.projectiles.push(arrow);
            this.player.arrows--;
            this.player.lastShot = Date.now();
            this.uiManager.updateArrowCount(this.player.arrows);
            
            // Play arrow shoot sound
            if (this.audioManager) {
                setTimeout(() => {
                    this.audioManager.play('arrowShoot');
                }, 0);
            }
        }
    }
    
    shootArrowTowardsMouse() {
        if (this.player.arrows > 0) {
            // Calculate direction vector from player to mouse
            const dx = this.mousePosition.x - (this.player.x + this.player.width / 2);
            const dy = this.mousePosition.y - (this.player.y + this.player.height / 2);
            
            // Normalize the direction vector
            const length = Math.sqrt(dx * dx + dy * dy);
            const dirX = dx / length;
            const dirY = dy / length;
            
            // Update player direction based on mouse position
            if (Math.abs(dx) > Math.abs(dy)) {
                this.player.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.player.direction = dy > 0 ? 'down' : 'up';
            }
            
            const arrow = new ArrowProjectile(
                this.player.x + this.player.width / 2, 
                this.player.y + this.player.height / 2,
                dirX,
                dirY
            );
            
            this.projectiles.push(arrow);
            this.player.arrows--;
            this.player.lastShot = Date.now();
            this.uiManager.updateArrowCount(this.player.arrows);
            
            // Play arrow shoot sound
            if (this.audioManager) {
                setTimeout(() => {
                    this.audioManager.play('arrowShoot');
                }, 0);
            }
        }
    }
    
    start() {
        this.gameOver = false;
        this.gameWon = false;
        this.lastTime = performance.now();
        this.levelManager.startLevel();
        this.animate(this.lastTime);
    }
    
    reset() {
        this.player.reset();
        this.levelManager.reset();
        this.projectiles = [];
        this.bossProjectiles = [];
        this.uiManager.reset();
    }
    
    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        if (!this.gameOver) {
            this.update(deltaTime);
            this.render();
            
            // Update UI elements
            if (this.uiManager && typeof this.uiManager.update === 'function') {
                this.uiManager.update(deltaTime);
            }
            
            // Update UI with player reloading status
            if (this.player && this.player.isReloading) {
                this.uiManager.updateArrowCount(0);
            }
            
            requestAnimationFrame((time) => this.animate(time));
        }
    }
    
    update(deltaTime) {
        // If victory sequence is active, only update it
        if (this.victorySequence && this.victorySequence.isActive) {
            this.victorySequence.update(deltaTime);
            return;
        }
        
        // If transition is active, only update transition
        if (this.transitionManager && this.transitionManager.isActive) {
            this.transitionManager.update(deltaTime);
            return;
        }
        
        // Update player
        if (this.player) {
            this.player.update(deltaTime, this.keys, this.width, this.height);
            
            // Update stamina UI
            if (this.uiManager) {
                this.uiManager.updateStaminaBar(this.player.stamina, this.player.maxStamina);
            }
            
            // Player-boss collision
            const currentBoss = this.levelManager.getCurrentBoss();
            if (currentBoss && this.checkCollision(this.player, currentBoss)) {
                handlePlayerDamage(this.player, currentBoss, 10, this);
            }
            
            // Check if player is in tornado
            if (currentBoss && currentBoss.tornadoActive) {
                const tornadoRadius = 50;
                const playerDist = Math.sqrt(
                    Math.pow(this.player.x + this.player.width/2 - currentBoss.tornadoX, 2) +
                    Math.pow(this.player.y + this.player.height/2 - currentBoss.tornadoY, 2)
                );
                
                if (playerDist < tornadoRadius) {
                    if (!this.player.isInvincible) {
                        this.player.takeDamage(0.5); // Continuous damage
                        this.uiManager.updateHealthBar(this.player.health);
                        
                        // Push player away from tornado
                        const pushFactor = 100 * deltaTime;
                        const pushX = (this.player.x + this.player.width/2 - currentBoss.tornadoX) / playerDist * pushFactor;
                        const pushY = (this.player.y + this.player.height/2 - currentBoss.tornadoY) / playerDist * pushFactor;
                        this.player.x += pushX;
                        this.player.y += pushY;
                        
                        // Play tornado damage sound at most once per second
                        if (!this.lastTornadoDamageTime || Date.now() - this.lastTornadoDamageTime > 1000) {
                            if (this.audioManager) {
                                this.audioManager.play('playerHurt');
                                this.lastTornadoDamageTime = Date.now();
                            }
                        }
                    }
                }
            }
        }
        
        // Update current boss
        const boss = this.levelManager.getCurrentBoss();
        if (boss) {
            // Apply temporary effects to bosses (like Feathered Fiend slowdown)
            updateBossEffects(boss, deltaTime);
            
            boss.update(deltaTime, this.player, this);
            this.uiManager.updateBossHealthBar(boss.health, boss.maxHealth, boss.name);
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update mobile controls if on mobile
        if (this.mobileControls) {
            this.mobileControls.update();
        }
        
        // Limit active sounds to prevent audio overload
        if (this.audioManager && this.audioManager.activeContexts.length > 10) {
            // Keep only the most recent sounds
            const oldestContexts = this.audioManager.activeContexts.slice(0, -10);
            for (const ctx of oldestContexts) {
                try {
                    if (ctx.oscillator) ctx.oscillator.stop();
                    if (ctx.context) ctx.context.close();
                } catch (e) {
                    // Ignore errors when stopping
                }
            }
            this.audioManager.activeContexts = this.audioManager.activeContexts.slice(-10);
        }
    }
    
    updateProjectiles(deltaTime) {
        // Update player projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Allow projectiles to signal when they should be removed
            const shouldRemove = projectile.update(deltaTime);
            
            // Check if projectile is out of bounds or should be removed
            if (shouldRemove || 
                projectile.x < 0 || projectile.x > this.width || 
                projectile.y < 0 || projectile.y > this.height) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check for collision with current boss
            const boss = this.levelManager.getCurrentBoss();
            if (boss && this.checkCollision(projectile, boss)) {
                boss.takeDamage(projectile.damage);
                this.projectiles.splice(i, 1);
                
                // Play boss damage sound
                if (this.audioManager) {
                    setTimeout(() => {
                        this.audioManager.play('bossDamage');
                    }, 0);
                }
                
                // Check if boss is defeated
                if (boss.health <= 0) {
                    // Start the boss transition sequence instead of immediately advancing
                    if (this.transitionManager) {
                        this.transitionManager.startBossTransition(boss, this.levelManager);
                    } else {
                        this.handleBossDefeat();
                    }
                }
            }
        }
        
        // Update boss projectiles
        for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.bossProjectiles[i];
            
            // Allow projectiles to signal when they should be removed
            const shouldRemove = projectile.update(deltaTime);
            
            // Check if projectile is out of bounds or should be removed
            if (shouldRemove || 
                projectile.x < 0 || projectile.x > this.width || 
                projectile.y < 0 || projectile.y > this.height) {
                this.bossProjectiles.splice(i, 1);
                continue;
            }
            
            // Check for collision with player - now with invincibility
            if (this.player && this.checkCollision(projectile, this.player)) {
                // Only apply damage if not invincible
                if (!this.player.isInvincible) {
                    handlePlayerDamage(this.player, projectile, projectile.damage, this);
                    this.bossProjectiles.splice(i, 1);
                }
            }
        }
        
        // Also run auto-expire check for projectiles with lifetime property
        // Import from combat_utils_ext.js for projectiles that don't implement the shouldRemove pattern
        if (typeof window.updateAutoExpireProjectiles === 'function') {
            window.updateAutoExpireProjectiles(this.bossProjectiles, deltaTime);
        }
    }
    
    checkCollision(obj1, obj2) {
        return (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );
    }
    
    handleBossDefeat() {
        const currentBoss = this.levelManager.getCurrentBoss();
        const isFinalBoss = currentBoss && currentBoss.name === 'Skeleton King';
        
        if (this.audioManager) {
            setTimeout(() => {
                this.audioManager.play('bossDefeat');
            }, 0);
        }
        
        // For Skeleton King (final boss), use the victory sequence
        if (isFinalBoss && this.victorySequence) {
            this.victorySequence.startVictorySequence(currentBoss);
            return;
        }
        
        // For other bosses, use the regular transition
        if (this.transitionManager) {
            this.transitionManager.startBossTransition(this.levelManager.getCurrentBoss(), this.levelManager);
            this.transitionManager.engine = this;
        } else {
            // Only if no transition manager, handle directly (fallback)
            if (this.levelManager.advanceLevel()) {
                // Next boss
                this.projectiles = [];
                this.bossProjectiles = [];
                this.player.restoreArrows(5);
                this.uiManager.updateArrowCount(this.player.arrows);
            } else {
                // Player won the game
                this.endGame(true);
            }
        }
    }
    
    endGame(playerWon) {
        this.gameOver = true;
        this.gameWon = playerWon;
        this.uiManager.showGameOver(playerWon);
        
        // Play appropriate end game sound
        if (this.audioManager) {
            setTimeout(() => {
                if (playerWon) {
                    this.audioManager.play('bossDefeat');
                } else {
                    this.audioManager.play('playerDeath');
                }
            }, 0);
        }
    }
    
    render() {
        // If victory sequence is active, let it handle rendering
        if (this.victorySequence && this.victorySequence.isActive) {
            this.victorySequence.render(this.ctx);
            return;
        }
        
        // If transition is active, let it handle rendering
        if (this.transitionManager && this.transitionManager.isActive) {
            this.transitionManager.render(this.ctx);
            return;
        }
        
        // Clear canvas
        this.ctx.fillStyle = this.nightMode ? '#121827' : '#f5e8c9';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw paper texture
        this.drawPaperTexture();
        
        // Draw grid lines
        this.drawGrid();
        
        // Apply night shader if needed
        if (this.nightMode) {
            this.applyNightShader();
        }
        
        // Draw player
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        // Draw current boss
        const boss = this.levelManager.getCurrentBoss();
        if (boss) {
            boss.draw(this.ctx);
        }
        
        // Draw projectiles
        this.projectiles.forEach(projectile => {
            projectile.draw(this.ctx);
        });
        
        this.bossProjectiles.forEach(projectile => {
            projectile.draw(this.ctx);
        });
        
        // Apply bloom effect if in night mode
        if (this.nightMode) {
            this.applyBloomEffect();
        }
        
        // Draw UI elements if they have a draw method
        if (this.uiManager && typeof this.uiManager.draw === 'function') {
            this.uiManager.draw(this.ctx);
        }
    }
    
    drawPaperTexture() {
        // Enhanced paper texture
        
        // Base old paper color overlay - darker in night mode
        if (this.nightMode) {
            this.ctx.fillStyle = 'rgba(25, 30, 45, 0.2)';
        } else {
            this.ctx.fillStyle = 'rgba(245, 232, 201, 0.1)';
        }
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stains
        this.stains.forEach(stain => {
            if (this.nightMode) {
                this.ctx.fillStyle = `rgba(35, 40, 50, ${stain.alpha})`;
            } else {
                this.ctx.fillStyle = `rgba(165, 130, 90, ${stain.alpha})`;
            }
            this.ctx.beginPath();
            this.ctx.arc(stain.x, stain.y, stain.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Add folded paper edges effect
        this.ctx.fillStyle = this.nightMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)';
        // Left edge
        this.ctx.fillRect(0, 0, 5, this.height);
        // Right edge
        this.ctx.fillRect(this.width - 5, 0, 5, this.height);
        // Top edge
        this.ctx.fillRect(0, 0, this.width, 5);
        // Bottom edge
        this.ctx.fillRect(0, this.height - 5, this.width, 5);
        
        // Add noise texture
        this.ctx.fillStyle = this.nightMode ? 'rgba(100, 130, 180, 0.03)' : 'rgba(0, 0, 0, 0.03)';
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        // Add vignette effect - stronger in night mode
        const gradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, this.height * (this.nightMode ? 0.1 : 0.2),
            this.width/2, this.height/2, this.height * (this.nightMode ? 0.6 : 0.7)
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, this.nightMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.nightMode ? 'rgba(60, 80, 120, 0.15)' : 'rgba(165, 130, 90, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    applyNightShader() {
        // Apply a dark overlay for night effect
        this.ctx.fillStyle = 'rgba(0, 10, 30, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add some subtle blue noise for night atmosphere
        this.ctx.fillStyle = 'rgba(50, 70, 150, 0.02)';
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 3;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    applyBloomEffect() {
        if (!this.bloomEnabled) return;
        
        // Simple bloom effect using shadow blur
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy current canvas to temp canvas
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Draw bright spots with bloom
        tempCtx.globalCompositeOperation = 'lighter';
        tempCtx.filter = `blur(${this.bloomRadius}px)`;
        tempCtx.globalAlpha = this.bloomIntensity;
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Reset and draw the bloom effect back to original canvas
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.filter = 'none';
        tempCtx.globalAlpha = 1;
        
        // Apply bloom effect
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
    }
}