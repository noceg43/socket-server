import {
  Room as RoomType,
  RoomSchema,
  MAX_USERS_PER_ROOM,
  RoomStatus
} from '@/types'
import { ValidationError, RoomError } from '@/errors'
import { User } from './user'
import { UserInfo } from './user-info'
import {
  RoomState,
  restoreStateInstance
} from './room-state'

export class Room implements RoomType {
  public readonly id: string
  public joinedPlayers: User[]
  public userInfoList: UserInfo[]
  public state: RoomState

  /**
   * Constructor accepts the full validated Room data object
   * @param data - Complete room data matching RoomType interface
   */
  constructor(data: RoomType) {
    try {
      // Validate the complete data structure
      const validatedData = RoomSchema.parse(data)

      this.id = validatedData.id

      // Re-instantiate User class instances from plain objects
      this.joinedPlayers = validatedData.joinedPlayers.map(
        (userData) => new User(userData)
      )

      // Re-instantiate UserInfo class instances from plain objects
      this.userInfoList = validatedData.userInfoList.map(
        (userInfoData) => new UserInfo(userInfoData)
      )

      // Re-instantiate the State class based on status
      this.state = restoreStateInstance(validatedData.state)

    } catch (error) {
      // Wrap Zod errors or generic errors
      if (error instanceof Error) {
        throw new ValidationError(`Invalid room data: ${error.message}`)
      }
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

    return new Room({
      id,
      joinedPlayers: [],
      userInfoList: [],
      state: {
        status: RoomStatus.JOIN,
        gameSettings: { nRounds: 3, timerDuration: 60 },
        readyUsersId: []
      }
    })
  }

  addUser(user: User): void {
    if (!(user instanceof User)) {
      throw new RoomError('Invalid user object provided', 400)
    }

    const existingUserIndex = this.joinedPlayers.findIndex(
      (joinedUser) => joinedUser.id === user.id
    )

    if (existingUserIndex === -1 && this.joinedPlayers.length >= MAX_USERS_PER_ROOM) {
      throw new RoomError(`Room is full. Maximum ${MAX_USERS_PER_ROOM} users allowed`, 400)
    }

    this.userInfoList = this.userInfoList.filter(
      (userInfo) => userInfo.userId !== user.id
    )

    if (existingUserIndex !== -1) {
      this.joinedPlayers[existingUserIndex] = user
    } else {
      this.joinedPlayers.push(user)
    }

    const newUserInfo = UserInfo.create(user.id, this.id, this.userInfoList)
    this.userInfoList.push(newUserInfo)
  }

  removeUser(user: User): void {
    if (!(user instanceof User)) {
      throw new RoomError('Invalid user object provided', 400)
    }

    this.joinedPlayers = this.joinedPlayers.filter(
      (joinedUser) => joinedUser.id !== user.id
    )

    this.userInfoList = this.userInfoList.filter(
      (userInfo) => userInfo.userId !== user.id
    )
  }
}

export default Room