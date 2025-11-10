import { Router } from 'express';
import { authenticateToken, requireTenantAccess, requireStoreAccess } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requireTenantAccess, requireStoreAccess, (req, res) => {
  res.json({ message: 'Customer routes placeholder' });
});

export default router;