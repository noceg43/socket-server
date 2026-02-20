import { GameState } from './GameState';
import { Room } from '../core/Room';
import { GameInputEvent } from '../model/InputEvents';
import { StartedState } from './StartedState'; // Mock
import { ErrorState } from './ErrorState';

export class FillState extends GameState {
    public name = 'FillState';
    private takes: Map<string, string[]> = new Map();

    public toJSON(): any {
        return {
            name: this.name,
            data: {
                takes: Array.from(this.takes.entries())
            }
        };
    }

    public onEnter(room: Room): void {
        room.logger.logEvent(this.name, { type: 'phase-start', payload: 'Fill Phase Started' });
        this.takes.clear();
        // Initialize takes for current users
        room.users.forEach(user => {
            this.takes.set(user.id, []);
        });
    }

    public handle(room: Room, event: GameInputEvent): void {
        switch (event.type) {
            case 'add':
                this.handleAdd(room, event.payload.id, event.payload.text);
                break;
            case 'leave-room':
                this.handleLeave(room, event.payload.id);
                break;
            default:
                // Ignore other events
                break;
        }
    }

    private handleAdd(room: Room, userId: string, text: string): void {
        const user = room.getUser(userId);
        if (!user) return;

        if (text.trim().length === 0) return; // Basic validation

        // Get or create takes list for user
        let userTakes = this.takes.get(userId);
        if (!userTakes) {
            userTakes = [];
            this.takes.set(userId, userTakes);
        }

        // Takes are collected
        userTakes.push(text);
        room.logger.logEvent(this.name, { type: 'take-added', payload: { userId, count: userTakes.length } });

        // Check if user is done
        const requiredTakes = room.settings.rounds;

        if (userTakes.length >= requiredTakes) {
            // User is done.
            room.logger.logEvent(this.name, { type: 'user-finished', payload: { userId } });
        }

        // Check if ALL users are done
        // We need to ensure every user in the room has enough takes
        const allDone = room.users.every(u => {
            const t = this.takes.get(u.id);
            return t && t.length >= requiredTakes;
        });

        if (allDone) {
            room.transitionTo(new StartedState());
        }
    }

    private handleLeave(room: Room, userId: string): void {
        const user = room.getUser(userId);
        if (user) {
            room.removeUser(userId);
            room.slotManager.releaseSlot(userId);
            // Clean up takes
            this.takes.delete(userId);

            // "The math breaks" -> Error State
            room.transitionTo(new ErrorState(`User ${user.name} lost connection during Fill.`));
        }
    }
}
