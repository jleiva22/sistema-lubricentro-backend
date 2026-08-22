import { Router } from 'express';
import {
  getCatalogos,
  getCatalogoById,
  createCatalogo,
  updateCatalogo,
  deleteCatalogo
} from '../controllers/catalogos.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta pública para cotizador de Landing Page
router.get('/public', getCatalogos);

// Rutas protegidas
router.use(authMiddleware);

router.get('/', authorizeRoles('administrador', 'mecanico', 'cliente'), getCatalogos);
router.get('/:id', authorizeRoles('administrador', 'mecanico', 'cliente'), getCatalogoById);
router.post('/', authorizeRoles('administrador', 'mecanico'), createCatalogo);
router.put('/:id', authorizeRoles('administrador', 'mecanico'), updateCatalogo);
router.delete('/:id', authorizeRoles('administrador'), deleteCatalogo);

export default router;