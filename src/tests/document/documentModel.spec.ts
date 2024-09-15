import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import DocumentModel from '../../models/document';
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
} from '@jest/globals';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
});

describe('Document Model Tests', () => {
  it('should create and save a document successfully', async () => {
    const document = new DocumentModel({
      documentName: 'Sample Document',
      userId: 'user123',
      userEmail: 'user@example.com',
      workspace: new mongoose.Types.ObjectId(),
      filePath: '/path/to/file.pdf',
      originalFileName: 'file.pdf',
      fileSize: 12345,
      fileType: 'application/pdf',
    });

    const savedDocument = await document.save();

    // Ensure document is saved correctly
    expect(savedDocument._id).toBeDefined();
    expect(savedDocument.documentName).toBe('Sample Document');
    expect(savedDocument.filePath).toBe('/path/to/file.pdf');
    expect(savedDocument.fileSize).toBe(12345);
  });

  it('should fail to create document without required fields', async () => {
    const document = new DocumentModel({
      // Missing required fields like documentName, userId, etc.
    });

    let err;
    try {
      await document.save();
    } catch (error) {
      err = error;
    }

    // Ensure an error is thrown for missing required fields
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(
      (err as mongoose.Error.ValidationError).errors.documentName
    ).toBeDefined();
    expect((err as mongoose.Error.ValidationError).errors.userId).toBeDefined();
  });

  it('should update document name using the updateDocumentName method', async () => {
    const document = new DocumentModel({
      documentName: 'Old Document Name',
      userId: 'user123',
      userEmail: 'user@example.com',
      workspace: new mongoose.Types.ObjectId(),
      filePath: '/path/to/file.pdf',
      originalFileName: 'file.pdf',
      fileSize: 12345,
      fileType: 'application/pdf',
    });

    await document.save();

    // Update document name
    await document.updateDocumentName('New Document Name');

    // Fetch the updated document
    const updatedDocument = await DocumentModel.findById(document._id);

    expect(updatedDocument!.documentName).toBe('New Document Name');
    expect(updatedDocument!.updatedAt).not.toBe(document.updatedAt); // Ensure updatedAt was changed
  });

  it('should link document to a new workspace using linkToWorkspace method', async () => {
    const initialWorkspaceId = new mongoose.Types.ObjectId();
    const newWorkspaceId = new mongoose.Types.ObjectId();

    const document = new DocumentModel({
      documentName: 'Sample Document',
      userId: 'user123',
      userEmail: 'user@example.com',
      workspace: initialWorkspaceId,
      filePath: '/path/to/file.pdf',
      originalFileName: 'file.pdf',
      fileSize: 12345,
      fileType: 'application/pdf',
    });

    await document.save();

    // Link to new workspace
    await document.linkToWorkspace(newWorkspaceId);

    // Fetch updated document
    const updatedDocument = await DocumentModel.findById(document._id);

    expect(updatedDocument!.workspace.toString()).toBe(
      newWorkspaceId.toString()
    );
  });

  it('should add version history correctly', async () => {
    const document = new DocumentModel({
      documentName: 'Versioned Document',
      userId: 'user123',
      userEmail: 'user@example.com',
      workspace: new mongoose.Types.ObjectId(),
      filePath: '/path/to/file.pdf',
      originalFileName: 'file.pdf',
      fileSize: 12345,
      fileType: 'application/pdf',
      version: 1,
      versionHistory: [
        { version: 1, updatedBy: 'user123', updatedAt: new Date() },
      ],
    });

    await document.save();

    // Update document version
    document.version = 2;
    document.versionHistory.push({
      version: 2,
      updatedBy: 'user123',
      updatedAt: new Date(),
    });
    await document.save();

    // Fetch updated document
    const updatedDocument = await DocumentModel.findById(document._id);

    expect(updatedDocument!.version).toBe(2);
    expect(updatedDocument!.versionHistory.length).toBe(2);
    expect(updatedDocument!.versionHistory[1].version).toBe(2);
  });
});
