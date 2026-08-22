import * as clienteService from '../services/clientes.service.js';

export const getClientes = async (req, res) => {
  try {
    const clientes = await clienteService.getAll();
    return res.status(200).json(clientes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await clienteService.getById(id);
    return res.status(200).json(cliente);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const createCliente = async (req, res) => {
  try {
    const result = await clienteService.create(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await clienteService.update(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await clienteService.remove(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};