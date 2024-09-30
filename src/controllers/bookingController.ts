import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import prisma from '../utils/prisma';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

const bookingSchema = z.object({
  trainId: z.number({ required_error: 'Train ID is required' }),
  seatCount: z.number({ required_error: 'Seat count is required' }),
});

export const bookSeat = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const zodResult = bookingSchema.safeParse(req.body);
    if (!zodResult.success) {
      const errors = zodResult.error.errors.map((err) => err.message);
      return next(new AppError(errors.join(', '), 400));
    }

    const { trainId, seatCount } = zodResult.data;

    const userId = req.user?.id;
    if (!userId) return next(new AppError('User not logged in', 403));

    const result = await prisma.$transaction(async (prisma) => {
      const train = await prisma.train.findUnique({
        where: {
          id: trainId,
        },
        include: { bookings: true },
      });

      if (!train)
        return next(new AppError(`Train with id ${trainId} not found`, 404));

      const bookedSeats = train.bookings.reduce(
        (acc, booking) => acc + booking.seatCount,
        0
      );

      const availableSeats = train.totalSeats - bookedSeats;

      if (availableSeats < seatCount)
        return next(new AppError('Not enough seats available', 400));

      return prisma.booking.create({
        data: {
          userId,
          trainId,
          seatCount,
        },
      });
    });

    res.status(201).json({
      status: 'success',
      data: result,
    });
  }
);
