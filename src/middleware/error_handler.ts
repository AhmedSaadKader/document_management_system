/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Custom error class to handle cases where a user is not found.
 */
class UserNotFoundError extends Error {
  /**
   * Creates an instance of UserNotFoundError.
   *
   * @param username - The username of the user that was not found.
   */
  constructor(username: string) {
    super(`User with username "${username}" not found`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Custom error class to handle cases where no users are available.
 */
class NoUsersError extends Error {
  /**
   * Creates an instance of NoUsersError.
   */
  constructor() {
    super('No users available');
    this.name = 'NoUsersError';
  }
}

/**
 * Custom error class to handle cases where the provided password is incorrect.
 */
class InvalidPasswordError extends Error {
  /**
   * Creates an instance of InvalidPasswordError.
   */
  constructor() {
    super('The provided password is incorrect');
    this.name = 'InvalidPasswordError';
  }
}

/**
 * Custom error class to handle cases where a user already exists.
 */
class UserAlreadyExistsError extends Error {
  /**
   * Creates an instance of UserAlreadyExistsError.
   *
   * @param username - The username of the user that already exists.
   */
  constructor(username: string) {
    super(`User with username "${username}" already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

/**
 * Custom error class to handle database connection issues.
 */
class DatabaseConnectionError extends Error {
  /**
   * Creates an instance of DatabaseConnectionError.
   */
  constructor(errorMessage: string) {
    super(`There was an issue connecting to the database: ${errorMessage}`);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Custom error class to handle user creation errors.
 */
class UserCreationError extends Error {
  /**
   * Creates an instance of UserCreationError.
   *
   * @param username - The username of the user that could not be created.
   */
  constructor(username: string) {
    super(`Error creating ${username}`);
    this.name = 'UserCreationError';
  }
}

/**
 * Custom error class to handle user update errors.
 */
class UserUpdateError extends Error {
  /**
   * Creates an instance of UserUpdateError.
   *
   * @param username - The username or ID of the user that could not be updated.
   */
  constructor(username: string | number) {
    super(`Unable to update user with id "${username}"`);
    this.name = 'UserUpdateError';
  }
}

/**
 * Custom error class to handle user deletion errors.
 */
class UserDeletionError extends Error {
  /**
   * Creates an instance of UserDeletionError.
   *
   * @param username - The username of the user that could not be deleted.
   */
  constructor(username: string) {
    super(`Unable to delete user with username "${username}"`);
    this.name = 'UserDeletionError';
  }
}
