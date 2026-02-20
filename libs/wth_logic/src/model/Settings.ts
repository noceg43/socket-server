export interface RoomSettings {
    rounds: number;
    timerDuration: number; // in seconds
}

export const DEFAULT_SETTINGS: RoomSettings = {
    rounds: 3,
    timerDuration: 60,
};
