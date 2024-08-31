import mongoose, { Document, Model } from 'mongoose';

export interface PermissionInterface extends Document {
  userEmail: string;
  workspaceId: mongoose.Types.ObjectId;
  permission: 'viewer' | 'editor';
}

export interface PermissionModel extends Model<PermissionInterface> {
  findByUserEmail(userEmail: string): Promise<PermissionInterface[]>;
  addUserAsEditor(
    userEmail: string,
    workspaceId: mongoose.Types.ObjectId
  ): Promise<PermissionInterface>;
  addUserAsViewer(
    userEmail: string,
    workspaceId: mongoose.Types.ObjectId
  ): Promise<PermissionInterface>;
}

const permissionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspaces',
    required: true,
  },
  permission: { type: String, enum: ['viewer', 'editor'], required: true },
});

// Static method to find permissions by user email
permissionSchema.statics.findByUserEmail = async function (userEmail: string) {
  return this.find({ userEmail });
};

// Static method to add a user as an editor
permissionSchema.statics.addUserAsEditor = async function (
  userEmail: string,
  workspaceId: mongoose.Types.ObjectId
) {
  const permission = new this({
    userEmail,
    workspaceId,
    permission: 'editor',
  });
  return permission.save();
};

// Static method to add a user as a viewer
permissionSchema.statics.addUserAsViewer = async function (
  userEmail: string,
  workspaceId: mongoose.Types.ObjectId
) {
  const permission = new this({
    userEmail,
    workspaceId,
    permission: 'viewer',
  });
  return permission.save();
};

const Permission = mongoose.model<PermissionInterface, PermissionModel>(
  'Permission',
  permissionSchema
);

export default Permission;
