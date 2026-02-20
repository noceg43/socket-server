import { Room as LogicRoom, JoinState } from 'wth_logic'
import { RoomError } from '@/errors'
import { User } from './user'
import { ConsoleLogger } from '../utils/ConsoleLogger'
import { LogicConverter, SerializedRoom } from '../utils/logic-converter'

export class Room {
  public readonly id: string
  public logicRoom: LogicRoom
  public onStateChange?: (room: Room) => void

  constructor(id: string, logicRoom?: LogicRoom) {
    this.id = id
    this.logicRoom = logicRoom || new LogicRoom(new JoinState(), new ConsoleLogger())

    this.logicRoom.on('transition', () => {
      if (this.onStateChange) {
        this.onStateChange(this)
      }
    })
  }

  isUserInRoom(user: User): boolean {
    return !!this.logicRoom.getUser(user.id)
  }

  static create(id: string): Room {
    if (!id) {
      throw new RoomError('Room ID is required', 400)
    }
    return new Room(id)
  }

  // Delegate to LogicRoom via events or direct methods if needed
  // But typically we should use room.logicRoom.processEvent(...)

  toJSON(): SerializedRoom {
    return LogicConverter.toJSON(this.id, this.logicRoom)
  }

  static fromJSON(data: any): Room {
    const logicRoom = LogicConverter.fromJSON(data as SerializedRoom)
    return new Room(data.id, logicRoom)
  }
}

export default Room
