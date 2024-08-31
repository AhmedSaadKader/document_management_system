import mongoose from 'mongoose';

export interface WorkspaceInterface extends mongoose.Document {
  workspaceName: string;
  description: string;
  user: string;
  documents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  permissions: {
    userId: mongoose.Types.ObjectId;
    permission: string; // e.g., 'read', 'write'
  }[];
  addDocument(documentId: mongoose.Types.ObjectId): Promise<WorkspaceInterface>;
  removeDocument(documentId: string): Promise<WorkspaceInterface>;
  addUserAsEditor(userId: string): Promise<WorkspaceInterface>;
  addUserAsViewer(userId: string): Promise<WorkspaceInterface>;
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
  permissions: [
    {
      userId: {
        type: String,
        required: true,
      },
      permission: {
        type: String,
        enum: ['read', 'write'],
        required: true,
      },
    },
  ],
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

workspaceSchema.methods.addUserAsEditor = async function (userId: string) {
  this.permissions.push({ userId, permission: 'write' });
  return this.save();
};

workspaceSchema.methods.addUserAsViewer = async function (userId: string) {
  this.permissions.push({ userId, permission: 'read' });
  return this.save();
};

workspaceSchema.statics.findByUser = async function (userId: string) {
  return this.find({ user: userId });
};

const Workspace = mongoose.model<WorkspaceInterface>(
  'Workspaces',
  workspaceSchema
);

export default Workspace;
