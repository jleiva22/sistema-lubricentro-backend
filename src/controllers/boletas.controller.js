import * as boletasService from '../services/boletas.service.js';

export const getBoletas = async (req, res, next) => {
  try {
    const boletas = await boletasService.getAll(req.user);
    return res.status(200).json(boletas);
  } catch (error) {
    return next(error);
  }
};

export const getBoletaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const boleta = await boletasService.getById(id, req.user);
    return res.status(200).json(boleta);
  } catch (error) {
    return next(error);
  }
};

export const getBoletaByOrderId = async (req, res, next) => {
  try {
    const { ordenId } = req.params;
    const boleta = await boletasService.getByOrderId(ordenId, req.user);
    return res.status(200).json(boleta);
  } catch (error) {
    return next(error);
  }
};

export const createBoletaFromOrder = async (req, res, next) => {
  try {
    const { ordenId } = req.params;
    const boleta = await boletasService.createFromOrder(ordenId);
    return res.status(201).json({
      message: 'Boleta emitida correctamente',
      data: boleta,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteBoleta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await boletasService.remove(id);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
