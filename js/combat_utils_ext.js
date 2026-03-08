// Combat utilities extension - used for specialized combat behaviors

// Import the basic combat utilities
import { handlePlayerDamage } from './combat_utils.js';

// Handle projectile lifespan for auto-despawning projectiles
export function updateAutoExpireProjectiles(projectiles, deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Skip projectiles without lifetime property
        if (!projectile.hasOwnProperty('lifetime')) continue;
        
        // Add elapsed time to projectile's timeAlive
        if (!projectile.hasOwnProperty('timeAlive')) {
            projectile.timeAlive = 0;
        }
        
        projectile.timeAlive += deltaTime;
        
        // Remove if lifetime exceeded
        if (projectile.timeAlive >= projectile.lifetime) {
            projectiles.splice(i, 1);
        }
    }
    
    return projectiles;
}