import { EventEmitter } from 'events';
import { ILogger, FileLogger, NoOpLogger } from './Logger';
import { GameState } from '../states/GameState';
import { User } from '../model/User';
import { RoomSettings, DEFAULT_SETTINGS } from '../model/Settings';
import { SlotManager } from '../utils/SlotManager';
import { GameInputEvent } from '../model/InputEvents';
import { MAX_PLAYERS } from '../utils/Constants';

export class Room extends EventEmitter {
    public state: GameState;
    public users: User[] = [];
    public settings: RoomSettings = { ...DEFAULT_SETTINGS };
    public slotManager: SlotManager;
    public logger: ILogger;
    public readonly MAX_PLAYERS = MAX_PLAYERS;

    constructor(initialState: GameState, logger: ILogger = new NoOpLogger()) {
        super();
        this.logger = logger;

        this.slotManager = new SlotManager(this.MAX_PLAYERS);
        this.state = initialState;

        this.logger.logEvent('SYSTEM', { type: 'room-created', payload: { initialState: initialState.name } });
        this.state.onEnter(this);
    }

    public processEvent(event: GameInputEvent): void {
        try {
            this.logger.logEvent('ROOM', event);
            this.state.handle(this, event);
        } catch (e) {
            this.logger.logError(`Error processing event ${event.type}: ${e}`);
        }
    }

    public transitionTo(newState: GameState): void {
        const oldStateName = this.state.name;

        this.state.onExit(this);
        this.state = newState;
        this.state.onEnter(this);

        this.logger.logStateChange(oldStateName, newState.name);
        this.emit('transition', newState);
    }

    // Helper methods for list
    public getUser(id: string): User | undefined {
        return this.users.find(u => u.id === id);
    }

    public addUser(user: User): void {
        this.users.push(user);
    }

    public removeUser(id: string): void {
        this.users = this.users.filter(u => u.id !== id);
    }
}
