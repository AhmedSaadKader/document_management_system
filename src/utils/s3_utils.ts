import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Response } from 'express';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
} as S3ClientConfig);

export const createBucket = async (bucketName: string) => {
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket created: ${bucketName}`);
  } catch (error) {
    console.log((error as Error).message);
  }
};

// Upload a file
export const uploadFile = async (
  bucketName: string,
  fileKey: string,
  fileBody: Buffer,
  contentType: string
) => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBody,
      ContentType: contentType,
    });
    await s3Client.send(command);
    console.log(`File uploaded: ${fileKey}`);
    // return command;
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
    throw error;
  }
};

export const listBuckets = async () => {
  try {
    const response = await s3Client.send(new ListBucketsCommand({}));
    console.log('Buckets:', response.Buckets);
  } catch (error) {
    console.error('Error listing buckets:', error);
  }
};

export const streamToString = (stream: Readable): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64'))); // Convert to base64
  });
};

export const streamToResponse = (stream: Readable, res: Response) => {
  stream.on('data', (chunk) => res.write(chunk));
  stream.on('end', () => res.end());
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    res.status(500).json({ message: 'Error streaming the file' });
  });
};

// Read a file
export const readFile = async (bucketName: string, fileKey: string) => {
  try {
    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      })
    );
    console.log(`File read: ${fileKey}`);
    return Body;
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    throw error;
  }
};

// Delete a file
export const deleteFile = async (bucketName: string, fileKey: string) => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      })
    );
    console.log(`File deleted: ${fileKey}`);
  } catch (error) {
    console.error(`Error deleting file: ${error}`);
    throw error;
  }
};

// Delete a bucket
export const deleteBucket = async (bucketName: string) => {
  try {
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket deleted: ${bucketName}`);
  } catch (error) {
    console.error(`Error deleting bucket: ${error}`);
    throw error;
  }
};
