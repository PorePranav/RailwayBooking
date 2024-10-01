import { Queue, Worker } from 'bullmq';
import prisma from '../utils/prisma';
import connection from '../utils/redis';

export const bookingQueue = new Queue('booking', {
  connection,
});

const worker = new Worker(
  'booking',
  async (job) => {
    const { userId, trainId, seatCount, bookingId } = job.data;
    try {
      const result = await prisma.$transaction(async (prisma) => {
        const train = await prisma.train.findUnique({
          where: { id: trainId },
          include: { bookings: true },
        });

        if (!train) {
          throw new Error('Train not found');
        }

        const bookedSeats = train.bookings.reduce(
          (acc, booking) => acc + booking.seatCount,
          0
        );
        const availableSeats = train.totalSeats - bookedSeats;

        if (availableSeats < seatCount) {
          return { success: false, reason: 'Not enough seats available' };
        } else {
          const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'BOOKED' },
          });
          return { success: true, booking: updatedBooking };
        }
      });

      if (!result.success) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'FAILED' },
        });
        return { success: false, reason: result.reason };
      }

      return result;
    } catch (error) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  },
  { connection }
);
