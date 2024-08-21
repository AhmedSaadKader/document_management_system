/**
 * Custom error class to handle cases where a user is not found.
 */
export class UserNotFoundError extends Error {
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
export class NoUsersError extends Error {
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
export class InvalidPasswordError extends Error {
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
export class UserAlreadyExistsError extends Error {
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
export class DatabaseConnectionError extends Error {
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
export class UserCreationError extends Error {
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
 * Custom error class to handle user login errors.
 */
export class UserLoginError extends Error {
  /**
   * Creates an instance of UserLoginError.
   *
   * @param username - The username of the user that could not be created.
   */
  constructor(username: string) {
    super(`Error logging in ${username}. Please provide all values.`);
    this.name = 'UserCreationError';
  }
}

/**
 * Custom error class to handle user update errors.
 */
export class UserUpdateError extends Error {
  /**
   * Creates an instance of UserUpdateError.
   *
   * @param username - The username or ID of the user that could not be updated.
   */
  constructor(username: string) {
    super(`Unable to update user with id "${username}"`);
    this.name = 'UserUpdateError';
  }
}

/**
 * Custom error class to handle user deletion errors.
 */
export class UserDeletionError extends Error {
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
