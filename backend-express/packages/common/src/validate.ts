
import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './appError';

export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    return next(new AppError('Validation Error', 400));
  }
};
