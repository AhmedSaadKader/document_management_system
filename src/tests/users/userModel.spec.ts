import {
  describe,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  it,
} from '@jest/globals';
import { UserModel } from '../../models/user';
import { connectionSQLResult } from '../../utils/sql_query';
import {
  UserNotFoundError,
  InvalidPasswordError,
  NoUsersError,
} from '../../middleware/error_handler';
import { server } from '../../app';

describe('User Model Unit Tests', () => {
  let userModel: UserModel;

  beforeAll(async () => {
    // Setup the database with test data if necessary
  });

  beforeEach(() => {
    userModel = new UserModel();
  });

  afterEach(async () => {
    // Clean up any test data if needed
    await connectionSQLResult('DELETE FROM users WHERE email LIKE $1', [
      'john.doe%',
    ]);
  });

  afterAll((done) => {
    server.close(done);
  });

  // 1. Test for creating a user
  it('should create a new user successfully', async () => {
    const newUser = await userModel.create({
      national_id: '12345',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });

    expect(newUser.email).toBe('john.doe@example.com');
    expect(newUser.first_name).toBe('John');
  });

  // 2. Test for authenticating a user
  it('should authenticate a user successfully', async () => {
    // Create a user first
    await userModel.create({
      national_id: '12345',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });

    // Authenticate the user
    const authenticatedUser = await userModel.authenticateUser(
      'john.doe@example.com',
      'password123'
    );

    expect(authenticatedUser.email).toBe('john.doe@example.com');
  });

  // 3. Test for invalid password during authentication
  it('should throw InvalidPasswordError for wrong password', async () => {
    await userModel.create({
      national_id: '12345',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });

    await expect(
      userModel.authenticateUser('john.doe@example.com', 'wrongpassword')
    ).rejects.toThrow(InvalidPasswordError);
  });

  // 4. Test for fetching all users
  it('should retrieve all users', async () => {
    await userModel.create({
      national_id: '12345',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });

    const users = await userModel.index();
    expect(users.length).toBeGreaterThan(0);
  });

  // 5. Test for fetching a user by email
  it('should find a user by email', async () => {
    await userModel.create({
      national_id: '12345',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });

    const foundUser = await userModel.emailExists('john.doe@example.com');
    expect(foundUser!.email).toBe('john.doe@example.com');
  });

  // 6. Test for deleting a user
  it('should delete a user successfully', async () => {
    await userModel.create({
      national_id: '12345',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });

    const user = await userModel.emailExists('john.doe@example.com');
    expect(user!.email).toBe('john.doe@example.com');

    const result = await userModel.delete('john.doe@example.com');
    expect(result).toBe(true);

    await expect(userModel.delete('john.doe@example.com')).rejects.toThrow(
      UserNotFoundError
    );
  });

  // 7. Test for throwing an error when no users found
  it('should throw NoUsersError when no users exist', async () => {
    await expect(userModel.index()).rejects.toThrow(NoUsersError);
  });
});
