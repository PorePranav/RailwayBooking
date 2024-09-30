import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import catchAsync from './../utils/catchAsync';
import AppError from '../utils/AppError';

const createTrainSchema = z.object({
  name: z.string({ required_error: 'Train name is required' }),
  source: z.string({ required_error: 'Source is required' }),
  destination: z.string({ required_error: 'Destination is required' }),
  totalSeats: z.number({ required_error: 'Seat count is required' }),
});

const normalizeString = (str: string) => str.trim().toLowerCase();

export const createTrain = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const zodResult = createTrainSchema.safeParse(req.body);
    if (!zodResult.success) {
      const errors = zodResult.error.errors.map((err) => err.message);
      throw new AppError(errors.join(', '), 400);
    }

    const { name, source, destination, totalSeats } = zodResult.data;
    const inputData = {
      name: normalizeString(name),
      source: normalizeString(source),
      destination: normalizeString(destination),
      totalSeats,
    };

    const train = await prisma.train.create({
      data: inputData,
    });

    res.status(201).json({
      status: 'success',
      data: {
        train,
      },
    });
  }
);

export const getTrain = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const source = normalizeString(req.query.source as string);
    const destination = normalizeString(req.query.destination as string);

    if (!source || !destination)
      return next(
        new AppError('Both source and destination are required', 400)
      );

    if (source === destination)
      return next(
        new AppError('Source and destination cannot be the same', 400)
      );

    const query = { source, destination };
    const fetchedTrains = await prisma.train.findMany({
      where: query,
    });

    res.status(200).json({
      status: 'success',
      data: fetchedTrains,
    });
  }
);
