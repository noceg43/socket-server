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

const StateRegistry: Record<string, new (...args: any[]) => GameState> = {
    JoinState,
    FillState,
    StartedState,
    ErrorState
};

export interface SerializedRoom {
    id: string;
    users: any[];
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
        return {
            id: roomId,
            users: room.users,
            settings: room.settings,
            slots: (room.slotManager as any).slots,
            state: room.state.toJSON()
        };
    }

    /**
     * Reconstructs a Logic Room from a serialized JSON object.
     */
    static fromJSON(data: SerializedRoom): LogicRoom {
        const logger = new ConsoleLogger();

        const StateClass = StateRegistry[data.state.name] || JoinState;

        let initialState: GameState;
        if (StateClass === ErrorState) {
            initialState = new ErrorState(data.state.data?.errorMessage || 'Unknown error');
        } else {
            initialState = new StateClass();
        }

        const room = new LogicRoom(initialState, logger);
        room.settings = { ...data.settings };

        // Restore state data
        if (data.state.data) {
            const { name, ...stateData } = data.state.data;
            Object.assign(room.state, stateData);

            // Special handling for Map in FillState
            if (room.state instanceof FillState && data.state.data.takes) {
                (room.state as any).takes = new Map(data.state.data.takes);
            }
        }

        // Reconstruct users
        room.users = data.users.map(u => {
            const user = new LogicUser(u.id, u.name, u.slot);
            Object.assign(user, u);
            return user;
        });

        // Reconstruct SlotManager slots
        if (data.slots && room.slotManager) {
            (room.slotManager as any).slots = [...data.slots];
        }

        return room;
    }
}
