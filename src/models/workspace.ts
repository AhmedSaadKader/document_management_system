import mongoose from 'mongoose';

/**
 * Interface representing a permission in a workspace.
 *
 * @interface {Object} Permission
 * @property {string} userEmail - The email of the user who has this permission.
 * @property {'editor' | 'viewer'} permission - The type of permission ('editor' or 'viewer').
 */
export interface Permission {
  userEmail: string;
  permission: 'editor' | 'viewer';
}

/**
 * Interface representing a workspace document in MongoDB.
 *
 * This interface extends `mongoose.Document` to include custom methods and fields specific to a workspace.
 *
 * @interface WorkspaceInterface
 * @extends mongoose.Document
 * @property {string} workspaceName - The name of the workspace.
 * @property {string} description - The description of the workspace.
 * @property {string} userId - The ID of the user who owns the workspace.
 * @property {string} userEmail - The email of the user who owns the workspace.
 * @property {mongoose.Types.ObjectId[]} documents - An array of document IDs associated with the workspace.
 * @property {Permission[]} permissions - An array of permissions assigned to users for the workspace.
 * @property {Date} createdAt - The date when the workspace was created.
 * @property {Date} updatedAt - The date when the workspace was last updated.
 * @method {Promise<WorkspaceInterface>} addDocument - Adds a document to the workspace.
 * @param {mongoose.Types.ObjectId} documentId - The ID of the document to add.
 * @method {Promise<WorkspaceInterface>} removeDocument - Removes a document from the workspace.
 * @param {string} documentId - The ID of the document to remove.
 * @method {Promise<WorkspaceInterface>} addUserAsEditor - Adds a user as an editor in the workspace.
 * @param {string} email - The email of the user to add as an editor.
 * @method {Promise<WorkspaceInterface>} addUserAsViewer - Adds a user as a viewer in the workspace.
 * @param {string} email - The email of the user to add as a viewer.
 * @method {'editor' | 'viewer' | null} isUserEditorOrViewer - Checks if a user is an editor, viewer, or owner of the workspace.
 * @param {string} email - The email of the user to check.
 * @returns {'editor' | 'viewer' | null} - The permission level of the user ('editor' or 'viewer') or null if not found.
 */
export interface WorkspaceInterface extends mongoose.Document {
  workspaceName: string;
  description?: string;
  userId: string;
  userEmail: string;
  isPublic: boolean;
  documents: mongoose.Types.ObjectId[];
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  addDocument(documentId: mongoose.Types.ObjectId): Promise<WorkspaceInterface>;
  removeDocument(documentId: string): Promise<WorkspaceInterface>;
  addUserAsEditor(email: string): Promise<WorkspaceInterface>;
  addUserAsViewer(email: string): Promise<WorkspaceInterface>;
  isUserEditorOrViewer(email: string): 'owner' | 'editor' | 'viewer' | null;
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
  isPublic: {
    type: Boolean,
    default: false,
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
        enum: ['owner', 'editor', 'viewer'],
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

/**
 * Removes a document from the workspace.
 *
 * @param {string} documentId - The ID of the document to remove.
 * @returns {Promise<WorkspaceInterface>} - The updated workspace document.
 */
workspaceSchema.methods.removeDocument = async function (
  documentId: string
): Promise<WorkspaceInterface> {
  this.documents.pull(documentId);
  this.updatedAt = new Date();
  return this.save();
};

/**
 * Adds a document to the workspace.
 *
 * @param {mongoose.Types.ObjectId} documentId - The ID of the document to add.
 * @returns {Promise<WorkspaceInterface>} - The updated workspace document.
 */
workspaceSchema.methods.addDocument = async function (
  documentId: mongoose.Types.ObjectId
): Promise<WorkspaceInterface> {
  this.documents.push(documentId);
  this.updatedAt = new Date();
  return this.save();
};

/**
 * Adds a user as an editor to the workspace.
 *
 * @param {string} userEmail - The email of the user to add as an editor.
 * @returns {Promise<WorkspaceInterface>} - The updated workspace document.
 */
workspaceSchema.methods.addUserAsEditor = async function (
  userEmail: string
): Promise<WorkspaceInterface> {
  this.permissions.push({ userEmail, permission: 'editor' });
  return this.save();
};

/**
 * Adds a user as a viewer to the workspace.
 *
 * @param {string} userEmail - The email of the user to add as a viewer.
 * @returns {Promise<WorkspaceInterface>} - The updated workspace document.
 */
workspaceSchema.methods.addUserAsViewer = async function (
  userEmail: string
): Promise<WorkspaceInterface> {
  this.permissions.push({ userEmail, permission: 'viewer' });
  return this.save();
};

/**
 * Checks if a user is an editor, viewer, or the owner of the workspace.
 *
 * @param {string} email - The email of the user to check.
 * @returns {'editor' | 'viewer' | null} - The permission level of the user ('editor' or 'viewer') or null if not found.
 */
workspaceSchema.methods.isUserEditorOrViewer = function (
  email: string
): 'owner' | 'editor' | 'viewer' | null {
  const permission = this.permissions.find(
    (perm: Permission) => perm.userEmail === email
  );
  if (this.userEmail === email) {
    return 'owner';
  }
  return permission ? permission.permission : null;
};

/**
 * Static method to find workspaces by user ID.
 *
 * @param {string} userId - The user ID to search for.
 * @returns {Promise<WorkspaceInterface[]>} - An array of workspaces associated with the user ID.
 */
workspaceSchema.statics.findByUserId = function (
  userId: string
): Promise<WorkspaceInterface[]> {
  return this.find({ user: userId });
};

/**
 * Static method to find workspaces by user email.
 *
 * @param {string} userEmail - The user email to search for.
 * @returns {Promise<WorkspaceInterface[]>} - An array of workspaces associated with the user email.
 */
workspaceSchema.statics.findByUserEmail = async function (
  userEmail: string
): Promise<WorkspaceInterface[]> {
  return this.find({ user: userEmail });
};

const Workspace = mongoose.model<WorkspaceInterface>(
  'Workspaces',
  workspaceSchema
);

export default Workspace;
