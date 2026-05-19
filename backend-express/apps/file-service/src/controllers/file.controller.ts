import { Request, Response } from 'express';
import { asyncHandler, sendSuccess, AppError } from '@minidiscord/common';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class FileController {
  static uploadFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // In a real app, we'd upload to Backblaze B2 or S3 here.
    // For the demo dev fallback, we save to local uploads directory and return a URL.
    
    // We are using multer which already saved the file if configured with dest.
    // We'll rename it to have the original extension.
    const fileId = crypto.randomUUID();
    const ext = path.extname(req.file.originalname);
    const filename = `${fileId}${ext}`;
    
    fs.renameSync(req.file.path, path.join(UPLOADS_DIR, filename));

    // The frontend expects a file object containing url and key.
    const fileUrl = `${req.protocol}://${req.get('host')}/api/files/download/${filename}`;

    sendSuccess(res, {
      key: filename,
      url: fileUrl,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    }, 201);
  });

  static downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.sendFile(filePath);
  });

  static deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const filePath = path.join(UPLOADS_DIR, key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    sendSuccess(res, { message: 'File deleted' });
  });
}
