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
} = process.env;

// Create a new Pool instance for managing PostgreSQL connections
// Default configuration is empty and will be overwritten based on environment
export let sqlClient = new Pool({
  host: '',
  port: 5433,
  database: '',
  user: '',
  password: '',
});

// export const mongoClient = mongoose.connect('mongodb://localhost:27017/test');
export const mongoClient = mongoose.connect(MONGODB_CONNECTION as string);

// Configure the Pool based on the environment
// Development environment
if (ENV == 'dev') {
  sqlClient = new Pool({
    host: POSTGRES_HOST,
    port: Number(POSTGRES_PORT) | 5433,
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
  });
}

// Test environment
if (ENV == 'test') {
  sqlClient = new Pool({
    host: POSTGRES_HOST,
    port: Number(POSTGRES_PORT),
    database: POSTGRES_DB_TEST,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
  });
}
