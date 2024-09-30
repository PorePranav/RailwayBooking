import { Queue, Worker } from 'bullmq';
import prisma from '../utils/prisma';
import connection from '../utils/redis';

export const bookingQueue = new Queue('booking', {
  connection,
});

const worker = new Worker(
  'booking',
  async (job) => {
    const { userId, trainId, seatCount } = job.data;
    const result = await prisma.$transaction(async (prisma) => {
      const train = await prisma.train.findUnique({
        where: { id: trainId },
        include: { bookings: true },
      });

      if (!train) throw new Error(`Train with id ${trainId} not found`);

      const bookedSeats = train.bookings.reduce(
        (acc, booking) => acc + booking.seatCount,
        0
      );

      const availableSeats = train.totalSeats - bookedSeats;

      if (availableSeats < seatCount)
        throw new Error('Not enough seats available');
      return prisma.booking.create({
        data: { userId, trainId, seatCount, status: 'BOOKED' },
      });
    });

    return result;
  },
  { connection }
);
