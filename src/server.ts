import dotenv from 'dotenv';
import app from './app';

process.on('uncaughtException', (err: Error) => {
  console.log('Uncaught Exception, Shutting Down');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './.env' });

const port: number = parseInt(process.env.PORT as string, 10) || 3000;

const server = app.listen(port, () => {
  console.log(`Application is running on localhost:${port}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.log('Unhandled Rejection, Shutting Down');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
