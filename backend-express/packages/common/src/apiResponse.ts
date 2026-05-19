import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export const sendSuccess = (res: Response, data: any, statusCode: number = 200, message?: string) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
