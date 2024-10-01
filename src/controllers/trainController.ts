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

const updateTrainSchema = z.object({
  name: z.string().optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  totalSeats: z.number().optional(),
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

    const trains = await prisma.train.findMany({
      where: { source, destination },
    });

    const fetchedTrains = await Promise.all(
      trains.map(async (train) => {
        const bookedSeats = await prisma.booking.aggregate({
          _sum: {
            seatCount: true,
          },
          where: {
            trainId: train.id,
            status: 'BOOKED',
          },
        });

        const totalSeats = train.totalSeats;
        const availableSeats = totalSeats - (bookedSeats._sum.seatCount || 0);

        return {
          ...train,
          availableSeats,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: fetchedTrains,
    });
  }
);

export const updateTrain = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const trainId = parseInt(req.params.id);
    const zodResult = updateTrainSchema.safeParse(req.body);
    if (!zodResult.success) {
      const errors = zodResult.error.errors.map((err) => err.message);
      throw new AppError(errors.join(', '), 400);
    }
    const { name, source, destination, totalSeats } = zodResult.data;
    const inputData: any = {};
    if (name !== undefined) inputData.name = normalizeString(name);
    if (source !== undefined) inputData.source = normalizeString(source);
    if (destination !== undefined)
      inputData.destination = normalizeString(destination);
    if (totalSeats !== undefined) inputData.totalSeats = totalSeats;

    if (
      inputData.source &&
      inputData.destination &&
      inputData.source === inputData.destination
    ) {
      throw new AppError('Source and destination cannot be the same', 400);
    }

    if (
      (inputData.source && !inputData.destination) ||
      (!inputData.source && inputData.destination)
    ) {
      const existingTrain = await prisma.train.findUnique({
        where: { id: trainId },
        select: { source: true, destination: true },
      });

      if (existingTrain) {
        const newSource = inputData.source || existingTrain.source;
        const newDestination =
          inputData.destination || existingTrain.destination;

        if (newSource === newDestination) {
          throw new AppError('Source and destination cannot be the same', 400);
        }
      }
    }

    const train = await prisma.train.update({
      where: {
        id: trainId,
      },
      data: inputData,
    });

    res.status(200).json({
      status: 'success',
      data: {
        train,
      },
    });
  }
);
