import { Router } from 'express';
import {
  getBoletas,
  getBoletaById,
  getBoletaByOrderId,
  createBoletaFromOrder,
  deleteBoleta,
} from '../controllers/boletas.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRoles('administrador', 'mecanico', 'cliente'), getBoletas);
router.get('/:id', authorizeRoles('administrador', 'mecanico', 'cliente'), getBoletaById);
router.get('/orden/:ordenId', authorizeRoles('administrador', 'mecanico', 'cliente'), getBoletaByOrderId);
router.post('/orden/:ordenId', authorizeRoles('administrador', 'mecanico'), createBoletaFromOrder);
router.delete('/:id', authorizeRoles('administrador'), deleteBoleta);

export default router;
