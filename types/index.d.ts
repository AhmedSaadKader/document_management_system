import { Request } from 'express';

type UserPayload = {
  national_id?: number | string;
  username?: string;
  iat?: string | number;
};

export interface RequestAuth extends Request {
  user?: UserPayload;
  file?: Express.Multer.File;
}
