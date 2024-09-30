import express, { Response, Request, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import AppError from './utils/AppError';
import globalErrorHandler from './controllers/errorController';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
