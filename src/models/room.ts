import { Room as LogicRoom, GameStateSchema, GameState, createInitialGameState } from 'wth_logic'
import { RoomError } from '@/errors'

export class Room {
  public readonly id: string
  public gameState: LogicRoom

  constructor(id: string, initialState?: GameState) {
    this.id = id
    this.gameState = new LogicRoom(initialState ?? createInitialGameState(), `${id}.log`, id)
  }

  isUserInRoom(userId: string): boolean {
    return !!this.gameState.getUser(userId)
  }

  static create(id: string): Room {
    if (!id) {
      throw new RoomError('Room ID is required', 400)
    }
    return new Room(id)
  }

  // Hydration sicura usando Zod
  static fromJSON(data: any): Room {
    if (!data || !data.id || !data.state) {
      throw new RoomError('Invalid room data format', 500)
    }

    try {
      // Validazione runtime rigorosa: se Redis ha dati corrotti, fallisce qui invece di rompere il gioco
      const validatedState = GameStateSchema.parse(data.state)
      return new Room(data.id, validatedState)
    } catch (error) {
      console.error(`State validation failed for room ${data.id}:`, error)
      throw new RoomError('Corrupted state in database', 500)
    }
  }

  // Serializzazione POJO perfetta
  toJSON() {
    return {
      id: this.id,
      state: this.gameState.state
    }
  }
}

export default Room