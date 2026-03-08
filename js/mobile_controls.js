export class MobileControls {
    constructor(player, engine) {
        this.player = player;
        this.engine = engine;
        
        this.joystickBase = document.getElementById('joystick-base');
        this.joystickThumb = document.getElementById('joystick-thumb');
        this.shootButton = document.getElementById('mobile-shoot');
        
        this.isJoystickActive = false;
        this.joystickAngle = 0;
        this.joystickDistance = 0;
        this.maxJoystickDistance = 40;
        this.baseX = 0;
        this.baseY = 0;
        
        // Touch coordinates for joystick
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // Direction vectors
        this.directionX = 0;
        this.directionY = 0;
        
        this.init();
    }
    
    init() {
        // Set initial joystick position
        const baseRect = this.joystickBase.getBoundingClientRect();
        this.baseX = baseRect.width / 2;
        this.baseY = baseRect.height / 2;
        
        // Add shoot button listener
        this.shootButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player && this.player.canShoot() && this.engine) {
                this.shootTowardsMoveDirection();
            }
        });
        
        // Joystick touch events
        this.joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isJoystickActive = true;
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            
            // Update joystick position
            this.updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isJoystickActive) {
                this.updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (this.isJoystickActive) {
                this.isJoystickActive = false;
                this.resetJoystick();
            }
        });
    }
    
    updateJoystickPosition(touchX, touchY) {
        const baseRect = this.joystickBase.getBoundingClientRect();
        const centerX = baseRect.left + this.baseX;
        const centerY = baseRect.top + this.baseY;
        
        // Calculate distance from center
        const deltaX = touchX - centerX;
        const deltaY = touchY - centerY;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Normalize distance if it exceeds max
        if (distance > this.maxJoystickDistance) {
            const ratio = this.maxJoystickDistance / distance;
            distance = this.maxJoystickDistance;
            const newDeltaX = deltaX * ratio;
            const newDeltaY = deltaY * ratio;
            
            // Update thumb position
            this.joystickThumb.style.left = `${this.baseX + newDeltaX - 25}px`;
            this.joystickThumb.style.top = `${this.baseY + newDeltaY - 25}px`;
            
            // Calculate direction vectors
            this.directionX = newDeltaX / this.maxJoystickDistance;
            this.directionY = newDeltaY / this.maxJoystickDistance;
        } else {
            // Update thumb position directly
            this.joystickThumb.style.left = `${this.baseX + deltaX - 25}px`;
            this.joystickThumb.style.top = `${this.baseY + deltaY - 25}px`;
            
            // Calculate direction vectors
            this.directionX = deltaX / this.maxJoystickDistance;
            this.directionY = deltaY / this.maxJoystickDistance;
        }
        
        // Save joystick data
        this.joystickDistance = distance;
        this.joystickAngle = Math.atan2(deltaY, deltaX);
        
        // Update player direction based on joystick
        if (this.player) {
            // Update direction for display
            if (Math.abs(this.directionX) > Math.abs(this.directionY)) {
                this.player.direction = this.directionX > 0 ? 'right' : 'left';
            } else {
                this.player.direction = this.directionY > 0 ? 'down' : 'up';
            }
        }
        
        // Update the engine's key state to simulate keyboard input
        if (this.engine) {
            this.engine.keys['KeyW'] = this.directionY < -0.3;
            this.engine.keys['KeyS'] = this.directionY > 0.3;
            this.engine.keys['KeyA'] = this.directionX < -0.3;
            this.engine.keys['KeyD'] = this.directionX > 0.3;
            
            // Sprint if joystick is fully extended
            this.engine.keys['ShiftLeft'] = (distance > this.maxJoystickDistance * 0.8);
        }
    }
    
    resetJoystick() {
        // Return joystick to center
        this.joystickThumb.style.left = `${this.baseX - 25}px`;
        this.joystickThumb.style.top = `${this.baseY - 25}px`;
        
        // Reset direction
        this.directionX = 0;
        this.directionY = 0;
        
        // Reset key states
        if (this.engine) {
            this.engine.keys['KeyW'] = false;
            this.engine.keys['KeyS'] = false;
            this.engine.keys['KeyA'] = false;
            this.engine.keys['KeyD'] = false;
            this.engine.keys['ShiftLeft'] = false;
        }
    }
    
    shootTowardsMoveDirection() {
        if (!this.player || !this.engine) return;
        
        if (this.joystickDistance < 10) {
            // Shoot in current facing direction if not moving much
            let dirX = 0;
            let dirY = 0;
            
            switch (this.player.direction) {
                case 'up': dirY = -1; break;
                case 'down': dirY = 1; break;
                case 'left': dirX = -1; break;
                case 'right': dirX = 1; break;
            }
            
            this.engine.shootArrow(dirX, dirY);
        } else {
            // Shoot in movement direction
            this.engine.shootArrow(this.directionX, this.directionY);
        }
    }
    
    update() {
        // Continuous update - any logic that needs to run every frame
    }
}