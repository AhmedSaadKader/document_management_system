import { Request } from 'express';
import mongoose from 'mongoose';

type UserPayload = {
  national_id?: string;
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
    userId?: string;
    permission?: string;
    tags: string[];
    permissions: string;
    national_id: string;
    password: string;
    first_name: string;
    last_name: string;
    file?: File;
    isPublic: boolean;
  };
}
