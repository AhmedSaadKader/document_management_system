import {
  describe,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  it,
} from '@jest/globals';
import supertest from 'supertest';
import app, { server } from '../../app';
import { UserModel } from '../../models/user';
import { createJWT } from '../../utils/jwt_utils';
import { connectionSQLResult } from '../../utils/sql_query';

const request = supertest(app);

describe('User Routes and Controllers', () => {
  const mockUser = {
    national_id: '12345',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
  };

  let authToken: string;
  let userModel: UserModel;

  beforeAll(async () => {
    userModel = new UserModel();
    authToken = createJWT(
      mockUser.national_id,
      mockUser.email,
      mockUser.first_name,
      mockUser.last_name
    );
  });

  beforeEach(async () => {
    // Clean up the test database before each test
    await connectionSQLResult('DELETE FROM users', []);
  });

  afterAll(async () => {
    // Final cleanup after all tests
    await connectionSQLResult('DELETE FROM users', []);
  });

  describe('GET /api/v1/users', () => {
    it('should return all users', async () => {
      await userModel.create(mockUser);

      const response = await request.get('/api/v1/users');

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].email).toBe(mockUser.email);
    });
  });

  describe('POST /api/v1/users/register', () => {
    it('should register a new user', async () => {
      const response = await request
        .post('/api/v1/users/register')
        .send(mockUser);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.email).toBe(mockUser.email);
    });

    it('should handle existing email', async () => {
      await userModel.create(mockUser);

      const response = await request
        .post('/api/v1/users/register')
        .send(mockUser);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('should login a user', async () => {
      await userModel.create(mockUser);

      const response = await request
        .post('/api/v1/users/login')
        .send({ email: mockUser.email, password: mockUser.password });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.email).toBe(mockUser.email);
    });

    it('should handle invalid credentials', async () => {
      await userModel.create(mockUser);

      const response = await request
        .post('/api/v1/users/login')
        .send({ email: mockUser.email, password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe('The provided password is incorrect');
    });
  });

  describe('GET /api/v1/users/:email', () => {
    it('should get user data', async () => {
      await userModel.create(mockUser);

      const response = await request
        .get(`/api/v1/users/${mockUser.email}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(mockUser.email);
    });

    it('should handle non-existent user', async () => {
      const response = await request
        .get('/api/v1/users/nonexistent@example.com')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toBe(
        'User with email "nonexistent@example.com" not found'
      );
    });
  });

  describe('DELETE /api/v1/users/:email', () => {
    it('should delete a user', async () => {
      await userModel.create(mockUser);

      const response = await request
        .delete(`/api/v1/users/${mockUser.email}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBe(true);
    });
  });
  afterAll((done) => {
    server.close(done);
  });
});
