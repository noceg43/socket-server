import { Room as RoomType, RoomSchema } from '@/types'
import { ValidationError, RoomError } from '@/errors'
import { User } from './user'

export class Room implements RoomType {
  public readonly id: string
  public joinedPlayers: User[]
  public state: Record<string, unknown> | null

  constructor(id: string, joinedPlayers: User[] = [], state: Record<string, unknown> | null = null) {
    try {
      // Validate the basic structure - convert users to plain objects for validation
      const validatedData = RoomSchema.parse({
        id,
        joinedPlayers: joinedPlayers.map(user => ({ id: user.id, name: user.name })),
        state
      })

      this.id = validatedData.id
      this.joinedPlayers = joinedPlayers
      this.state = validatedData.state
    } catch {
      throw new ValidationError('Invalid room data')
    }
  }

  isUserInRoom(user: User): boolean {
    if (!(user instanceof User)) {
      throw new RoomError('Invalid user object provided', 400)
    }
    return this.joinedPlayers.some((joinedUser) => joinedUser.id === user.id)
  }

  static create(id: string): Room {
    if (!id) {
      throw new RoomError('Room ID is required', 400)
    }
    return new Room(id)
  }

  addUser(user: User): void {
    if (!(user instanceof User)) {
      throw new RoomError('Invalid user object provided', 400)
    }

    const exists = this.joinedPlayers.some(
      (joinedUser) => joinedUser.id === user.id
    )

    if (!exists) {
      this.joinedPlayers.push(user)
    }
  }

  removeUser(user: User): void {
    if (!(user instanceof User)) {
      throw new RoomError('Invalid user object provided', 400)
    }

    this.joinedPlayers = this.joinedPlayers.filter(
      (joinedUser) => joinedUser.id !== user.id
    )
  }

  static fromRoomData(roomData: unknown): Room {
    try {
      const validatedData = RoomSchema.parse(roomData)
      const joinedPlayers = validatedData.joinedPlayers.map((userData) =>
        User.fromUserData(userData)
      )

      return new Room(validatedData.id, joinedPlayers, validatedData.state)
    } catch {
      throw new ValidationError('Invalid room data format')
    }
  }
}

export default Room
