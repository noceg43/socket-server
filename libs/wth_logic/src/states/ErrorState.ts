import { GameState } from './GameState';
import { Room } from '../core/Room';
import { GameInputEvent } from '../model/InputEvents';
import { JoinState } from './JoinState';

export class ErrorState extends GameState {
    public name = 'ErrorState';

    constructor(private errorMessage: string) {
        super();
    }

    public onEnter(room: Room): void {
        room.logger.logError(this.errorMessage);

        // Auto-recover after 5 seconds
        setTimeout(() => {
            if (room.state instanceof ErrorState) {
                room.transitionTo(new JoinState());
            }
        }, 5000);
    }

    public handle(room: Room, event: GameInputEvent): void {
        room.logger.logEvent(room.state.name, { type: 'ignored-event', payload: event });
    }
}
