class User {
  constructor(id, name) {
    this.id = id
    this.name = name
  }

  toMap() {
    return {
      id: this.id,
      name: this.name
    }
  }

  static fromMap(map) {
    try {
      return new User(map.id, map.name)
    } catch {
      throw new Error('Invalid user object')
    }
  }


  static fromRequestData(userId, body = {}) {
    if (!userId) {
      throw new Error('User ID is required')
    }
    if (!body.name) {
      throw new Error('User name is required')
    }

    return new User(userId, body.name)
  }
}

module.exports = User