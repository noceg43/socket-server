import { Room } from '../core/Room';
import { GameInputEvent } from '../model/InputEvents';

export abstract class GameState {
    public abstract name: string;

    public abstract handle(room: Room, event: GameInputEvent): void;

    public toJSON(): any {
        return {
            name: this.name,
            data: { ...this }
        };
    }

    public onEnter(room: Room): void {
        // Optional hook
    }

    public onExit(room: Room): void {
        // Optional hook
    }
}
