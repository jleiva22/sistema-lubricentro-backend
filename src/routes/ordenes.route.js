import { Router } from 'express';
import {
  getOrdenes,
  getOrdenById,
  createOrden,
  createReservaExpressPublic,
  updateEstadoOrden,
  pagarOrden,
  getBoletaOrden,
  deleteOrden,
} from '../controllers/ordenes.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta pública para reserva express desde el Landing Page
router.post('/public', createReservaExpressPublic);

// Rutas protegidas
router.use(authMiddleware);

router.get('/', authorizeRoles('administrador', 'mecanico', 'cliente'), getOrdenes);
router.get('/:id', authorizeRoles('administrador', 'mecanico', 'cliente'), getOrdenById);
router.post('/', authorizeRoles('administrador', 'mecanico'), createOrden);
router.patch('/:id/estado', authorizeRoles('administrador', 'mecanico'), updateEstadoOrden);
router.patch('/:id/pagar', authorizeRoles('administrador', 'mecanico'), pagarOrden);
router.get('/:id/boleta', authorizeRoles('administrador', 'mecanico', 'cliente'), getBoletaOrden);
router.delete('/:id', authorizeRoles('administrador'), deleteOrden);

export default router;