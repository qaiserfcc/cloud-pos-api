import { Router } from 'express';
import { authenticateToken, requireTenantAccess } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requireTenantAccess, (req, res) => {
  res.json({ message: 'Sync routes placeholder' });
});

export default router;