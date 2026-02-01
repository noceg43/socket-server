import {
  RoomStatus,
  JoinStateSchema,
  GameSettings,
  FillStateSchema,
  StartedStateSchema,
  FinishedStateSchema,
  RoomStateData
} from '@/types'
import { ValidationError } from '@/errors'

// ==========================================
// ABSTRACT BASE CLASS
// ==========================================
export abstract class BaseRoomState {
  abstract readonly status: RoomStatus;

  public readonly gameSettings: GameSettings;

  constructor(gameSettings: GameSettings) {
    this.gameSettings = gameSettings;
  }
}

// ==========================================
// 1. JOIN STATE
// ==========================================

export class JoinState extends BaseRoomState {
  readonly status = RoomStatus.JOIN;
  public readyUsersId: string[];

  constructor(data: Extract<RoomStateData, { status: 'join' }>) {
    try {
      const validated = JoinStateSchema.parse(data);
      super(validated.gameSettings);
      this.readyUsersId = validated.readyUsersId;
    } catch (error) {
      throw new ValidationError('Invalid Join State data');
    }
  }
}

export class FillState extends BaseRoomState {
  readonly status = RoomStatus.FILL;

  constructor(data: Extract<RoomStateData, { status: 'fill' }>) {
    try {
      const validated = FillStateSchema.parse(data);
      super(validated.gameSettings);
    } catch {
      throw new ValidationError('Invalid Fill State data');
    }
  }
}

export class StartedState extends BaseRoomState {
  readonly status = RoomStatus.STARTED;

  constructor(data: Extract<RoomStateData, { status: 'started' }>) {
    try {
      const validated = StartedStateSchema.parse(data);
      super(validated.gameSettings);
    } catch {
      throw new ValidationError('Invalid Started State data');
    }
  }
}

export class FinishedState extends BaseRoomState {
  readonly status = RoomStatus.FINISHED;

  constructor(data: Extract<RoomStateData, { status: 'finished' }>) {
    try {
      const validated = FinishedStateSchema.parse(data);
      super(validated.gameSettings);
    } catch {
      throw new ValidationError('Invalid Finished State data');
    }
  }
}

export type RoomState = JoinState | FillState | StartedState | FinishedState;

/**
 * Helper function to re-instantiate the correct State class from plain state data
 */
export function restoreStateInstance(stateData: RoomStateData): RoomState {
  switch (stateData.status) {
    case RoomStatus.JOIN:
      return new JoinState(stateData as Extract<RoomStateData, { status: 'join' }>)

    case RoomStatus.FILL:
      return new FillState(stateData as Extract<RoomStateData, { status: 'fill' }>)

    case RoomStatus.STARTED:
      return new StartedState(stateData as Extract<RoomStateData, { status: 'started' }>)

    case RoomStatus.FINISHED:
      return new FinishedState(stateData as Extract<RoomStateData, { status: 'finished' }>)

    default:
      // Fallback for exhaustive type checking, though Zod prevents this
      throw new ValidationError('Unknown room state status')
  }
}