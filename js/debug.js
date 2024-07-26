// debug.js
export class Debug {
    constructor(canvas, debugInfoElement) {
        this.debugMode = false;
        this.canvas = canvas;
        this.debugInfoElement = debugInfoElement;
        this.setupStyles();
    }

    setupStyles() {
        this.debugInfoElement.style.fontFamily = 'monospace';
        this.debugInfoElement.style.fontSize = '10px';
        this.debugInfoElement.style.position = 'fixed';
        this.debugInfoElement.style.top = '10px';
        this.debugInfoElement.style.left = '10px';
        this.debugInfoElement.style.padding = '10px';
        this.debugInfoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugInfoElement.style.color = '#00ff00';
        this.debugInfoElement.style.border = 'none';
        this.debugInfoElement.style.borderRadius = '1px';
        this.debugInfoElement.style.zIndex = '1000';
        this.debugInfoElement.style.display = 'none';
    }

    setDebugMode(mode) {
        this.debugMode = mode;
        console.log("debug mode set to: " + mode)
        this.debugInfoElement.style.display = this.debugMode ? 'block' : 'none';
        this.updateCanvasBorder();
    }


    updateCanvasBorder() {
        if (this.debugMode) {
            this.canvas.style.border = '2px solid red';
        } else {
            this.canvas.style.border = 'none';
        }
    }

    updateDebugInfo(info) {
        if (this.debugMode) {
            this.debugInfoElement.innerHTML = `
                State: ${info.state}<br>
                X: ${Math.round(info.spriteX)}<br>
                Y: ${Math.round(info.spriteY)}<br>
                Frame Delay: ${info.frameDelay}<br>
                Is Rolling: ${info.isRolling}<br>
                Frame Counter: ${info.frameCounter}<br>
                Roll Frame Counter: ${info.rollFrameCounter}<br>
                FPS: ${Math.round(info.fps)}<br>
                Keys Pressed: ${Object.keys(info.keys).filter(key => info.keys[key]).join(', ')}<br>
                Last Event: ${info.lastEvent || 'None'}
            `;
        }
    }

    destroy() {
        this.debugInfoElement.remove();
    }
}