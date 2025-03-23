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
}

module.exports = User