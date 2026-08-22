import  * as vehiculoService from '../services/vehiculos.service.js';

export const getVehiculoByPatente = async (req, res) => {
  try {
    const { patente } = req.params;
    const vehiculo = await vehiculoService.getByPatente(patente);

    if (!vehiculo) {
      return res.status(404).json({ 
        found: false,
        message: `No se encontró ningún vehículo con la patente ${patente.toUpperCase()}` 
      });
    }

    return res.status(200).json({
      found: true,
      data: vehiculo
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getVehiculos = async (req, res) => {
  try {
    const vehiculos = await vehiculoService.getAll();
    return res.status(200).json(vehiculos);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getVehiculoById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehiculo = await vehiculoService.getById(id);
    return res.status(200).json(vehiculo);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const createVehiculo = async (req, res) => {
  try {
    const result = await vehiculoService.create(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await vehiculoService.update(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await vehiculoService.remove(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};