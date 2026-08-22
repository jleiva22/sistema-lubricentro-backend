import * as catalogoService from '../services/catalogo.service.js';

export const getCatalogos = async (req, res) => {
  try {
    const items = await catalogoService.getAll();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCatalogoById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await catalogoService.getById(id);
    return res.status(200).json(item);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const createCatalogo = async (req, res) => {
  try {
    const result = await catalogoService.create(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateCatalogo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await catalogoService.update(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteCatalogo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await catalogoService.remove(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};