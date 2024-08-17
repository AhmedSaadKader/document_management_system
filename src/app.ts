import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables from a .env file into process.env
dotenv.config();

// Create an instance of the Express application
const app = express();

// Define the port for the application to listen on
const port = process.env.PORT || '5000';

// Define the address of the application for logging purposes
const address = `localhost:${port}`;

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Route handler for the root path
// Sends a simple response to indicate that the server is running
app.get('/', function (req: Request, res: Response) {
  res.send('Document Management System');
});

// Start the server and listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`Starting app on: ${address}`);
});

// Export the app instance for potential use in testing or integration with other modules
export default app;
