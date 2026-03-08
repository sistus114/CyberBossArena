export class ArrowProjectile {
    constructor(x, y, dirX, dirY) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.speed = 400;
        this.speedX = dirX * this.speed;
        this.speedY = dirY * this.speed;
        this.damage = 20;
    }
    
    update(deltaTime) {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotate arrow based on direction
        const angle = Math.atan2(this.speedY, this.speedX);
        ctx.rotate(angle);
        
        // Draw arrow shaft
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-10, -1, 20, 2);
        
        // Draw arrowhead
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(5, -4);
        ctx.lineTo(5, 4);
        ctx.closePath();
        ctx.fill();
        
        // Draw feathers
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-15, -3);
        ctx.lineTo(-10, -1);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-15, 3);
        ctx.lineTo(-10, 1);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}