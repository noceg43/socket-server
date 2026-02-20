import { GameState } from './GameState';
import { Room } from '../core/Room';
import { GameInputEvent } from '../model/InputEvents';
import { User } from '../model/User';
import { FillState } from './FillState';
import { delay } from '../utils/AsyncUtils';
import { MIN_PLAYERS } from '../utils/Constants';

export class JoinState extends GameState {
    public name = 'JoinState';
    private countdownValue: number | null = null;
    private isCountingDown = false;

    public onEnter(room: Room): void {
        this.countdownValue = null;
        this.isCountingDown = false;
        room.logger.logEvent(this.name, { type: 'lobby-open' });
    }

    public handle(room: Room, event: GameInputEvent): void {
        switch (event.type) {
            case 'join-room':
                this.handleJoin(room, event.payload);
                break;
            case 'leave-room':
                this.handleLeave(room, event.payload.id);
                break;
            case 'ready':
                this.handleReady(room, event.payload.id, event.payload.isReady);
                break;
            case 'change-settings':
                if (this.isCountingDown) {
                    room.logger.logEvent(this.name, { type: 'settings-change-ignored', payload: { reason: 'Countdown in progress' } });
                    break;
                }
                if (event.payload.rounds) room.settings.rounds = event.payload.rounds;
                if (event.payload.timer) room.settings.timerDuration = event.payload.timer;
                room.logger.logEvent(this.name, { type: 'settings-changed', payload: room.settings });
                break;
        }
    }

    private handleJoin(room: Room, payload: { id: string; name: string }): void {
        if (room.getUser(payload.id)) return; // Already joined

        // Assign slot
        const slotIndex = room.slotManager.assignSlot(payload.id);
        if (slotIndex === -1) {
            // Room full
            room.logger.logEvent(this.name, { type: 'join-failed', payload: { reason: 'Room full', userId: payload.id } });
            return;
        }

        const newUser = new User(payload.id, payload.name, slotIndex);
        room.addUser(newUser);
        room.logger.logEvent(this.name, { type: 'user-joined', payload: { user: newUser, slot: slotIndex } });
    }

    private handleLeave(room: Room, userId: string): void {
        const user = room.getUser(userId);
        if (user) {
            room.removeUser(userId);
            room.slotManager.releaseSlot(userId);
            room.logger.logEvent(this.name, { type: 'user-left', payload: { userId } });

            // Interrupt countdown if active
            if (this.isCountingDown) {
                this.cancelCountdown(room, 'User left during countdown');
            }
        }
    }

    private handleReady(room: Room, userId: string, isReady: boolean): void {
        const user = room.getUser(userId);
        if (!user) return;

        user.isReady = isReady;
        room.logger.logEvent(this.name, { type: 'user-ready', payload: { userId, isReady } });

        if (!isReady && this.isCountingDown) {
            this.cancelCountdown(room, 'User unreadied');
            return;
        }

        this.checkStartCondition(room);
    }

    private checkStartCondition(room: Room): void {
        if (this.isCountingDown) return; // Already started

        const users = room.users;
        if (users.length < MIN_PLAYERS) return;

        const allReady = users.every(u => u.isReady);

        if (allReady) {
            this.startCountdown(room);
        }
    }

    private async startCountdown(room: Room): Promise<void> {
        this.isCountingDown = true;
        room.logger.logEvent(this.name, { type: 'countdown-start' });

        for (let i = 5; i > 0; i--) {
            this.countdownValue = i;

            await delay(1000);

            if (room.state !== this || !this.isCountingDown) {
                return;
            }
        }

        // Done
        if (this.isCountingDown && room.state === this) {
            room.transitionTo(new FillState());
        }
    }

    private cancelCountdown(room: Room, reason: string): void {
        this.isCountingDown = false;
        this.countdownValue = null;
        room.logger.logEvent(this.name, { type: 'countdown-cancelled', payload: { reason } });
    }
}
