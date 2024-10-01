import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import { bookingQueue } from '../queue/bullmq';
import prisma from '../utils/prisma';

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

    const train = await prisma.train.findUnique({
      where: { id: trainId },
    });

    if (!train)
      return next(new AppError(`Train with id ${trainId} not found`, 404));

    const userId = req.user?.id;
    if (!userId) return next(new AppError('User not logged in', 403));

    const newBooking = await prisma.booking.create({
      data: {
        userId,
        trainId,
        seatCount,
        status: 'PENDING',
      },
    });

    const job = await bookingQueue.add('bookSeat', {
      userId,
      trainId,
      seatCount,
      bookingId: newBooking.id,
    });

    res.status(201).json({
      status: 'pending',
      data: {
        message: 'Booking request received and is being processed',
        jobId: job.id,
      },
    });
  }
);

export const getBookingStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const jobId = req.params.jobId;
    const job = await bookingQueue.getJob(jobId);
    if (!job) return next(new AppError('Job not found', 404));

    const state = await job.getState();

    if (state === 'completed') {
      const result = await job.returnvalue;
      res.status(200).json({
        status: 'success',
        data: {
          booking: result,
        },
      });
    } else {
      res.status(200).json({
        status: 'pending',
        data: {
          message: 'Booking request received and is being processed',
        },
      });
    }
  }
);

export const getBookingByUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('User not logged in', 403));

    const bookings = await prisma.booking.findMany({
      where: { userId },
    });

    res.status(200).json({
      status: 'success',
      data: {
        count: bookings.length,
        bookings,
      },
    });
  }
);

export const getBookingById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) return next(new AppError('Booking not found', 404));

    if (booking.userId !== req.user?.id)
      return next(
        new AppError('You are unauthorized to perform this action', 403)
      );

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  }
);
