// Event Queue
export class EventQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(event) {
        this.queue.push(event);
    }

    dequeue() {
        return this.queue.shift();
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    clear() {
        this.queue = [];
    }
}

// State Machine
export const states = {
    IDLE: 'idle',
    WALKING: 'walking',
    ROLLING: 'rolling'
};

export const events = {
    MOVE: 'move',
    STOP: 'stop',
    ROLL: 'roll',
    STOP_ROLLING: 'stop_rolling'
};

export class PlayerStateMachine {
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
                if (event.type === events.STOP_ROLLING) {
                    this.state = states.IDLE;
                }
                break;
        }
    }
}

// Input Manager
export class InputManager {
    constructor() {
        this.keys = {};
        this.keyTimestamps = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(e) {
        if (!this.keys[e.key]) {
            this.keys[e.key] = true;
            this.keyTimestamps[e.key] = Date.now();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    getKeys() {
        return this.keys;
    }

    getLatestKey() {
        let latestKey = null;
        let latestTimestamp = 0;
        for (let key in this.keyTimestamps) {
            if (this.keys[key] && this.keyTimestamps[key] > latestTimestamp) {
                latestKey = key;
                latestTimestamp = this.keyTimestamps[key];
            }
        }
        return latestKey;
    }

    clearKeys() {
        this.keys = {};
    }
}
