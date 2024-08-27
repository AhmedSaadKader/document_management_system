import mongoose from 'mongoose';

interface Workspace extends mongoose.Document {
  workspaceName: string;
  description: string;
  user: string;
  documents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  addDocument(documentId: mongoose.Types.ObjectId): Promise<Workspace>;
  removeDocument(documentId: string): Promise<Workspace>;
}

const workspaceSchema = new mongoose.Schema({
  workspaceName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  user: {
    type: String,
    ref: 'Users',
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

workspaceSchema.statics.findByUser = async function (userId: string) {
  return this.find({ user: userId });
};

const Workspace = mongoose.model<Workspace>('Workspaces', workspaceSchema);

export default Workspace;
