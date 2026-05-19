import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'OK', data: { service: 'api-gateway' } });
});

export { router as healthRouter };
