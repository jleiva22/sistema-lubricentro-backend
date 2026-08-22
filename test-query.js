import { models } from './src/libs/sequelize.js';

(async () => {
  try {
    await models.sequelize?.authenticate?.();
  } catch (e) {
    // ignore
  }

  const cliente = await models.Cliente.findByPk(3);
  console.log('cliente by pk:', cliente ? cliente.toJSON() : null);

  const clienteByEmail = await models.Cliente.findOne({ where: { email: 'pedro.sanchez@example.com' } });
  console.log('cliente by email:', clienteByEmail ? clienteByEmail.toJSON() : null);

  const clienteByUsuarioId = await models.Cliente.findOne({ where: { usuario_id: 3 } });
  console.log('cliente by usuario_id:', clienteByUsuarioId ? clienteByUsuarioId.toJSON() : null);

  process.exit(0);
})();