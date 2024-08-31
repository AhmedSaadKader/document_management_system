import { Request } from 'express';
import mongoose from 'mongoose';

type UserPayload = {
  national_id?: string;
  email?: string;
  iat?: string | number;
};

export interface RequestAuth extends Request {
  user?: UserPayload;
  file?: Express.Multer.File;
  body: {
    email?: string;
    documentName?: string;
    workspace?: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    workspaceName?: string;
    description?: string;
    userId?: string;
    permission?: string;
  };
}
