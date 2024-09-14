import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import app, { server } from '../../app'; // Your Express app
import Workspace from '../../models/workspace';
import Document from '../../models/document';
import { createJWT } from '../../utils/jwt_utils';

let mongoServer: MongoMemoryServer;

const mockUser = {
  national_id: '12345',
  first_name: 'John',
  last_name: 'Doe',
  email: 'user@example.com',
  password: 'password123',
};

let authToken: string;

beforeAll(async () => {
  authToken = createJWT(
    mockUser.national_id,
    mockUser.email,
    mockUser.first_name,
    mockUser.last_name
  );
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

describe('Workspace Controllers', () => {
  let workspaceId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let documentId: string;

  beforeEach(async () => {
    // Clear the database
    await Workspace.deleteMany({});
    await Document.deleteMany({});

    // Create a test workspace
    const workspace = new Workspace({
      workspaceName: 'Test Workspace',
      userId: '12345',
      userEmail: 'user@example.com',
    });
    await workspace.save();
    workspaceId = (workspace._id as string).toString();

    // Create a test document
    const document = new Document({
      documentName: 'Test Document',
      userId: '12345',
      userEmail: 'user@example.com',
      filePath: '/path/to/file',
      fileType: 'application/pdf',
      originalFileName: 'test_document.pdf',
      fileSize: 1024,
      workspace: workspaceId,
    });
    await document.save();
    documentId = document._id.toString();
  });

  it('should create a workspace', async () => {
    const response = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ workspaceName: 'New Workspace' })
      .expect(201);

    expect(response.body.workspaceName).toBe('New Workspace');
  });

  it('should get workspace by id', async () => {
    const response = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.workspace.workspaceName).toBe('Test Workspace');
  });

  // More tests for other controller functions...
});
