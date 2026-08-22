import { Router } from 'express';
import {
  getVehiculos,
  getVehiculoByPatente,
  getVehiculoById,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo
} from '../controllers/vehiculos.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Rutas Generales
router.get('/', authorizeRoles('administrador', 'mecanico', 'cliente'), getVehiculos);

// Búsqueda por Patente (Especificidad antes de :id para evitar colisiones de rutas)
router.get('/patente/:patente', authorizeRoles('administrador', 'mecanico', 'cliente'), getVehiculoByPatente);

// Rutas por ID
router.get('/:id', authorizeRoles('administrador', 'mecanico', 'cliente'), getVehiculoById);
router.post('/', authorizeRoles('administrador', 'mecanico'), createVehiculo);
router.put('/:id', authorizeRoles('administrador', 'mecanico'), updateVehiculo);
router.delete('/:id', authorizeRoles('administrador'), deleteVehiculo);

export default router;