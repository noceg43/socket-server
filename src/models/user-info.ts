import { UserInfo as UserInfoType, UserInfoSchema, UserIcon } from '@/types'
import { ValidationError, UserError } from '@/errors'

export class UserInfo implements UserInfoType {
  public readonly userId: string
  public readonly userRoomId: string
  public readonly joinTimestamp: Date
  public readonly userIcon: UserIcon

  constructor(userId: string, userRoomId: string, roomId: string, existingUserInfoList: UserInfo[] = [], joinTimestamp?: Date) {
    // Generate a deterministic but random icon based on userId and roomId
    const assignedIcon = this.generateRandomAvailableIcon(userId, roomId, existingUserInfoList)

    try {
      const validatedData = UserInfoSchema.parse({
        userId,
        userRoomId,
        joinTimestamp: joinTimestamp || new Date(),
        userIcon: assignedIcon
      })

      this.userId = validatedData.userId
      this.userRoomId = validatedData.userRoomId
      this.joinTimestamp = validatedData.joinTimestamp
      this.userIcon = validatedData.userIcon
    } catch {
      throw new ValidationError('Invalid user info data')
    }
  }

  static create(userId: string, userRoomId: string, roomId: string, existingUserInfoList: UserInfo[] = []): UserInfo {
    if (!userId) {
      throw new UserError('User ID is required', 400)
    }
    if (!userRoomId) {
      throw new UserError('User room ID is required', 400)
    }
    if (!roomId) {
      throw new UserError('Room ID is required', 400)
    }
    return new UserInfo(userId, userRoomId, roomId, existingUserInfoList)
  }

  static fromUserInfoData(userInfoData: unknown): UserInfo {
    try {
      const validatedData = UserInfoSchema.parse(userInfoData)

      // Create a temporary UserInfo instance directly with validated data
      // This bypasses the constructor's icon assignment logic since the data already has an icon
      const userInfo = Object.create(UserInfo.prototype)
      userInfo.userId = validatedData.userId
      userInfo.userRoomId = validatedData.userRoomId
      userInfo.joinTimestamp = validatedData.joinTimestamp
      userInfo.userIcon = validatedData.userIcon

      return userInfo
    } catch {
      throw new ValidationError('Invalid user info data format')
    }
  }

  // Check if this UserInfo matches a specific user
  isForUser(userId: string): boolean {
    return this.userId === userId
  }

  // Private method to generate a random available icon
  private generateRandomAvailableIcon(userId: string, roomId: string, existingUserInfoList: UserInfo[]): UserIcon {
    const allIcons = Object.values(UserIcon)

    // Get icons already in use (excluding the current user if they're rejoining)
    const usedIcons = new Set(
      existingUserInfoList
        .filter(userInfo => userInfo.userId !== userId)
        .map(userInfo => userInfo.userIcon)
    )

    // Get available icons
    const availableIcons = allIcons.filter(icon => !usedIcons.has(icon))

    if (availableIcons.length === 0) {
      throw new UserError('No available icons - room is full', 400)
    }

    // Create a deterministic but pseudo-random selection based on userId and roomId
    const seed = this.hashString(userId + roomId)
    const iconIndex = seed % availableIcons.length

    return availableIcons[iconIndex]
  }

  // Simple hash function for deterministic randomness
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }


  // Helper method to get icon display name
  getIconDisplayName(): string {
    const iconNames: Record<UserIcon, string> = {
      [UserIcon.ILLUMINATI_EYE]: 'Illuminati Eye',
      [UserIcon.EMF_DETECTOR]: 'EMF Detector',
      [UserIcon.REPTILIANS]: 'Reptilians',
      [UserIcon.UFO]: 'UFO???',
      [UserIcon.FLAT_EARTH]: 'Flat Earth',
      [UserIcon.MOLOCH]: 'Moloch',
      [UserIcon.PYRAMIDS]: 'Pyramids',
      [UserIcon.DOLPHINS]: 'Dolphins'
    }
    return iconNames[this.userIcon]
  }

}

export default UserInfo
