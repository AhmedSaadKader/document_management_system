import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Workspace from '../../models/workspace';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';

let mongoServer: MongoMemoryServer;

describe('Workspace Model Test', () => {
  beforeAll(async () => {
    // Start an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect mongoose to the in-memory MongoDB instance
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // Disconnect mongoose and stop the MongoDB instance
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clear the database after each test
    const collections = await mongoose.connection.db!.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  it('should create and save a workspace successfully', async () => {
    const workspaceData = {
      workspaceName: 'Test Workspace',
      userId: '12345',
      userEmail: 'test@example.com',
    };

    const validWorkspace = new Workspace(workspaceData);
    const savedWorkspace = await validWorkspace.save();

    expect(savedWorkspace._id).toBeDefined();
    expect(savedWorkspace.workspaceName).toBe(workspaceData.workspaceName);
    expect(savedWorkspace.userId).toBe(workspaceData.userId);
    expect(savedWorkspace.userEmail).toBe(workspaceData.userEmail);
    expect(savedWorkspace.documents).toHaveLength(0);
    expect(savedWorkspace.permissions).toHaveLength(0);
  });

  it('should add a document to the workspace', async () => {
    const workspace = new Workspace({
      workspaceName: 'Test Workspace',
      userId: '12345',
      userEmail: 'test@example.com',
    });

    const savedWorkspace = await workspace.save();

    // Add a document
    const newDocumentId = new mongoose.Types.ObjectId();
    await savedWorkspace.addDocument(newDocumentId);

    const updatedWorkspace = await Workspace.findById(savedWorkspace._id);
    expect(updatedWorkspace?.documents).toHaveLength(1);
    expect(updatedWorkspace?.documents[0]).toEqual(newDocumentId);
  });

  it('should remove a document from the workspace', async () => {
    const workspace = new Workspace({
      workspaceName: 'Test Workspace',
      userId: '12345',
      userEmail: 'test@example.com',
    });

    const newDocumentId = new mongoose.Types.ObjectId();
    workspace.documents.push(newDocumentId);
    const savedWorkspace = await workspace.save();

    // Remove the document
    await savedWorkspace.removeDocument(newDocumentId.toString());

    const updatedWorkspace = await Workspace.findById(savedWorkspace._id);
    expect(updatedWorkspace?.documents).toHaveLength(0);
  });

  it('should add a user as editor', async () => {
    const workspace = new Workspace({
      workspaceName: 'Test Workspace',
      userId: '12345',
      userEmail: 'owner@example.com',
    });

    const savedWorkspace = await workspace.save();

    // Add a user as an editor
    await savedWorkspace.addUserAsEditor('editor@example.com');

    const updatedWorkspace = await Workspace.findById(savedWorkspace._id);
    expect(updatedWorkspace?.permissions).toHaveLength(1);
    expect(updatedWorkspace?.permissions[0]).toMatchObject({
      userEmail: 'editor@example.com',
      permission: 'editor',
    });
  });

  it('should add a user as viewer', async () => {
    const workspace = new Workspace({
      workspaceName: 'Test Workspace',
      userId: '12345',
      userEmail: 'owner@example.com',
    });

    const savedWorkspace = await workspace.save();

    // Add a user as a viewer
    await savedWorkspace.addUserAsViewer('viewer@example.com');

    const updatedWorkspace = await Workspace.findById(savedWorkspace._id);
    expect(updatedWorkspace?.permissions).toHaveLength(1);
    expect(updatedWorkspace?.permissions[0]).toMatchObject({
      userEmail: 'viewer@example.com',
      permission: 'viewer',
    });
  });

  it('should check if user is editor or viewer', async () => {
    const workspace = new Workspace({
      workspaceName: 'Test Workspace',
      userId: '12345',
      userEmail: 'owner@example.com',
    });

    await workspace.addUserAsEditor('editor@example.com');
    await workspace.addUserAsViewer('viewer@example.com');

    const editorPermission =
      workspace.isUserEditorOrViewer('editor@example.com');
    const viewerPermission =
      workspace.isUserEditorOrViewer('viewer@example.com');
    const noPermission = workspace.isUserEditorOrViewer(
      'nopermission@example.com'
    );

    expect(editorPermission).toBe('editor');
    expect(viewerPermission).toBe('viewer');
    expect(noPermission).toBe(null);
  });
});
