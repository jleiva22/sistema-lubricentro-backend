import { Router } from 'express';
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
} from '../controllers/clientes.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRoles('administrador', 'mecanico', 'cliente'), getClientes);
router.get('/:id', authorizeRoles('administrador', 'mecanico', 'cliente'), getClienteById);
router.post('/', authorizeRoles('administrador', 'mecanico'), createCliente);
router.put('/:id', authorizeRoles('administrador', 'mecanico'), updateCliente);
router.delete('/:id', authorizeRoles('administrador'), deleteCliente);

export default router;