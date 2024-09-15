import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import request from 'supertest';
import app, { server } from '../../app';
import DocumentModel from '../../models/document';
import { createJWT } from '../../utils/jwt_utils';

describe('Document Controllers', () => {
  let mongoServer: MongoMemoryServer;
  const mockUser = {
    national_id: '12345',
    first_name: 'John',
    last_name: 'Doe',
    email: 'user@example.com',
    password: 'password123',
  };

  let authToken: string;
  let documentId: string;

  const baseDocument = {
    userId: mockUser.national_id,
    userEmail: mockUser.email,
    filePath: '/path/to/file',
    fileType: 'application/pdf',
    originalFileName: 'test_document.pdf',
    fileSize: 1024,
    deleted: false,
    workspace: new mongoose.Types.ObjectId(),
  };

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

  beforeEach(async () => {
    // Clear the database
    await DocumentModel.deleteMany({});

    // Create a test document
    const document = new DocumentModel({
      documentName: 'Test Document',
      ...baseDocument,
    });
    await document.save();
    documentId = (document._id as mongoose.Types.ObjectId).toString();
  });

  it('should get document details', async () => {
    const response = await request(app)
      .get(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    expect(response.body.documentName).toBe('Test Document');
  });

  it('should soft delete a document', async () => {
    const response = await request(app)
      .delete(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toBe('Document soft-deleted successfully');

    const document = await DocumentModel.findById(documentId);
    expect(document?.deleted).toBe(true);
  });

  it('should restore a document', async () => {
    // First, soft delete the document
    await DocumentModel.findByIdAndUpdate(documentId, { deleted: true });

    const response = await request(app)
      .patch(`/api/v1/documents/${documentId}/restore`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toBe('Document restored successfully');

    const document = await DocumentModel.findById(documentId);
    expect(document?.deleted).toBe(false);
  });

  it('should permanently delete a document', async () => {
    // First, soft delete the document
    await DocumentModel.findByIdAndUpdate(documentId, { deleted: true });

    const response = await request(app)
      .delete(`/api/v1/documents/${documentId}/delete`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toBe(
      'Document permanently deleted successfully'
    );

    const document = await DocumentModel.findById(documentId);
    expect(document).toBeNull();
  });

  it('should get all documents in recycle bin', async () => {
    // Soft delete the document
    await DocumentModel.findByIdAndUpdate(documentId, { deleted: true });

    const response = await request(app)
      .get('/api/v1/documents/recycle-bin')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].documentName).toBe('Test Document');
  });

  it('should return 404 for get document details if document not found', async () => {
    const invalidId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`/api/v1/documents/${invalidId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.error).toBe('Document not found');
  });

  it('should return 404 for download if document not found', async () => {
    const invalidId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`/api/v1/documents/${invalidId}/download`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toBe('Document not found');
  });

  it('should return 404 for preview if document not found', async () => {
    const invalidId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`/api/v1/documents/${invalidId}/preview`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toBe('Document not found');
  });

  it('should return 403 if user is not authorized to view document', async () => {
    const otherUserToken = createJWT(
      'otherUserId',
      'otheruser@example.com',
      'Jane',
      'Doe'
    );
    const response = await request(app)
      .get(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403);

    expect(response.body.message).toBe('Not authorized to view this workspace');
  });

  it('should return all documents for the user', async () => {
    // Seed the database with some documents using the base object
    await DocumentModel.create([
      { ...baseDocument, documentName: 'Doc 1' },
      { ...baseDocument, documentName: 'Doc 2' },
      { ...baseDocument, documentName: 'Doc 3' },
    ]);

    const response = await request(app)
      .get('/api/v1/documents/filter')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.length).toBe(4);
  });

  it('should return filtered documents based on search query', async () => {
    // Seed the database with documents
    await DocumentModel.create([
      { ...baseDocument, documentName: 'Report 1' },
      { ...baseDocument, documentName: 'Invoice 1' },
      { ...baseDocument, documentName: 'Document 1' },
    ]);

    const response = await request(app)
      .get('/api/v1/documents/filter')
      .query({ search: 'Report' }) // Search for 'Report'
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.length).toBe(1); // Should return 1 matching document
    expect(response.body[0].documentName).toBe('Report 1');
  });

  it('should return documents sorted by documentName in ascending order', async () => {
    // Seed the database
    await DocumentModel.create([
      { ...baseDocument, documentName: 'C Document' },
      { ...baseDocument, documentName: 'A Document' },
      { ...baseDocument, documentName: 'B Document' },
    ]);

    const response = await request(app)
      .get('/api/v1/documents/filter')
      .query({ sortBy: 'documentName', order: 'asc' })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body[0].documentName).toBe('A Document');
    expect(response.body[1].documentName).toBe('B Document');
    expect(response.body[2].documentName).toBe('C Document');
  });

  it('should return documents sorted by documentName in descending order', async () => {
    // Seed the database
    await DocumentModel.create([
      { ...baseDocument, documentName: 'C Document' },
      { ...baseDocument, documentName: 'A Document' },
      { ...baseDocument, documentName: 'B Document' },
    ]);

    const response = await request(app)
      .get('/api/v1/documents/filter')
      .query({ sortBy: 'documentName', order: 'desc' }) // Sort in descending order
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body[0].documentName).toBe('Test Document');
    expect(response.body[1].documentName).toBe('C Document');
    expect(response.body[2].documentName).toBe('B Document');
    expect(response.body[3].documentName).toBe('A Document');
  });

  it('should handle database connection error', async () => {
    jest.spyOn(DocumentModel, 'find').mockImplementationOnce(() => {
      throw new Error('Database connection error');
    });

    const response = await request(app)
      .get('/api/v1/documents/filter')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.error).toBe(
      'There was an issue connecting to the database: Database connection error'
    );
  });
});
