import { describe, expect, afterAll, it } from '@jest/globals';
import request from 'supertest';
import app, { server } from '../../app';

describe("GET API '/'", () => {
  it('should return "Document Management System"', async () => {
    const res = await request(app)
      .get('/')
      .expect('Document Management System');
    expect(res.statusCode).toBe(200);
  });

  afterAll((done) => {
    server.close(done);
  });
});
