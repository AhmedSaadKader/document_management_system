import mongoose from 'mongoose';

export interface WorkspaceInterface extends mongoose.Document {
  workspaceName: string;
  description: string;
  userId: string;
  userEmail: string;
  documents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  addDocument(documentId: mongoose.Types.ObjectId): Promise<WorkspaceInterface>;
  removeDocument(documentId: string): Promise<WorkspaceInterface>;
  addUserAsEditor(email: string): Promise<WorkspaceInterface>;
  addUserAsViewer(email: string): Promise<WorkspaceInterface>;
}

const workspaceSchema = new mongoose.Schema({
  workspaceName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  documents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Documents',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

workspaceSchema.methods.removeDocument = async function (documentId: string) {
  this.documents.pull(documentId);
  this.updatedAt = new Date();
  return this.save();
};

workspaceSchema.methods.addDocument = async function (
  documentId: mongoose.Types.ObjectId
) {
  this.documents.push(documentId);
  this.updatedAt = new Date();
  return this.save();
};

workspaceSchema.methods.addUserAsEditor = async function (userEmail: string) {
  this.permissions.push({ userEmail, permission: 'editor' });
  return this.save();
};

workspaceSchema.methods.addUserAsViewer = async function (userEmail: string) {
  this.permissions.push({ userEmail, permission: 'viewer' });
  return this.save();
};

workspaceSchema.statics.findByUserId = async function (userId: string) {
  return this.find({ user: userId });
};

workspaceSchema.statics.findByUserEmail = async function (userEmail: string) {
  return this.find({ user: userEmail });
};

const Workspace = mongoose.model<WorkspaceInterface>(
  'Workspaces',
  workspaceSchema
);

export default Workspace;
