import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import { createBucket, uploadFile } from '../utils/s3_utils';
import fs from 'fs';

export const s3UploadMiddleware = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const file = req.file;
    const filePath = file.path;
    const bucketName = process.env.AWS_BUCKET_NAME as string;
    const fileKey = `${Date.now()}_${file.originalname}`;
    const contentType = file.mimetype;
    const fileBody = fs.readFileSync(filePath);

    await createBucket(bucketName);
    console.log(`Bucket created or already exists: ${bucketName}`);

    // Upload to S3
    await uploadFile(bucketName, fileKey, fileBody, contentType);

    // Attach S3 file info to request object
    file.s3Key = fileKey;
    file.s3Bucket = bucketName;

    // Delete the file from disk after uploading to S3
    fs.unlinkSync(filePath);

    next();
  } catch (error) {
    next(new Error((error as Error).message));
  }
};
