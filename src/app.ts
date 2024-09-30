import express, { Response, Request, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: 'success',
    message: 'express server is live',
  });
});

export default app;
