export type GameInputEvent =
    | { type: 'join-room'; payload: { id: string; name: string } }
    | { type: 'leave-room'; payload: { id: string } }
    | { type: 'change-settings'; payload: { rounds?: number; timer?: number } }
    | { type: 'ready'; payload: { id: string; isReady: boolean } }
    | { type: 'add'; payload: { id: string; text: string } };
