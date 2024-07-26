import { Sprite } from './sprite.js';
import { Debug } from './debug.js';
import { InputManager } from './input.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const spriteSelect = document.getElementById('spriteSelect');
const debugToggle = document.getElementById('debugToggle');
const debugInfo = document.getElementById('debugInfo');
const inputQueue = document.getElementById('inputQueue');

let sprite = new Sprite('assets/remilia.png', 24, 32, 4, 4, 3); // Increase scale to make the sprite larger
const debug = new Debug(canvas, debugInfo);
const input = new InputManager();

let spriteX = canvas.width / 2 - sprite.scaledWidth / 2;
let spriteY = canvas.height / 2 - sprite.scaledHeight / 2;

let lastFrameTime = 0;
let fps = 0;

const characterProperties = {
    'assets/remilia.png': { frameDelay: 4 },
    'assets/cirno.png': { frameDelay: 4 },
    'assets/marisa.png': { frameDelay: 4 }
};

const states = {
    IDLE: 'idle',
    WALKING: 'walking',
    ROLLING: 'rolling'
};

const events = {
    MOVE: 'move',
    STOP: 'stop',
    ROLL: 'roll',
    UPDATE: 'update'
};

class EventQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(event) {
        this.queue.push(event);
        this.updateInputQueue();
    }

    dequeue() {
        const event = this.queue.shift();
        this.updateInputQueue();
        return event;
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    clear() {
        this.queue = [];
        this.updateInputQueue();
    }

    updateInputQueue() {
        inputQueue.innerHTML = `Queue: ${this.queue.map(e => e.type).join(', ')}`;
    }
}

const eventQueue = new EventQueue();

class PlayerStateMachine {
    constructor() {
        this.state = states.IDLE;
    }

    handleEvent(event) {
        switch (this.state) {
            case states.IDLE:
                if (event.type === events.MOVE) {
                    this.state = states.WALKING;
                } else if (event.type === events.ROLL) {
                    this.state = states.ROLLING;
                }
                break;
            case states.WALKING:
                if (event.type === events.STOP) {
                    this.state = states.IDLE;
                } else if (event.type === events.ROLL) {
                    this.state = states.ROLLING;
                }
                break;
            case states.ROLLING:
                if (event.type === events.UPDATE && !sprite.isRolling) {
                    this.state = states.WALKING;
                }
                break;
        }
    }
}

const playerStateMachine = new PlayerStateMachine();

window.addEventListener('keydown', function(e) {
    input.keyDown(e);
    if (e.key === 'Shift' && !sprite.isRolling) {
        eventQueue.enqueue({ type: events.ROLL });
    } else {
        eventQueue.enqueue({ type: events.MOVE });
    }
});

window.addEventListener('keyup', function(e) {
    input.keyUp(e);
    eventQueue.enqueue({ type: events.STOP });
});

spriteSelect.addEventListener('change', function(e) {
    const selectedSprite = e.target.value;
    sprite = new Sprite(selectedSprite, 24, 32, 4, 4, 3); // Increase scale to make the sprite larger
    sprite.frameX = 0;
    sprite.frameCounter = 0;
    sprite.rollFrameCounter = 0;

    // Update frameDelay based on the selected character
    if (characterProperties[selectedSprite]) {
        sprite.frameDelay = characterProperties[selectedSprite].frameDelay;
    } else {
        sprite.frameDelay = 4; // Default value if not specified
    }

    // Check for idle animation if Cirno is selected
    if (selectedSprite === 'assets/cirno.png') {
        sprite.idleFrames = 2;
        sprite.isIdle = true;
    } else {
        sprite.isIdle = false;
    }
});

debugToggle.addEventListener('click', function() {
    debug.toggleDebug();
});

function update(deltaTime) {
    const keys = input.getKeys();

    if (keys['w'] || keys['a'] || keys['s'] || keys['d']) {
        eventQueue.enqueue({ type: events.MOVE });
    } else {
        eventQueue.enqueue({ type: events.STOP });
    }

    while (!eventQueue.isEmpty()) {
        const event = eventQueue.dequeue();
        playerStateMachine.handleEvent(event);
    }

    switch (playerStateMachine.state) {
        case states.IDLE:
            if (sprite.isIdle && sprite.image.src.includes('cirno')) {
                handleIdleAnimation();
            } else {
                sprite.frameX = 0;
                sprite.frameCounter = 0;
            }
            break;
        case states.WALKING:
            handleWalking();
            break;
        case states.ROLLING:
            handleRolling();
            break;
    }

    // Boundary checks for wrapping
    if (spriteX < -sprite.scaledWidth) {
        spriteX = canvas.width;
    } else if (spriteX > canvas.width) {
        spriteX = -sprite.scaledWidth;
    }
    if (spriteY < -sprite.scaledHeight) {
        spriteY = canvas.height;
    } else if (spriteY > canvas.height) {
        spriteY = -sprite.scaledHeight;
    }
}

