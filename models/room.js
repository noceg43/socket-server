const User = require('./user')

class Room {
  constructor(id, creator, joinedPlayers) {
    this.id = id
    this.creator = creator || null
    this.joinedPlayers = joinedPlayers || []
  }

  isUserInRoom(user) {
    if (user instanceof User) {
      return this.joinedPlayers.some(({ user: joinedUser }) => joinedUser.id === user.id)
    } else {
      throw new Error('Invalid user object')
    }
  }

  isUserCreator(user) {
    if (user instanceof User) {
      return this.creator && this.creator.id === user.id
    } else {
      throw new Error('Invalid user object')
    }
  }

  static create(id, creator) {
    if (!(creator instanceof User)) {
      throw new Error('Invalid user object')
    }
    return new Room(id, creator)
  }

  addUser(user) {
    if (user instanceof User) {
      this.joinedPlayers.push({
        user,
      })
    } else {
      throw new Error('Invalid user object')
    }
  }

  static fromMap(map) {
    try {
      const creator = map.creator ? User.fromMap(map.creator) : null
      const joinedPlayers = map.joinedPlayers.map(({ user }) => ({
        user: User.fromMap(user),
      }))

      return new Room(map.id, creator, joinedPlayers)
    } catch {
      throw new Error('Invalid room object')
    }
  }
}

module.exports = Room