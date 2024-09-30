import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import { bookingQueue } from '../queue/bullmq';

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

    const job = await bookingQueue.add('bookSeat', {
      userId,
      trainId,
      seatCount,
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
          message: 'Booking completed',
          booking: result,
        },
      });
    } else if (state === 'failed') {
      const reason = await job.failedReason;
      res.status(400).json({
        status: 'failed',
        data: {
          message: 'Booking failed',
          reason,
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
