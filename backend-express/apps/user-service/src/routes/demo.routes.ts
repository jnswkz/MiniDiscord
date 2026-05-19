import { Router } from 'express';
import { DemoController } from '../controllers/demo.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const demoRouter = Router();

demoRouter.get('/public', DemoController.publicAccess);
demoRouter.get('/user', requireAuth, DemoController.userAccess);
demoRouter.get('/admin', requireAuth, DemoController.adminAccess);
