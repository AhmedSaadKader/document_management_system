import request from 'supertest';
import app from '../app';

describe("GET API '/'", () => {
  it('should return "Document Management System"', async () => {
    const res = await request(app).get('/').send('Document Management System');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Document Management System');
  });
});
