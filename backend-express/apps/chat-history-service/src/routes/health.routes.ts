import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'OK', data: { service: 'chat-history-service' } });
});

export { router as healthRouter };
