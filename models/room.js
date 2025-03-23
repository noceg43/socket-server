const User = require('./user')

class Room {
  constructor(id, users) {
    this.id = id
    this.users = users || []
  }

  static create(id, creator) {
    if (!(creator instanceof User)) {
      throw new Error('Invalid user object')
    }
    const room = new Room(id)
    room.addUser(creator)
    return room
  }

  addUser(user) {
    if (user instanceof User) {
      this.users.push({
        user,
        addedAt: new Date().toISOString()
      })
    } else {
      throw new Error('Invalid user object')
    }
  }

  static fromMap(map) {
    try {
      const users = map.users.map(({ user, addedAt }) => ({
        user: User.fromMap(user),
        addedAt
      }))

      return new Room(map.id, users)
    } catch {
      throw new Error('Invalid room object')
    }
  }
}

module.exports = Room