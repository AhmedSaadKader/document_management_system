import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  documentName: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    ref: 'Users',
    required: true,
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

const Document = mongoose.model('Documents', documentSchema);

export default Document;
