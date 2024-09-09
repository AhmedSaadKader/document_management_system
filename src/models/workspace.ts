import mongoose from 'mongoose';

export interface Permission {
  userEmail: string;
  permission: 'editor' | 'viewer';
}
export interface WorkspaceInterface extends mongoose.Document {
  workspaceName: string;
  description: string;
  userId: string;
  userEmail: string;
  documents: mongoose.Types.ObjectId[];
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  addDocument(documentId: mongoose.Types.ObjectId): Promise<WorkspaceInterface>;
  removeDocument(documentId: string): Promise<WorkspaceInterface>;
  addUserAsEditor(email: string): Promise<WorkspaceInterface>;
  addUserAsViewer(email: string): Promise<WorkspaceInterface>;
  isUserEditorOrViewer(email: string): 'editor' | 'viewer' | null;
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
  permissions: [
    {
      userEmail: {
        type: String,
        required: true,
      },
      permission: {
        type: String,
        enum: ['editor', 'viewer'],
        required: true,
      },
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

// Method to check if a user is an editor, viewer, or the owner
workspaceSchema.methods.isUserEditorOrViewer = function (email: string) {
  const permission = this.permissions.find(
    (perm: Permission) => perm.userEmail === email
  );
  if (this.userEmail === email) {
    return 'owner';
  }
  return permission ? permission.permission : null;
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
