import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables from a .env file into process.env
dotenv.config();

// Destructure required environment variables for PostgreSQL connection
const {
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_DB_TEST,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  ENV,
} = process.env;

// Create a new Pool instance for managing PostgreSQL connections
// Default configuration is empty and will be overwritten based on environment
let client = new Pool({
  host: '',
  database: '',
  user: '',
  password: '',
});

// Configure the Pool based on the environment
// Development environment
if (ENV == 'dev') {
  client = new Pool({
    host: POSTGRES_HOST,
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
  });
}

// Test environment
if (ENV == 'test') {
  client = new Pool({
    host: POSTGRES_HOST,
    database: POSTGRES_DB_TEST,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
  });
}

// Export the configured Pool instance for use in other parts of the application
export default client;
