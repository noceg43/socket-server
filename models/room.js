const User = require('./user')

class Room {
  constructor(id, joinedPlayers, state) {
    this.id = id
    this.joinedPlayers = joinedPlayers || []
    this.state = state || null
  }

  isUserInRoom(user) {
    if (user instanceof User) {
      return this.joinedPlayers.some((joinedUser) => joinedUser.id === user.id)
    } else {
      throw new Error('Invalid user object')
    }
  }

  static create(id) {
    return new Room(id)
  }

  addUser(user) {
    if (user instanceof User) {
      const exists = this.joinedPlayers.some(
        (joinedUser) => joinedUser.id === user.id
      )
      if (!exists) {
        this.joinedPlayers.push(user)
      }
    } else {
      throw new Error('Invalid user object')
    }
  }

  removeUser(user) {
    if (user instanceof User) {
      this.joinedPlayers = this.joinedPlayers.filter(
        (joinedUser) => joinedUser.id !== user.id
      )
    } else {
      throw new Error('Invalid user object')
    }
  }

  static fromMap(map) {
    try {
      const joinedPlayers = map.joinedPlayers.map((user) => (
        User.fromMap(user)))
      const state = map.state || null

      return new Room(map.id, joinedPlayers, state)
    } catch {
      throw new Error('Invalid room object')
    }
  }
}

module.exports = Room