import mongoose from 'mongoose';

/**
 * @interface DocumentInterface
 * @extends mongoose.Document
 * @description Interface representing a Document in the database.
 * This extends the mongoose Document interface and includes additional fields
 * and methods specific to the Document schema.
 */
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
    permission: string;
  }[];
  filePath: string;
  fileType: string;
  originalFileName: string;
  fileSize: number;
  tags: string[];
  version: number;
  versionHistory: {
    version: number;
    updatedAt: Date;
    updatedBy: string;
  }[];
  updateDocumentName(newName: string): Promise<DocumentInterface>;
  linkToWorkspace(
    workspaceId: mongoose.Types.ObjectId
  ): Promise<DocumentInterface>;
}

/**
 * @constant {mongoose.Schema} documentSchema - The schema definition for the Document model.
 * @description Defines the structure of the Document collection in the database.
 */
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
  fileType: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
  },
  version: {
    type: Number,
    default: 1,
  },
  versionHistory: [
    {
      version: {
        type: Number,
        required: true,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: String,
        required: true,
      },
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
        enum: ['read', 'write', 'admin'],
        required: true,
      },
    },
  ],
});

/**
 * @method updateDocumentName
 * @description Updates the document name and sets the updatedAt field to the current date.
 * @param {string} newName - The new name for the document.
 * @returns {Promise<DocumentInterface>} The updated document.
 */
documentSchema.methods.updateDocumentName = async function (newName: string) {
  this.documentName = newName;
  this.updatedAt = new Date();
  return this.save();
};

/**
 * @method linkToWorkspace
 * @description Links the document to a new workspace.
 * @param {mongoose.Types.ObjectId} workspaceId - The ID of the workspace to link to.
 * @returns {Promise<DocumentInterface>} The updated document.
 */
documentSchema.methods.linkToWorkspace = async function (
  workspaceId: mongoose.Types.ObjectId
) {
  this.workspace = workspaceId;
  return this.save();
};

/**
 * @constant {mongoose.Model<DocumentInterface>} DocumentModel - The Mongoose model for the Document schema.
 * @description Used to interact with the Documents collection in the database.
 */
const DocumentModel = mongoose.model<DocumentInterface>(
  'Documents',
  documentSchema
);

export default DocumentModel;
