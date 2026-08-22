import * as usuarioService from '../services/usuarios.service.js';

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioService.getAll();
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await usuarioService.getById(id);
    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const result = await usuarioService.create(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await usuarioService.update(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await usuarioService.remove(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};
