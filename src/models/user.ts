import { connectionSQLResult } from '../utils/sql_query';
import { comparePassword, hashPassword } from '../utils/password_utils';
import {
  UserNotFoundError,
  InvalidPasswordError,
  NoUsersError,
  UserCreationError,
} from '../middleware/error_handler';

/**
 * Base type for user-related data.
 *
 * This type defines the common properties used for both user creation and user representation.
 */
export type UserBase = {
  /** User's national id */
  national_id: string;

  /** User's first name */
  first_name: string;

  /** User's last name */
  last_name: string;

  /** User's email address */
  email: string;
};

/**
 * Type representing a user with additional properties.
 *
 * This type extends UserBase with additional fields required for user management.
 */
export type User = UserBase & {
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
   * Checks if a email exists in the database.
   *
   * @param email - The email to check for existence.
   * @returns The user object if found.
   * @throws UserNotFoundError if the email does not exist.
   */
  async emailExists(email: string): Promise<User | void> {
    const sql = 'SELECT * FROM users WHERE email=($1)';
    const result = await connectionSQLResult(sql, [email]);
    if (!result.rows.length) return;
    return result.rows[0];
  }

  async nationalIdExists(nationalId: string): Promise<User | void> {
    const sql = 'SELECT * FROM users WHERE national_id=($1)';
    const result = await connectionSQLResult(sql, [nationalId]);
    if (!result.rows.length) return;
    return result.rows[0];
  }

  /**
   * Authenticates a user by checking the provided email and password.
   *
   * @param email - The email of the user to authenticate.
   * @param password - The plain text password to verify.
   * @returns The authenticated user object if successful.
   * @throws UserNotFoundError if the email does not exist.
   * @throws InvalidPasswordError if the password is incorrect.
   */
  async authenticateUser(email: string, password: string): Promise<User> {
    const user = await this.emailExists(email);
    if (!user) throw new UserNotFoundError(email);
    if (!comparePassword(password, user.password_digest)) {
      throw new InvalidPasswordError();
    }
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
    const { national_id, first_name, last_name, email, password } = userData;
    const sql = `INSERT INTO 
      users (national_id, first_name, last_name, email, password_digest)
      VALUES  ($1, $2, $3, $4, $5) RETURNING *`;
    const password_digest = hashPassword(password);
    const result = await connectionSQLResult(sql, [
      national_id,
      first_name,
      last_name,
      email,
      password_digest,
    ]);
    if (result.rows.length == 0) throw new UserCreationError(email);
    return result.rows[0];
  }

  /**
   * Deletes a user from the database by email.
   *
   * @param email - The email of the user to delete.
   * @returns True if the user was successfully deleted.
   * @throws UserNotFoundError if the email does not exist.
   */
  async delete(email: string): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE email=($1)';
    const result = await connectionSQLResult(sql, [email]);
    if (result.rowCount === 0) throw new UserNotFoundError(email);
    return true;
  }

  /**
   * Updates a user's password in the database.
   *
   * @param email - The email of the user whose password is being updated.
   * @param newPassword - The new plain text password to hash and store.
   * @returns The updated user object.
   * @throws UserNotFoundError if the email does not exist.
   */
  async updatePassword(email: string, newPassword: string): Promise<User> {
    const password_digest = hashPassword(newPassword);
    const sql = `UPDATE users SET password_digest = $1 WHERE email = $2 RETURNING *`;
    const result = await connectionSQLResult(sql, [password_digest, email]);
    if (result.rows.length === 0) throw new UserNotFoundError(email);
    return result.rows[0];
  }

  // /**
  //  * Updates a user's data in the database.
  //  *
  //  * @param email - The current email of the user to update.
  //  * @param updatedData - An object containing the fields to update.
  //  * @returns The updated user object.
  //  * @throws UserUpdateError if the user could not be updated.
  //  */
  // async update(email: string, updatedData: Partial<UserBase>): Promise<User> {
  //   const { first_name, last_name, national_id } = updatedData;

  //   const sql = `
  //     UPDATE users
  //     SET
  //       first_name = COALESCE($1, first_name),
  //       last_name = COALESCE($2, last_name),
  //       national_id = COALESCE($3, national_id),
  //       updated_at = NOW()
  //     WHERE email = $4
  //     RETURNING *;
  //   `;

  //   // Execute the query with provided values, allowing partial updates
  //   const result = await connectionSQLResult(sql, [
  //     first_name ?? null,
  //     last_name ?? null,
  //     national_id ?? null,
  //     email,
  //   ]);

  //   // If no rows are returned, the user was not found
  //   if (result.rows.length === 0) {
  //     throw new UserUpdateError(email);
  //   }

  //   // Return the updated user object
  //   return result.rows[0];
  // }
}
