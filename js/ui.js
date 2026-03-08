export class UIManager {
    constructor() {
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');
        this.bossHealthBar = document.getElementById('boss-health-bar');
        this.bossName = document.getElementById('boss-name');
        this.arrowCount = document.getElementById('arrow-count');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.gameOverText = document.getElementById('game-over-text');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.engine = null;
        this.healingEffects = [];
        this.staminaBar = document.createElement('div');
        this.staminaBar.id = 'stamina-bar-container';
        this.staminaBar.innerHTML = '<div id="stamina-bar"></div><span id="stamina-text">Stamina</span>';
        document.getElementById('ui-overlay').appendChild(this.staminaBar);
    }
    
    setEngine(engine) {
        this.engine = engine;
    }
    
    updateHealthBar(health) {
        const percentage = (health / 100) * 100;
        this.healthBar.style.width = `${percentage}%`;
        this.healthText.textContent = `Health: ${health}`;
    }
    
    updateBossHealthBar(health, maxHealth, name) {
        const percentage = (health / maxHealth) * 100;
        this.bossHealthBar.style.width = `${percentage}%`;
        this.bossName.textContent = name;
    }
    
    updateArrowCount(count) {
        this.arrowCount.textContent = `Arrows: ${count}`;
        
        // Visual effect for low or no arrows
        if (count <= 0) {
            this.arrowCount.style.color = '#FF0000';
            this.arrowCount.style.fontWeight = 'bold';
        } else if (count <= 3) {
            this.arrowCount.style.color = '#FFA500';
            this.arrowCount.style.fontWeight = 'bold';
        } else {
            this.arrowCount.style.color = '#442205';
            this.arrowCount.style.fontWeight = 'normal';
        }
    }
    
    updateStaminaBar(stamina, maxStamina) {
        const percentage = (stamina / maxStamina) * 100;
        const staminaBarElement = document.getElementById('stamina-bar');
        if (staminaBarElement) {
            staminaBarElement.style.width = `${percentage}%`;
            
            // Change color based on stamina level
            if (percentage <= 30) {
                staminaBarElement.style.backgroundColor = '#F44336'; // Red when low
            } else {
                staminaBarElement.style.backgroundColor = '#4CAF50'; // Green otherwise
            }
        }
    }
    
    showGameOver(victory) {
        this.gameOverScreen.style.display = 'flex';
        
        if (victory) {
            this.gameOverText.textContent = 'Victory!';
            this.gameOverMessage.textContent = 'You defeated all the bosses!';
        } else {
            this.gameOverText.textContent = 'Game Over';
            this.gameOverMessage.textContent = 'You were defeated...';
        }
    }
    
    reset() {
        this.updateHealthBar(100);
        this.updateArrowCount(10);
        this.updateBossHealthBar(100, 100, 'No Boss');
        this.updateStaminaBar(100, 100);
        this.gameOverScreen.style.display = 'none';
    }
    
    showHealEffect(amount) {
        // Create a floating healing text
        this.healingEffects.push({
            text: `+${amount} HP`,
            x: 140,
            y: 40,
            opacity: 1,
            timeAlive: 0,
            lifetime: 2
        });
    }
    
    update(deltaTime) {
        // Update healing effects
        for (let i = this.healingEffects.length - 1; i >= 0; i--) {
            const effect = this.healingEffects[i];
            effect.timeAlive += deltaTime;
            effect.y -= 30 * deltaTime;
            effect.opacity = Math.max(0, 1 - (effect.timeAlive / effect.lifetime));
            
            if (effect.timeAlive >= effect.lifetime) {
                this.healingEffects.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        // Draw healing effects
        for (const effect of this.healingEffects) {
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = `rgba(0, 255, 0, ${effect.opacity})`;
            ctx.textAlign = 'center';
            ctx.fillText(effect.text, effect.x, effect.y);
        }
    }
}