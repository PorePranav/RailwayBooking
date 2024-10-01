# Railway Booking System

This README provides instructions for setting up and running the Railway Booking System.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/PorePranav/RailwayBooking.git
   ```

2. Navigate to the project directory:

   ```bash
   cd RailwayBooking
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Getting Started

1. Set up the `.env` file:

   - Make a copy of `.env.example` and name it `.env`
   - Set up environment variables for `JWT_SECRET` and `ADMIN_API_KEY`
   - Keep other variables the same to use docker-compose, or modify as needed

2. Start the Postgres and Redis services using Docker Compose:

   ```bash
   docker-compose up
   ```

3. Migrate the database to use the latest Prisma schema:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Build the project:

   ```bash
   npm run build
   ```

5. Start the project:
   ```bash
   npm run start
   ```

## Additional Information

- Ensure Docker and Docker Compose are installed on your system before running the docker-compose command if you are using the default Redis and Postgres services
- Make sure you have Node.js and npm installed to run the npm commands.
