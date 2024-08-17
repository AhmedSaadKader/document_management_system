import { connectionSQLResult } from '../utils/sql_query';
import { comparePassword, hashPassword } from '../utils/password_utils';

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  password_digest: string;
};

export class UserModel {
  private async usernameExists(username: string): Promise<User> {
    const sql = 'SELECT * FROM users WHERE username=($1)';
    const result = await connectionSQLResult(sql, [username]);
    if (!result.rows.length) throw new UserNotFoundError(username);
    return result.rows[0];
  }

  async authenticateUser(username: string, password: string): Promise<User> {
    const user = await this.usernameExists(username);
    if (!user) throw new UserNotFoundError(username);
    if (!comparePassword(password, user.password_digest))
      throw new InvalidPasswordError();
    return user;
  }

  async index(): Promise<User[]> {
    const sql = 'SELECT * FROM users';
    const result = await connectionSQLResult(sql, []);
    if (result.rows.length == 0) throw new NoUsersError();
    return result.rows;
  }

  async create(user: User): Promise<User> {
    const { first_name, last_name, username, password } = user;
    const sql =
      'INSERT INTO users (first_name, last_name, username, password_digest) VALUES  ($1, $2, $3, $4) RETURNING *';
    const password_digest = hashPassword(password);
    const result = await connectionSQLResult(sql, [
      first_name,
      last_name,
      username,
      password_digest,
    ]);
    if (result.rows.length == 0) throw new UserCreationError(username);
    return result.rows[0];
  }
}
