import mongoose from 'mongoose';

export interface DocumentInterface extends mongoose.Document {
  documentName: string;
  workspace: mongoose.Types.ObjectId;
  userId: string;
  userEmail: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: {
    userEmail: mongoose.Types.ObjectId;
    permission: string; // e.g., 'read', 'write', 'admin'
  }[];
  filePath: string;
  originalFileName: string;
  fileSize: number;
}

const documentSchema = new mongoose.Schema({
  documentName: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspaces',
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  permissions: [
    {
      userEmail: {
        type: String,
        required: true,
      },
      permission: {
        type: String,
        enum: ['read', 'write', 'admin'],
        required: true,
      },
    },
  ],
});

documentSchema.methods.updateDocumentName = async function (newName: string) {
  this.documentName = newName;
  this.updatedAt = new Date();
  return this.save();
};

documentSchema.methods.linkToWorkspace = async function (
  workspaceId: mongoose.Types.ObjectId
) {
  this.workspace = workspaceId;
  return this.save();
};

const DocumentModel = mongoose.model('Documents', documentSchema);

export default DocumentModel;
