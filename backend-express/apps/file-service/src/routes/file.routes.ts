import { Router } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/file.controller';
import { requireGatewayAuth } from '../middleware/auth.middleware';
import os from 'os';

// Setup multer to save to temp dir initially
const upload = multer({ dest: os.tmpdir() });

export const fileRouter = Router();

// Downloading doesn't strictly need auth for public URLs in many setups, but we'll leave it open for easy frontend rendering
fileRouter.get('/download/:filename', FileController.downloadFile);

// Upload and delete require auth
fileRouter.use(requireGatewayAuth);
fileRouter.post('/upload', upload.single('file'), FileController.uploadFile);
fileRouter.delete('/:key', FileController.deleteFile);
