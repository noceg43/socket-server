import { Room as RoomType, RoomSchema, MAX_USERS_PER_ROOM } from '@/types'
import { ValidationError, RoomError } from '@/errors'
import { User } from './user'
import { UserInfo } from './user-info'
import { v4 as uuidv4 } from 'uuid'

export class Room implements RoomType {
  public readonly id: string
  public joinedPlayers: User[]
  public userInfoList: UserInfo[]
  public state: Record<string, unknown> | null

  constructor(id: string, joinedPlayers: User[] = [], userInfoList: UserInfo[] = [], state: Record<string, unknown> | null = null) {
    try {
      // Validate the basic structure - convert users and userInfo to plain objects for validation
      const validatedData = RoomSchema.parse({
        id,
        joinedPlayers: joinedPlayers.map(user => ({ id: user.id, name: user.name })),
        userInfoList: userInfoList.map(userInfo => ({
          userId: userInfo.userId,
          userRoomId: userInfo.userRoomId,
          joinTimestamp: userInfo.joinTimestamp,
          userIcon: userInfo.userIcon
        })),
        state
      })

      this.id = validatedData.id
      this.joinedPlayers = joinedPlayers
      this.userInfoList = userInfoList
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

    // Check if user already exists in the room
    const existingUserIndex = this.joinedPlayers.findIndex(
      (joinedUser) => joinedUser.id === user.id
    )

    // If user doesn't exist and room is at capacity, reject
    if (existingUserIndex === -1 && this.joinedPlayers.length >= MAX_USERS_PER_ROOM) {
      throw new RoomError(`Room is full. Maximum ${MAX_USERS_PER_ROOM} users allowed`, 400)
    }

    // Remove existing UserInfo for this user (if any) to handle override case
    this.userInfoList = this.userInfoList.filter(
      (userInfo) => userInfo.userId !== user.id
    )

    // Add or update the user in joinedPlayers
    if (existingUserIndex !== -1) {
      // User exists, update their info
      this.joinedPlayers[existingUserIndex] = user
    } else {
      // New user, add to the list
      this.joinedPlayers.push(user)
    }

    // Create and add new UserInfo for this user (icon will be auto-assigned)
    const userRoomId = uuidv4()
    const newUserInfo = UserInfo.create(user.id, userRoomId, this.id, this.userInfoList)
    this.userInfoList.push(newUserInfo)
  }

  removeUser(user: User): void {
    if (!(user instanceof User)) {
      throw new RoomError('Invalid user object provided', 400)
    }

    // Remove user from joinedPlayers
    this.joinedPlayers = this.joinedPlayers.filter(
      (joinedUser) => joinedUser.id !== user.id
    )

    // Remove user from userInfoList
    this.userInfoList = this.userInfoList.filter(
      (userInfo) => userInfo.userId !== user.id
    )
  }

  static fromRoomData(roomData: unknown): Room {
    try {
      const validatedData = RoomSchema.parse(roomData)
      const joinedPlayers = validatedData.joinedPlayers.map((userData) =>
        User.fromUserData(userData)
      )
      const userInfoList = validatedData.userInfoList.map((userInfoData) =>
        UserInfo.fromUserInfoData(userInfoData)
      )

      return new Room(validatedData.id, joinedPlayers, userInfoList, validatedData.state)
    } catch {
      throw new ValidationError('Invalid room data format')
    }
  }
}

export default Room
