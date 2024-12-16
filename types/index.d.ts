import { Request } from 'express';
import mongoose from 'mongoose';

type UserPayload = {
  user_id?: string;
  email?: string;
  iat?: string | number;
};

export interface RequestAuth extends Request {
  user?: UserPayload;
  file?: Express.Multer.File & { s3Key?: string; s3Bucket?: string };
  body: {
    email: string;
    otp?: string;
    documentName?: string;
    workspace?: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    workspaceName?: string;
    description?: string;
    user_id?: string;
    permission?: string;
    tags: string[];
    permissions: string;
    password: string;
    first_name: string;
    last_name: string;
    file?: File;
    isPublic: boolean;
    parentWorkspaceId: mongoose.Types.ObjectId;
    childWorkspaceId: mongoose.Types.ObjectId;
  };
}
