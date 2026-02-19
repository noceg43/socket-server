import {
    Room as LogicRoom,
    User as LogicUser,
    GameState,
    JoinState,
    FillState,
    StartedState,
    ErrorState
} from 'wth_logic';
import { ConsoleLogger } from './ConsoleLogger';

export interface SerializedRoom {
    id: string;
    users: {
        id: string;
        name: string;
        slot: number;
        joinedAt: number;
    }[];
    settings: {
        rounds: number;
        timerDuration: number;
    };
    slots: (string | null)[];
    state: {
        name: string;
        data?: any;
    };
}

export class LogicConverter {
    /**
     * Converts a Logic Room to a serializable JSON object.
     */
    static toJSON(roomId: string, room: LogicRoom): SerializedRoom {
        const serialized: SerializedRoom = {
            id: roomId,
            users: room.users.map(u => ({
                id: u.id,
                name: u.name,
                slot: u.slot,
                joinedAt: u.joinedAt
            })),
            settings: room.settings,
            slots: (room.slotManager as any).slots,
            state: {
                name: room.state.name
            }
        };

        if (room.state instanceof JoinState) {
            serialized.state.data = {
                countdownValue: (room.state as any).countdownValue,
                isCountingDown: (room.state as any).isCountingDown
            };
        } else if (room.state instanceof FillState) {
            serialized.state.data = {
                takes: Array.from((room.state as any).takes.entries())
            };
        } else if (room.state instanceof ErrorState) {
            serialized.state.data = {
                errorMessage: (room.state as any).errorMessage
            };
        } else if (room.state instanceof StartedState) {
            // Currently StartedState doesn't have internal data to persist in wth_logic
            serialized.state.data = {};
        }

        return serialized;
    }

    /**
     * Reconstructs a Logic Room from a serialized JSON object.
     */
    static fromJSON(data: SerializedRoom): LogicRoom {
        const logger = new ConsoleLogger();

        let initialState: GameState;
        switch (data.state.name) {
            case 'FillState':
                initialState = new FillState();
                break;
            case 'StartedState':
                initialState = new StartedState();
                break;
            case 'ErrorState':
                initialState = new ErrorState(data.state.data?.errorMessage || 'Unknown error');
                break;
            case 'JoinState':
            default:
                initialState = new JoinState();
                break;
        }

        const room = new LogicRoom(initialState, logger);

        room.settings = { ...data.settings };

        // Re-populate state data AFTER constructor because onEnter resets it
        if (room.state instanceof JoinState && data.state.data) {
            (room.state as any).countdownValue = data.state.data.countdownValue;
            (room.state as any).isCountingDown = data.state.data.isCountingDown;
        } else if (room.state instanceof FillState && data.state.data?.takes) {
            (room.state as any).takes = new Map(data.state.data.takes);
        }

        // Reconstruct users
        room.users = data.users.map(u => {
            const user = new LogicUser(u.id, u.name, u.slot);
            (user as any).joinedAt = u.joinedAt;
            return user;
        });

        // Reconstruct SlotManager slots
        if (data.slots && room.slotManager) {
            (room.slotManager as any).slots = [...data.slots];
        }

        return room;
    }
}
