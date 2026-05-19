import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '@minidiscord/common';

export class DemoController {
  static publicAccess = asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, { message: 'Public content. Anyone can see this.' });
  });

  static userAccess = asyncHandler(async (req: Request, res: Response) => {
    // Rely on gateway or local auth middleware
    sendSuccess(res, { 
      message: 'User content. You must be logged in.',
      user: (req as any).user 
    });
  });

  static adminAccess = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin role required.' });
    }
    
    sendSuccess(res, { 
      message: 'Admin content. You have admin privileges.',
      user 
    });
  });
}