function handleWalking() {
    let moving = false;
    const keys = input.getKeys();
    if (keys['w'] && keys['d']) {
        spriteY -= 2;
        spriteX += 2;
        sprite.frameY = 1; // Up-Right
        moving = true;
    } else if (keys['w'] && keys['a']) {
        spriteY -= 2;
        spriteX -= 2;
        sprite.frameY = 7; // Up-Left
        moving = true;
    } else if (keys['s'] && keys['d']) {
        spriteY += 2;
        spriteX += 2;
        sprite.frameY = 3; // Down-Right
        moving = true;
    } else if (keys['s'] && keys['a']) {
        spriteY += 2;
        spriteX -= 2;
        sprite.frameY = 5; // Down-Left
        moving = true;
    } else if (keys['w']) {
        spriteY -= 2;
        sprite.frameY = 0; // Up
        moving = true;
    } else if (keys['a']) {
        spriteX -= 2;
        sprite.frameY = 6; // Left
        moving = true;
    } else if (keys['s']) {
        spriteY += 2;
        sprite.frameY = 4; // Down
        moving = true;
    } else if (keys['d']) {
        spriteX += 2;
        sprite.frameY = 2; // Right
        moving = true;
    }

    if (moving) {
        sprite.frameCounter++;
        if (sprite.frameCounter >= sprite.frameDelay) {
            sprite.frameCounter = 0;
            sprite.frameX = (sprite.frameX + 1) % sprite.frameCount;
        }
    } else {
        sprite.frameX = 0;
        sprite.frameCounter = 0;
        playerStateMachine.state = states.IDLE;
    }
}

function handleRolling() {
    sprite.isRolling = true;
    sprite.frameCounter++;
    if (sprite.frameCounter >= sprite.frameDelay) {
        sprite.frameCounter = 0;
        sprite.rollFrameCounter++;
        if (sprite.rollFrameCounter >= sprite.rollFrames) {
            sprite.isRolling = false;
            sprite.rollFrameCounter = 0;
        } else {
            sprite.frameX = sprite.rollFrameCounter + sprite.frameCount; // Access the rolling frames
        }
    }

    // Move the character forward during the roll animation with extended distance
    switch (sprite.frameY) {
        case 0: spriteY -= 8; break; // Up
        case 1: spriteY -= 6; spriteX += 6; break; // Up-Right
        case 2: spriteX += 8; break; // Right
        case 3: spriteY += 6; spriteX += 6; break; // Down-Right
        case 4: spriteY += 8; break; // Down
        case 5: spriteY += 6; spriteX -= 6; break; // Down-Left
        case 6: spriteX -= 8; break; // Left
        case 7: spriteY -= 6; spriteX -= 6; break; // Up-Left
    }

    if (!sprite.isRolling) {
        playerStateMachine.state = states.WALKING;
    }
}

function handleIdleAnimation() {
    sprite.frameCounter++;
    if (sprite.frameCounter >= sprite.frameDelay) {
        sprite.frameCounter = 0;
        sprite.frameX = (sprite.frameX + 1) % sprite.idleFrames;
    }
}

function drawCheckerboard(ctx, canvas, numRows, numCols) {
    const cellWidth = canvas.width / numCols;
    const cellHeight = canvas.height / numRows;
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            if ((row + col) % 2 === 0) {
                ctx.fillStyle = '#CCCCCC';
            } else {
                ctx.fillStyle = '#666666';
            }
            ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
    }
}

function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    fps = 1 / deltaTime;

    drawCheckerboard(ctx, canvas, 10, 10); // Adjust the number of rows and columns as needed
    sprite.draw(ctx, spriteX, spriteY);
    update(deltaTime);
    debug.updateDebugInfo({
        state: playerStateMachine.state,
        spriteX,
        spriteY,
        frameDelay: sprite.frameDelay,
        isRolling: sprite.isRolling,
        frameCounter: sprite.frameCounter,
        rollFrameCounter: sprite.rollFrameCounter,
        fps,
        keys: input.getKeys(),
        lastEvent: input.getLastEvent()
    });

    requestAnimationFrame(gameLoop);
}

sprite.image.onload = function() {
    gameLoop(0);
};
