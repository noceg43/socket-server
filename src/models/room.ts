import { Room as LogicRoom, JoinState, FillState, StartedState, ErrorState } from 'wth_logic'
import { SlotManager } from 'wth_logic/dist/utils/SlotManager'
import { RoomError } from '@/errors'
import { User } from './user'
import { ConsoleLogger } from '../utils/ConsoleLogger'

export class Room {
  public readonly id: string
  public gameState: LogicRoom

  constructor(id: string, gameState?: LogicRoom) {
    this.id = id
    this.gameState = gameState || new LogicRoom(new JoinState(), new ConsoleLogger())
  }

  isUserInRoom(user: User): boolean {
    return !!this.gameState.getUser(user.id)
  }

  static create(id: string): Room {
    if (!id) {
      throw new RoomError('Room ID is required', 400)
    }
    return new Room(id)
  }

  //TODO this should be in the logic package
  static fromJSON(data: any): Room {
    const logicRoom = new LogicRoom(new JoinState(), new ConsoleLogger())

    if (data.gameState?.settings) logicRoom.settings = data.gameState.settings
    if (data.gameState?.users) logicRoom.users = data.gameState.users
    if (data.gameState?.slotManager) {
      // Re-hydrate the slot manager fully
      const sm = new SlotManager(data.gameState.MAX_PLAYERS || 5)
      Object.assign(sm, data.gameState.slotManager)
      logicRoom.slotManager = sm
    }

    const stateName = data.gameState?.state?.name || 'JoinState'
    let hydratedState: any = new JoinState()

    switch (stateName) {
      case 'JoinState':
        hydratedState = new JoinState()
        break;
      case 'FillState':
        hydratedState = new FillState()
        break;
      case 'StartedState':
        hydratedState = new StartedState()
        break;
      case 'ErrorState':
        hydratedState = new ErrorState(data.gameState?.state?.errorMessage || 'Unknown Error')
        break;
      default:
        break;
    }

    if (data.gameState?.state) {
      Object.assign(hydratedState, data.gameState.state)
    }

    logicRoom.state = hydratedState
    return new Room(data.id, logicRoom)
  }
}

export default Room
