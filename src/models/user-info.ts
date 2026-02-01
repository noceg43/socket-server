import { UserInfo as UserInfoType, UserInfoSchema, UserIcon } from '@/types'
import { ValidationError, UserError } from '@/errors'

export class UserInfo implements UserInfoType {
  public readonly userId: string
  public readonly joinTimestamp: Date
  public readonly userIcon: UserIcon

  constructor(data: UserInfoType) {
    try {
      const validatedData = UserInfoSchema.parse(data)

      this.userId = validatedData.userId
      this.joinTimestamp = validatedData.joinTimestamp
      this.userIcon = validatedData.userIcon
    } catch {
      throw new ValidationError('Invalid user info data')
    }
  }

  static create(userId: string, roomId: string, existingUserInfoList: UserInfo[] = []): UserInfo {
    if (!userId) {
      throw new UserError('User ID is required', 400)
    }

    if (!roomId) {
      throw new UserError('Room ID is required', 400)
    }

    const assignedIcon = UserInfo.generateRandomAvailableIcon(userId, roomId, existingUserInfoList)

    return new UserInfo({
      userId,
      joinTimestamp: new Date(),
      userIcon: assignedIcon
    })
  }

  // Private helper to generate a random available icon
  private static generateRandomAvailableIcon(userId: string, roomId: string, existingUserInfoList: UserInfo[]): UserIcon {
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
    const seed = UserInfo.hashString(userId + roomId)
    const iconIndex = seed % availableIcons.length

    return availableIcons[iconIndex]
  }

  // Simple hash function for deterministic randomness
  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

export default UserInfo
