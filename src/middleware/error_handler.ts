/**
 * Custom error class to handle cases where a user is not found.
 */
export class UserNotFoundError extends Error {
  /**
   * Creates an instance of UserNotFoundError.
   *
   * @param email - The email of the user that was not found.
   */
  constructor(email: string) {
    super(`User with email "${email}" not found`);
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
   * @param email - The email of the user that already exists.
   */
  constructor(email: string) {
    super(`User with email "${email}" already exists`);
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
   * @param email - The email of the user that could not be created.
   */
  constructor(email: string) {
    super(`Error creating ${email}`);
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
   * @param email - The email of the user that could not be created.
   */
  constructor(email: string) {
    super(`Error logging in ${email}. Please provide all values.`);
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
   * @param email - The email or ID of the user that could not be updated.
   */
  constructor(email: string) {
    super(`Unable to update user with id "${email}"`);
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
   * @param email - The email of the user that could not be deleted.
   */
  constructor(email: string) {
    super(`Unable to delete user with email "${email}"`);
    this.name = 'UserDeletionError';
  }
}

/**
 * Custom error class to handle cases where a resource is not found.
 */
export class NotFoundError extends Error {
  /**
   * Creates an instance of NotFoundError.
   *
   * @param resourceName - The name of the resource that was not found.
   * @param identifier - The identifier of the resource that was not found (e.g., ID, name, etc.).
   */
  constructor(resourceName: string, identifier?: string | number) {
    const message = identifier
      ? `${resourceName} with identifier "${identifier}" not found`
      : `${resourceName} not found`;

    super(message);
    this.name = 'NotFoundError';
  }
}
