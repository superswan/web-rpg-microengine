//sprite handling
export class Sprite {
    constructor(imageSrc, width, height, frameCount, rollFrames, scale = 2) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.width = width;
        this.height = height;
        this.frameCount = frameCount;
        this.rollFrames = rollFrames;
        this.frameX = 0;
        this.frameY = 0;
        this.frameCounter = 0;
        this.rollFrameCounter = 0;
        this.frameDelay = 5;
        this.isRolling = false;
        this.scale = scale;
        this.scaledWidth = width * scale;
        this.scaledHeight = height * scale;
        this.isIdle = false;
        this.idleFrames = 0;
    }

    draw(ctx, x, y) {
        ctx.drawImage(
            this.image,
            this.frameX * this.width,
            this.frameY * this.height,
            this.width,
            this.height,
            x,
            y,
            this.scaledWidth,
            this.scaledHeight
        );
    }

    update(state, keys) {
        switch (state) {
            case 'idle':
                this.handleIdle();
                break;
            case 'walking':
                this.handleWalking(keys);
                break;
            case 'rolling':
                this.handleRolling();
                break;
        }
    }

    handleIdle() {
        if (this.isIdle) {
            this.frameCounter++;
            if (this.frameCounter >= this.frameDelay) {
                this.frameCounter = 0;
                this.frameX = (this.frameX + 1) % this.idleFrames;
            }
        }
    }

    handleWalking(keys) {
        let moving = false;
        if (keys['w'] && keys['d']) {
            this.frameY = 1; // Up-Right
            moving = true;
        } else if (keys['w'] && keys['a']) {
            this.frameY = 7; // Up-Left
            moving = true;
        } else if (keys['s'] && keys['d']) {
            this.frameY = 3; // Down-Right
            moving = true;
        } else if (keys['s'] && keys['a']) {
            this.frameY = 5; // Down-Left
            moving = true;
        } else if (keys['w']) {
            this.frameY = 0; // Up
            moving = true;
        } else if (keys['a']) {
            this.frameY = 6; // Left
            moving = true;
        } else if (keys['s']) {
            this.frameY = 4; // Down
            moving = true;
        } else if (keys['d']) {
            this.frameY = 2; // Right
            moving = true;
        }

        if (moving) {
            this.frameCounter++;
            if (this.frameCounter >= this.frameDelay) {
                this.frameCounter = 0;
                this.frameX = (this.frameX + 1) % this.frameCount;
            }
        } else {
            this.frameX = 0;
            this.frameCounter = 0;
        }
    }

    handleRolling() {
        this.isRolling = true;
        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.frameCounter = 0;
            this.rollFrameCounter++;
            if (this.rollFrameCounter >= this.rollFrames) {
                this.isRolling = false;
                this.rollFrameCounter = 0;
                this.frameX = 0;
            } else {
                this.frameX = this.rollFrameCounter + this.frameCount; // Access the rolling frames
            }
        }
    }
}

export const characterProperties = {
    'assets/remilia.png': { frameDelay: 4 },
    'assets/cirno.png': { frameDelay: 4 },
    'assets/marisa.png': { frameDelay: 4 },
    'assets/patchouli.png': { frameDelay: 4 }
};
