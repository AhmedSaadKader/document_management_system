import { connectionSQLResult } from '../utils/sql_query';
import { comparePassword, hashPassword } from '../utils/password_utils';

/**
 * Base type for user-related data.
 *
 * This type defines the common properties used for both user creation and user representation.
 */
export type UserBase = {
  /** User's first name */
  first_name: string;

  /** User's last name */
  last_name: string;

  /** User's unique username */
  username: string;

  /** User's email address */
  email: string;
};

/**
 * Type representing a user with additional properties.
 *
 * This type extends UserBase with additional fields required for user management.
 */
export type User = UserBase & {
  /** Unique identifier for the user */
  id: string;

  /** Hashed password for secure storage */
  password_digest: string;

  /** Timestamp when the user was created (ISO 8601 format) */
  created_at?: string;

  /** Timestamp when the user was last updated (ISO 8601 format) */
  updated_at?: string;
};

/**
 * Type for user data required for creating a new user.
 *
 * This type extends UserBase with the password field used during user creation.
 */
export type UserData = UserBase & {
  /** Plain text password used for hashing and storage */
  password: string;
};

/**
 * Class responsible for managing user-related operations.
 */
export class UserModel {
  /**
   * Checks if a username exists in the database.
   *
   * @param username - The username to check for existence.
   * @returns The user object if found.
   * @throws UserNotFoundError if the username does not exist.
   */
  private async usernameExists(username: string): Promise<User> {
    const sql = 'SELECT * FROM users WHERE username=($1)';
    const result = await connectionSQLResult(sql, [username]);
    if (!result.rows.length) throw new UserNotFoundError(username);
    return result.rows[0];
  }

  /**
   * Authenticates a user by checking the provided username and password.
   *
   * @param username - The username of the user to authenticate.
   * @param password - The plain text password to verify.
   * @returns The authenticated user object if successful.
   * @throws UserNotFoundError if the username does not exist.
   * @throws InvalidPasswordError if the password is incorrect.
   */
  async authenticateUser(username: string, password: string): Promise<User> {
    const user = await this.usernameExists(username);
    if (!user) throw new UserNotFoundError(username);
    if (!comparePassword(password, user.password_digest))
      throw new InvalidPasswordError();
    return user;
  }

  /**
   * Retrieves all users from the database.
   *
   * @returns An array of user objects.
   * @throws NoUsersError if no users are found in the database.
   */
  async index(): Promise<User[]> {
    const sql = 'SELECT * FROM users';
    const result = await connectionSQLResult(sql, []);
    if (result.rows.length == 0) throw new NoUsersError();
    return result.rows;
  }

  /**
   * Creates a new user in the database.
   *
   * @param userData - The data required to create a new user, including a plain text password.
   * @returns The newly created user object.
   * @throws UserCreationError if the user could not be created.
   */
  async create(userData: UserData): Promise<User> {
    const { first_name, last_name, username, password, email } = userData;
    const sql =
      'INSERT INTO users (first_name, last_name, username, email, password_digest) VALUES  ($1, $2, $3, $4, $5) RETURNING *';
    const password_digest = await hashPassword(password);
    const result = await connectionSQLResult(sql, [
      first_name,
      last_name,
      username,
      email,
      password_digest,
    ]);
    if (result.rows.length == 0) throw new UserCreationError(username);
    return result.rows[0];
  }

  /**
   * Deletes a user from the database by username.
   *
   * @param username - The username of the user to delete.
   * @returns True if the user was successfully deleted.
   * @throws UserNotFoundError if the username does not exist.
   */
  async delete(username: string): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE username=($1)';
    const result = await connectionSQLResult(sql, [username]);
    if (result.rows.length === 0) throw new UserNotFoundError(username);
    return true;
  }

  /**
   * Updates a user's username in the database.
   *
   * @param username - The current username of the user to update.
   * @param newUsername - The new username to set.
   * @returns The updated user object.
   * @throws UserUpdateError if the username could not be updated.
   */
  async update(username: string | number, newUsername?: string): Promise<User> {
    const sql =
      'UPDATE users SET username=($1) WHERE username=($2) RETURNING *';
    const result = await connectionSQLResult(sql, [
      newUsername as string,
      username,
    ]);
    if (result.rows.length == 0) throw new UserUpdateError(username);
    return result.rows[0];
  }
}
