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
import app, { server } from '../../app';
import Workspace from '../../models/workspace';
import Document from '../../models/document';
import { createJWT } from '../../utils/jwt_utils';
import Favorite from '../../models/favorite';

describe('Workspace Controllers', () => {
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

  let workspaceId: string;
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
    workspaceId = (workspace._id as mongoose.Types.ObjectId).toString();

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
    documentId = (document._id as mongoose.Types.ObjectId).toString();
  });

  it('should get all workspaces', async () => {
    const response = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
  });

  it('should get workspace by id', async () => {
    const response = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.workspace.workspaceName).toBe('Test Workspace');
  });

  it('should create a workspace', async () => {
    const response = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ workspaceName: 'New Workspace' })
      .expect(201);

    expect(response.body.workspaceName).toBe('New Workspace');
  });

  it('should update a workspace', async () => {
    const response = await request(app)
      .put(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ workspaceName: 'Updated Workspace' })
      .expect(200);

    expect(response.body.workspaceName).toBe('Updated Workspace');
  });

  it('should delete a workspace', async () => {
    await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);

    // Check that the workspace is deleted
    const workspace = await Workspace.findById(workspaceId);
    expect(workspace).toBeNull();
  });

  it('should add a document to a workspace and save the correct file path', async () => {
    const response = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', `${__dirname}/Ahmed_Saad_s_Resume.pdf`)
      .field('documentName', 'New Document')
      .expect(201);

    const savedDocument = await Document.findById(response.body.document._id);

    expect(savedDocument).not.toBeNull();
    expect(savedDocument!.filePath).toContain('Ahmed_Saad_s_Resume');
    expect(savedDocument!.documentName).toBe('New Document');
  });

  it('should upload a document and then download it and then preview it', async () => {
    // Step 1: Upload the file
    const uploadResponse = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', `${__dirname}/Ahmed_Saad_s_Resume.pdf`)
      .field('documentName', 'Test Document')
      .expect(201);

    // Extract the documentId and filePath from the upload response
    const { document } = uploadResponse.body;
    const documentId = document._id;
    const filePath = document.filePath;

    // Step 2: Download the uploaded file
    const downloadDocumentResponse = await request(app)
      .get(`/api/v1/documents/${documentId}/download`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(downloadDocumentResponse.headers['content-disposition']).toMatch(
      /attachment; filename=Ahmed_Saad_s_Resume.pdf/
    );
    expect(filePath).toContain('Ahmed_Saad_s_Resume');

    // Step 3: Preview the uploaded file
    const previewDocumentResponse = await request(app)
      .get(`/api/v1/documents/${documentId}/preview`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(previewDocumentResponse.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(previewDocumentResponse.body.base64).toBeDefined();
  });

  it('should delete a document from a workspace', async () => {
    await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Check that the document is deleted
    const document = await Document.findById(documentId);
    expect(document).toBeNull();
  });

  it('should share a workspace', async () => {
    const shareResponse = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/share`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'otheruser@example.com', permission: 'editor' })
      .expect(200);

    expect(shareResponse.body.message).toBe('User added as editor');
  });

  it('should get shared workspaces', async () => {
    const getSharedResponse = await request(app)
      .get('/api/v1/workspaces/shared-workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getSharedResponse.body).toBeInstanceOf(Array);
  });

  it('should get recent workspaces', async () => {
    const response = await request(app)
      .get('/api/v1/workspaces/recent')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
  });

  it('should add a workspace to favorites', async () => {
    const response = await request(app)
      .post(`/api/v1/favorites/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    expect(response.body.message).toBe('Workspace added to favorites');

    // Check if the favorite is in the database
    const favorite = await Favorite.findOne({ userId: '12345', workspaceId });
    expect(favorite).not.toBeNull();
  });

  it('should not add the same workspace to favorites twice', async () => {
    // Add the workspace to favorites once
    await Favorite.create({ userId: '12345', workspaceId });

    const response = await request(app)
      .post(`/api/v1/favorites/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.message).toBe('Workspace already favorited');
  });

  it('should remove a workspace from favorites', async () => {
    // First, add the workspace to favorites
    await Favorite.create({ userId: '12345', workspaceId });

    const response = await request(app)
      .delete(`/api/v1/favorites/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toBe('Workspace removed from favorites');

    // Check that the favorite is removed from the database
    const favorite = await Favorite.findOne({ userId: '12345', workspaceId });
    expect(favorite).toBeNull();
  });

  it('should get all favorited workspaces', async () => {
    // Add a few workspaces to favorites
    await Favorite.create({ userId: '12345', workspaceId });

    const response = await request(app)
      .get('/api/v1/favorites')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should check if a workspace is favorited', async () => {
    // Add the workspace to favorites
    await Favorite.create({ userId: '12345', workspaceId });

    const response = await request(app)
      .get(`/api/v1/favorites/${workspaceId}/check`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.isFavorited).toBe(true);
  });

  it('should return false if a workspace is not favorited', async () => {
    const response = await request(app)
      .get(`/api/v1/favorites/${workspaceId}/check`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.isFavorited).toBe(false);
  });
});
