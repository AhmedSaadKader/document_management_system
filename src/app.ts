import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRouter from './routes/user_routes';
import documentRouter from './routes/document_routes';
import workspaceRouter from './routes/workspace_routes';
import favoriteRoutes from './routes/favorite_routes';
import globalErrorHandler from './middleware/global_error_handler';

// Load environment variables from a .env file into process.env
dotenv.config();

// Create an instance of the Express application
const app = express();

// Define the port for the application to listen on
const port = process.env.PORT || '5000';

// Define the address of the application for logging purposes
const address = `localhost:${port}`;

const apiVersion = '/api/v1';

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to enable Cross-Origin Resource Sharing (CORS)
if (process.env.ENV == 'production') {
  console.log('production');
  app.use(
    cors({
      origin: ['http://localhost:3000', 'https://dms-atos.netlify.app/'],
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
} else {
  console.log('dev');
  app.use(
    cors({
      exposedHeaders: ['Content-Disposition'],
    })
  );
}

// Route handler for the root path
// Sends a simple response to indicate that the server is running
app.get('/', function (req: Request, res: Response) {
  res.send('Document Management System');
});

app.use(apiVersion + '/users', userRouter);

app.use(apiVersion + '/documents', documentRouter);

app.use(apiVersion + '/workspaces', workspaceRouter);

app.use(apiVersion + '/favorites', favoriteRoutes);

// Register the global error handler at the end
app.use(globalErrorHandler);

// Start the server and listen for incoming requests on the specified port
export const server = app.listen(port, () => {
  console.log(`Starting app on: ${address}`);
});

// Export the app instance for potential use in testing or integration with other modules
export default app;
