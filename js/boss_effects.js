// Helper functions for boss effects and battle transitions

// Apply effects when a new boss battle starts
export function applyBossStartEffects(boss) {
    if (boss.name === 'Feathered Fiend') {
        boss.temporarySlowdown = true;
        boss.originalSpeed = boss.speed;
        boss.speed = boss.speed * 0.5; // 50% slower
        boss.slowdownTimer = 0;
        boss.slowdownDuration = 2; // 2 seconds
    }
}

// Update any active boss effects
export function updateBossEffects(boss, deltaTime) {
    if (boss.temporarySlowdown) {
        boss.slowdownTimer += deltaTime;
        if (boss.slowdownTimer >= boss.slowdownDuration) {
            boss.speed = boss.originalSpeed;
            boss.temporarySlowdown = false;
        }
    }
}

// Apply healing after boss defeat
export function healPlayerAfterBossFight(player) {
    const healAmount = 50;
    player.health = Math.min(player.maxHealth, player.health + healAmount);
    return healAmount;
}