// game.js
import { Sprite, characterProperties } from './sprite.js';
import { Debug } from './debug.js';
import { EventQueue, PlayerStateMachine, states, events, InputManager } from './logic.js';
import { drawMatrix, stopMatrix } from './matrix.js';

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const player = parseInt(params.get('player')) || 0;
    const debug = params.get('debug') === 'true';
    return { player, debug };
}

export class Game {
    constructor(canvas, spriteSelect, debugToggle, debugInfo, inputQueue) {
        if (Game.instance) {
            return Game.instance;
        }

        const { player, debug } = getUrlParams();
        
        Game.instance = this;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spriteSelect = spriteSelect;
        this.debugToggle = debugToggle;
        this.debugInfoElement = debugInfo;
        this.inputQueue = inputQueue;

        this.initializeGame(this.getPlayerSprite(player));
        this.debug.setDebugMode(debug);
        this.debugToggle.checked = debug;
        this.spriteSelect.selectedIndex = player;

        this.setupEventListeners();
    }

    getPlayerSprite(index) {
        const sprites = [
            'assets/remilia.png',
            'assets/cirno.png',
            'assets/marisa.png',
            'assets/patchouli.png'
        ];
        return sprites[index] || sprites[0];
    }

    initializeGame(spriteSrc) {
        if (this.isInitialized) {
            console.log("Game already initialized. Resetting...");
        } else {
            console.log("Initializing game for the first time");
        }

        console.log("Initializing game with sprite:", spriteSrc);
        this.sprite = new Sprite(spriteSrc, 24, 32, 4, 4, 3);
        
        // Destroy existing debug instance if it exists
        if (this.debug) {
            this.debug.destroy();
        }
        
        // Create a new debug instance
        this.debug = new Debug(this.canvas, this.debugInfoElement);
        this.debug.setDebugMode(this.debugToggle.checked);

        
        this.input = new InputManager();
        this.eventQueue = new EventQueue(this.inputQueue);
        this.playerStateMachine = new PlayerStateMachine();

        // SPAWN MECHANICS
         // Set random spawn position within +/- 16 pixels around the origin
        const randomOffsetX = Math.floor(Math.random() * 129) - 64; // Random value between -16 and +16
        const randomOffsetY = Math.floor(Math.random() * 129) - 64; // Random value between -16 and +16

        this.spriteX = (this.canvas.width / 2 - this.sprite.scaledWidth / 2) + randomOffsetX;
        this.spriteY = (this.canvas.height / 2 - this.sprite.scaledHeight / 2) + randomOffsetY;

         // Set random initial direction
    const directions = ['up', 'down', 'left', 'right', 'up-right', 'up-left', 'down-right', 'down-left'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];

    switch (randomDirection) {
        case 'up':
            this.sprite.frameY = 0;
            break;
        case 'down':
            this.sprite.frameY = 4;
            break;
        case 'left':
            this.sprite.frameY = 6;
            break;
        case 'right':
            this.sprite.frameY = 2;
            break;
        case 'up-right':
            this.sprite.frameY = 1;
            break;
        case 'up-left':
            this.sprite.frameY = 7;
            break;
        case 'down-right':
            this.sprite.frameY = 3;
            break;
        case 'down-left':
            this.sprite.frameY = 5;
            break;
    }

        // Frame processing stuff and debug stuff
        this.lastFrameTime = 0;
        this.fps = 0;
        this.rollFrameCounter = 0;
        this.lastEvent = 'None';

        this.lastKeyTime = 0;
        this.debounceDelay = 10;


        // Adjust sprite properties if specified in characterProperties
        if (characterProperties[spriteSrc]) {
            this.sprite.frameDelay = characterProperties[spriteSrc].frameDelay;
        }

        if (spriteSrc === 'assets/cirno.png') {
            this.sprite.idleFrames = 2;
            this.sprite.isIdle = true;
        } else {
            this.sprite.isIdle = false;
        }

        // Ensure debug toggle is in sync with the new debug instance
        this.debugToggle.checked = this.debug.debugMode;
        const isDebugOn = this.debug.debugMode;

        if (isDebugOn) {
            document.dispatchEvent(new Event('startMatrix'));
        } else {
            document.dispatchEvent(new Event('stopMatrix'));
        }

        this.isInitialized = true;

    }

    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        this.spriteSelect.addEventListener('change', this.handleSpriteChange.bind(this));
        this.debugToggle.addEventListener('click', this.handleDebugToggle.bind(this));
    }

    handleDebugToggle(e) {
        const isDebugOn = e.target.checked; // Toggle the current state
        this.debug.setDebugMode(isDebugOn);
        console.log("Debug mode toggled:", isDebugOn);
        
        if (isDebugOn) {
            document.dispatchEvent(new Event('startMatrix'));
        } else {
            document.dispatchEvent(new Event('stopMatrix'));
        }
    }

    handleKeyDown(e) {
        this.input.handleKeyDown(e);
        if (e.key === 'Escape') {
            document.dispatchEvent(new Event('stopMatrix'));
            this.initializeGame(this.getPlayerSprite(this.spriteSelect.selectedIndex));
        }
    }

    handleKeyUp(e) {
        this.input.handleKeyUp(e);

    }

    handleSpriteChange(e) {
        const selectedSprite = e.target.value;
        this.initializeGame(selectedSprite);
        // store sprite selection in URL
        const params = new URLSearchParams(window.location.search);
        params.set('player', this.spriteSelect.selectedIndex);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }

    update(deltaTime) {
        const currentTime = Date.now();
            if (currentTime - this.lastKeyTime < this.debounceDelay) {
                return; // Skip update if within debounce delay
        }

        this.lastKeyTime = currentTime;

        const keys = this.input.getKeys();
        const speed = 200; // pixels per second

        if (keys['Shift']) {
            this.rollFrameCounter++;
        } else {
            this.rollFrameCounter = 0;
        }

        if (this.rollFrameCounter > 3) {
            this.eventQueue.enqueue({ type: events.ROLL });
            this.lastEvent = events.ROLL;
        } else {
            const latestKey = this.input.getLatestKey();
            if (latestKey) {
                this.eventQueue.enqueue({ type: events.MOVE });
                this.lastEvent = events.MOVE;
            } else {
                this.eventQueue.enqueue({ type: events.STOP });
                this.lastEvent = events.STOP;
            }
        }

        while (!this.eventQueue.isEmpty()) {
            const event = this.eventQueue.dequeue();
            this.playerStateMachine.handleEvent(event);
        }

        if (this.sprite.isRolling && this.playerStateMachine.state === states.ROLLING && this.sprite.rollFrameCounter === 0) {
            this.eventQueue.enqueue({ type: events.STOP_ROLLING });
            this.lastEvent = events.STOP_ROLLING;
        }

        this.sprite.update(this.playerStateMachine.state, keys);

        // Update sprite position based on movement
        this.updateSpritePosition(keys, deltaTime, speed);

        // Boundary checks for wrapping
        if (this.spriteX < -this.sprite.scaledWidth) {
            this.spriteX = this.canvas.width;
        } else if (this.spriteX > this.canvas.width) {
            this.spriteX = -this.sprite.scaledWidth;
        }
        if (this.spriteY < -this.sprite.scaledHeight) {
            this.spriteY = this.canvas.height;
        } else if (this.spriteY > this.canvas.height) {
            this.spriteY = -this.sprite.scaledHeight;
        }
    }

    updateSpritePosition(keys, deltaTime, speed) {
        const distance = speed * deltaTime;
        if (keys['w']) this.spriteY -= distance;
        if (keys['s']) this.spriteY += distance;
        if (keys['a']) this.spriteX -= distance;
        if (keys['d']) this.spriteX += distance;
    }

    drawCheckerboard() {
        const numRows = 10;
        const numCols = 10;
        const cellWidth = this.canvas.width / numCols;
        const cellHeight = this.canvas.height / numRows;
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                this.ctx.fillStyle = (row + col) % 2 === 0 ? '#CCCCCC' : '#666666';
                this.ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    drawBackground() {
        const background = new Image();
        background.src = '/assets/bg.png';

        background.onload = () => {
            this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);

            if (this.debug.debugMode) {
                this.drawCheckerboard();
            }
        };
    }

    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        this.fps = 1 / deltaTime;

        this.drawBackground();
        this.sprite.draw(this.ctx, this.spriteX, this.spriteY);
        this.update(deltaTime);
        this.debug.updateDebugInfo({
            state: this.playerStateMachine.state,
            spriteX: this.spriteX,
            spriteY: this.spriteY,
            frameDelay: this.sprite.frameDelay,
            isRolling: this.sprite.isRolling,
            frameCounter: this.sprite.frameCounter,
            rollFrameCounter: this.sprite.rollFrameCounter,
            fps: this.fps,
            keys: this.input.getKeys(),
            lastEvent: this.lastEvent
        });

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    start() {
        this.gameLoop(0);
    }
}

// Initialize and start the game
export function createAndStartGame() {
    const canvas = document.getElementById('gameCanvas');
    const spriteSelect = document.getElementById('spriteSelect');
    const debugToggle = document.getElementById('debugToggle');
    const debugInfo = document.getElementById('debugInfo');
    const inputQueue = document.getElementById('inputQueue');

    const game = new Game(canvas, spriteSelect, debugToggle, debugInfo, inputQueue);
    game.start();

    // Update URL when debug checkbox changes
    debugToggle.addEventListener('change', (e) => {
        const params = new URLSearchParams(window.location.search);
        params.set('debug', e.target.checked);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    });
}