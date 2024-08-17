/* eslint-disable @typescript-eslint/no-unused-vars */
class UserNotFoundError extends Error {
  constructor(username: string) {
    super(`User with username "${username}" not found`);
    this.name = 'UserNotFoundError';
  }
}

class NoUsersError extends Error {
  constructor() {
    super(`No users available`);
    this.name = 'NoUsersError';
  }
}

class InvalidPasswordError extends Error {
  constructor() {
    super('The provided password is incorrect');
    this.name = 'InvalidPasswordError';
  }
}

class UserAlreadyExistsError extends Error {
  constructor(username: string) {
    super(`User with username "${username}" already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

class DatabaseConnectionError extends Error {
  constructor() {
    super('There was an issue connecting to the database');
    this.name = 'DatabaseConnectionError';
  }
}

class UserCreationError extends Error {
  constructor(username: string) {
    super(`Error creating ${username}`);
    this.name = 'UserCreationError';
  }
}

class UserUpdateError extends Error {
  constructor(username: string | number) {
    super(`Unable to update user with id "${username}"`);
    this.name = 'UserUpdateError';
  }
}

class UserDeletionError extends Error {
  constructor(username: string) {
    super(`Unable to delete user with username "${username}"`);
    this.name = 'UserDeletionError';
  }
}
