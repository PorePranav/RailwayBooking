import Redis from 'ioredis';

const redisOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!),
  maxRetriesPerRequest: null,
};

export default new Redis(process.env.REDIS_URL as string, redisOptions);
