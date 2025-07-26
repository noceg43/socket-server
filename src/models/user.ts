import { User as UserType, UserSchema } from '@/types'
import { ValidationError, UserError } from '@/errors'

export class User implements UserType {
  public readonly id: string
  public readonly name: string

  constructor(id: string, name: string) {
    try {
      // Validate input using Zod schema
      const validatedData = UserSchema.parse({ id, name })

      this.id = validatedData.id
      this.name = validatedData.name
    } catch {
      throw new ValidationError('Invalid user data provided')
    }
  }

  static fromUserData(userData: unknown): User {
    try {
      const validatedData = UserSchema.parse(userData)
      return new User(validatedData.id, validatedData.name)
    } catch {
      throw new ValidationError('Invalid user data format')
    }
  }

  static fromRequestData(userId: string, body: { name?: string } = {}): User {
    if (!userId) {
      throw new UserError('User ID is required', 400)
    }
    if (!body.name) {
      throw new UserError('User name is required', 400)
    }

    return new User(userId, body.name)
  }
}

export default User
