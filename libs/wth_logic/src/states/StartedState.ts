import { GameState } from './GameState';
import { Room } from '../core/Room';
import { GameInputEvent } from '../model/InputEvents';

export class StartedState extends GameState {
    public name = 'StartedState';

    public handle(room: Room, event: GameInputEvent): void {
        room.logger.logEvent(this.name, event);
    }
}
