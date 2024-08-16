import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || '5000';
const address = `localhost:${port}`;

app.use(express.json());
app.use(cors());

app.get('/', function (req: Request, res: Response) {
  res.send('Document Management System');
});

app.listen(port, () => {
  console.log(`Starting app on: ${address}`);
});

export default app;
