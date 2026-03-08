// New file for combat-related utility functions

// Handle damage to player with knockback effect
export function handlePlayerDamage(player, damageSource, damageAmount, engine) {
    // Skip if player is already invincible
    if (player.isInvincible) return false;
    
    // Apply damage
    player.takeDamage(damageAmount);
    
    // Apply knockback (use center of damage source for direction)
    const sourceX = damageSource.x + (damageSource.width || 0) / 2;
    const sourceY = damageSource.y + (damageSource.height || 0) / 2;
    player.applyKnockback(sourceX, sourceY);
    
    // Update UI
    if (engine.uiManager) {
        engine.uiManager.updateHealthBar(player.health);
    }
    
    // Play sound effect
    if (engine.audioManager) {
        engine.audioManager.play('playerHurt');
    }
    
    // Check if player died
    if (player.health <= 0) {
        if (engine.audioManager) {
            engine.audioManager.play('playerDeath');
        }
        engine.endGame(false);
    }
    
    return true;
}