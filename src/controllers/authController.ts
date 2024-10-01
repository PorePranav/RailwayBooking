import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import prisma from '../utils/prisma';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

import { User } from '@prisma/client';

type jwtPayload = {
  userId: number;
  role: string;
};

const signToken = (userId: number, role: string) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN as string,
  });
};

const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(user.id, user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 86400000
    ),
    httpOnly: true,
    sameSite: 'none' as const,
    secure: process.env.NODE_ENV === 'production',
  };

  const { password, ...rest } = user;

  res.cookie('jwt', token, cookieOptions).status(statusCode).json({
    status: 'success',
    rest,
  });
};

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be atleast 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export const signupController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const zodResult = signupSchema.safeParse(req.body);

    if (!zodResult.success) {
      const errors = zodResult.error.errors.map((err) => err.message);
      throw new AppError(errors.join(', '), 400);
    }

    const { email, password } = zodResult.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    createSendToken(user, 201, res);
  }
);

export const loginController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const zodResult = loginSchema.safeParse(req.body);

    if (!zodResult.success) {
      const errors = zodResult.error.errors.map((err) => err.message);
      throw new AppError(errors.join(', '), 400);
    }

    const { email, password } = zodResult.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new AppError('Invalid email or password', 401);

    createSendToken(user, 200, res);
  }
);

export const createAdminUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token !== process.env.ADMIN_API_KEY)
      return next(
        new AppError('You are unauthorized to perform this action', 403)
      );

    const zodResult = signupSchema.safeParse(req.body);

    if (!zodResult.success) {
      const errors = zodResult.error.errors.map((err) => err.message);
      throw new AppError(errors.join(', '), 400);
    }

    const { email, password } = zodResult.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    res.status(201).json({
      status: 'success',
      data: user,
    });
  }
);

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt;
    if (!token || token == null)
      return next(new AppError('User is not logged in', 401));

    const decoded = await jwt.verify(token, process.env.JWT_SECRET as string);

    const fetchedUser = await prisma.user.findUnique({
      where: {
        id: (decoded as jwtPayload).userId,
      },
    });

    if (!fetchedUser) return next(new AppError('User does not exist', 401));

    req.user = fetchedUser as User;
    next();
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req.user as User).role))
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    next();
  };
};
