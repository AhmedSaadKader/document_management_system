import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Pool } from 'pg';

// Load environment variables from a .env file into process.env
dotenv.config();

// Destructure required environment variables for PostgreSQL connection
const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_DB,
  POSTGRES_DB_TEST,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  ENV,
  MONGODB_CONNECTION,
  POSTGRES_HOST_DEV,
  POSTGRES_PORT_DEV,
  POSTGRES_DB_DEV,
  POSTGRES_USER_DEV,
  POSTGRES_PASSWORD_DEV,
} = process.env;

// Create a new Pool instance for managing PostgreSQL connections
// Default configuration is empty and will be overwritten based on environment
export let sqlClient = new Pool({
  host: '',
  port: 5432,
  database: '',
  user: '',
  password: '',
});

// MongoDB connection setup
if (ENV !== 'test') {
  // Connect to MongoDB for development or production
  mongoose
    .connect(MONGODB_CONNECTION as string)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// Configure the Pool based on the environment
// Development environment
if (ENV == 'dev') {
  sqlClient = new Pool({
    host: POSTGRES_HOST_DEV,
    port: Number(POSTGRES_PORT_DEV) | 5432,
    database: POSTGRES_DB_DEV,
    user: POSTGRES_USER_DEV,
    password: POSTGRES_PASSWORD_DEV,
  });
}

// Test environment
if (ENV == 'test') {
  sqlClient = new Pool({
    host: POSTGRES_HOST_DEV,
    port: Number(POSTGRES_PORT_DEV) | 5432,
    database: POSTGRES_DB_TEST,
    user: POSTGRES_USER_DEV,
    password: POSTGRES_PASSWORD_DEV,
  });
}

// Production environment
if (ENV == 'production') {
  sqlClient = new Pool({
    host: POSTGRES_HOST,
    port: Number(POSTGRES_PORT),
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
  });
}
