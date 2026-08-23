import * as ordenesService from '../services/ordenes.service.js';

export const getOrdenes = async (req, res) => {
  try {
    const ordenes = await ordenesService.getAll(req.user);
    return res.status(200).json(ordenes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getOrdenById = async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await ordenesService.getById(id, req.user);
    return res.status(200).json(orden);
  } catch (error) {
    const status = error.statusCode || 404;
    return res.status(status).json({ message: error.message });
  }
};

// Crear orden completa (admin/mecánico)
export const createOrden = async (req, res) => {
  try {
    const newOrden = await ordenesService.create(req.body, req.user);
    return res.status(201).json({
      message: 'Orden de trabajo registrada exitosamente',
      data: newOrden,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Crear solicitud/orden desde cliente autenticado (Tarea 3)
export const createOrdenCliente = async (req, res) => {
  try {
    const newOrden = await ordenesService.createOrdenCliente(req.body, req.user);
    return res.status(201).json({
      message: 'Solicitud de servicio creada exitosamente',
      data: newOrden,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Reserva express pública (Landing Page)
export const createReservaExpressPublic = async (req, res) => {
  try {
    const newOrden = await ordenesService.createReservaExpress(req.body);
    return res.status(201).json({
      message: 'Reserva express registrada correctamente en la base de datos',
      data: newOrden,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateEstadoOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const ordenActualizada = await ordenesService.updateEstado(id, estado, req.user);
    return res.status(200).json({
      message: 'Estado actualizado correctamente',
      data: ordenActualizada,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const pagarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await ordenesService.marcarComoPagada(id);
    return res.status(200).json({
      message: 'Orden marcada como pagada',
      data: orden,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getBoletaOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const boleta = await ordenesService.getBoletaById(id, req.user);
    return res.status(200).json(boleta);
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({ message: error.message });
  }
};

export const deleteOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ordenesService.remove(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};