import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const { ENV, MONGODB_CONNECTION } = process.env;

export const initializeMongoDbDatabase = () => {
  // MongoDB connection setup
  if (ENV !== 'test') {
    // Connect to MongoDB for development or production
    mongoose
      .connect(MONGODB_CONNECTION as string)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => console.error('MongoDB connection error:', err));
  }
};
