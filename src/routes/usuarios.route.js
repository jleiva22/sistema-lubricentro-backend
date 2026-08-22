import { Router } from 'express';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '../controllers/usuarios.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRoles('administrador', 'mecanico'), getUsuarios);
router.get('/:id', authorizeRoles('administrador', 'mecanico'), getUsuarioById);
router.post('/', authorizeRoles('administrador'), createUsuario);
router.put('/:id', authorizeRoles('administrador'), updateUsuario);
router.delete('/:id', authorizeRoles('administrador'), deleteUsuario);

export default router;
