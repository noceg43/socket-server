import { User as UserType, UserSchema } from '@/types'
import { ValidationError, UserError } from '@/errors'

export class User implements UserType {
  public readonly id: string
  public readonly name: string

  constructor(data: UserType) {
    try {
      // Validate the full object using Zod schema
      const validatedData = UserSchema.parse(data)

      this.id = validatedData.id
      this.name = validatedData.name
    } catch {
      throw new ValidationError('Invalid user data provided')
    }
  }

  static fromRequestData(userId: string, body: { name?: string } = {}): User {
    if (!userId) {
      throw new UserError('User ID is required', 400)
    }
    if (!body.name) {
      throw new UserError('User name is required', 400)
    }

    return new User({ id: userId, name: body.name })
  }
}

export default User
