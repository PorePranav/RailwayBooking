import express, { Response, Request, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRouter from './routers/authRouter';
import trainRouter from './routers/trainRouter';

import AppError from './utils/AppError';
import globalErrorHandler from './controllers/errorController';
import bookingRouter from './routers/bookingRouter';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/trains', trainRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
