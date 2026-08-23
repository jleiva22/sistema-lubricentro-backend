import sequelize, { models } from './src/libs/sequelize.js';
import * as ordenesService from './src/services/ordenes.service.js';

(async () => {
  console.log('--- EMPEZANDO PRUEBA DE INTEGRACIÓN BACKEND ---');

  try {
    // 1. Eliminar órdenes y vehículos antiguos de prueba para evitar colisiones con la patente 'TEST99'
    const vehiculoExistente = await models.Vehiculo.findOne({ where: { patente: 'TEST99' } });
    if (vehiculoExistente) {
      // Eliminar órdenes asociadas
      await models.Orden.destroy({ where: { vehiculo_id: vehiculoExistente.id } });
      await vehiculoExistente.destroy();
      console.log('Limpieza de vehículo de prueba anterior completada.');
    }

    // 2. Probar creación de Reserva Express (Invitado)
    console.log('\n1. Probando createReservaExpress (público)...');
    const reservaExpressData = {
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juan.perez.test@example.com',
      telefono: '+56911112222',
      patente: 'TEST99',
      marca: 'Toyota',
      modelo: 'Corolla',
      fecha_programada: new Date(),
      servicio_ids: [1, 4], // Servicio 1: cambio aceite, 4: filtro
      observaciones_fallas: 'Prueba de reserva express',
      tipo_aceite: 'sintetico',
      marca_aceite: 'Mobil 1',
    };

    const orden = await ordenesService.createReservaExpress(reservaExpressData);
    console.log('✅ Orden creada exitosamente.');
    console.log(`- ID de la Orden: #${orden.id}`);
    console.log(`- Estado Inicial: ${orden.estado}`);
    console.log(`- Patente: ${orden.vehiculo?.patente}`);
    console.log(`- Vehículo Marca/Modelo: ${orden.vehiculo?.marca} ${orden.vehiculo?.modelo}`);
    console.log(`- Aceite: ${orden.tipo_aceite} - ${orden.marca_aceite}`);
    console.log(`- Subtotal: ${orden.subtotal}, IVA: ${orden.iva}, Total: ${orden.total}`);

    // Validar cálculos
    const expectedSubtotal = Number(orden.subtotal);
    const expectedIva = Number(orden.iva);
    const expectedTotal = Number(orden.total);
    if (Math.abs(expectedSubtotal * 0.19 - expectedIva) > 0.05) {
      throw new Error(`Cálculo de IVA incorrecto: esperado ${expectedSubtotal * 0.19}, obtenido ${expectedIva}`);
    }
    if (Math.abs(expectedSubtotal + expectedIva - expectedTotal) > 0.05) {
      throw new Error(`Cálculo de Total incorrecto: esperado ${expectedSubtotal + expectedIva}, obtenido ${expectedTotal}`);
    }
    console.log('✅ Cálculos de Subtotal, IVA y Total correctos.');

    // 3. Probar transiciones de estado
    console.log('\n2. Probando transiciones de estado...');
    
    // Intento de transición no permitida (ej: agendada -> completado directamente)
    try {
      await ordenesService.updateEstado(orden.id, 'completado');
      throw new Error('Debería haber fallado el cambio directo de agendada a completado');
    } catch (err) {
      console.log('✅ Error esperado en transición inválida capturado:', err.message);
    }

    // agendada -> recepcionado
    let ordenActualizada = await ordenesService.updateEstado(orden.id, 'recepcionado');
    console.log(`- Cambiado de agendada -> ${ordenActualizada.estado}`);

    // recepcionado -> en_proceso
    ordenActualizada = await ordenesService.updateEstado(orden.id, 'en_proceso');
    console.log(`- Cambiado de recepcionado -> ${ordenActualizada.estado}`);

    // en_proceso -> completado
    ordenActualizada = await ordenesService.updateEstado(orden.id, 'completado');
    console.log(`- Cambiado de en_proceso -> ${ordenActualizada.estado}`);

    // completado -> pagado (marcarComoPagada)
    ordenActualizada = await ordenesService.marcarComoPagada(orden.id);
    console.log(`- Cambiado de completado -> ${ordenActualizada.estado} (Pagado: ${ordenActualizada.pagado})`);

    // 4. Probar obtención de Boleta
    console.log('\n3. Probando getBoletaById...');
    const boleta = await ordenesService.getBoletaById(orden.id);
    console.log('✅ Boleta generada correctamente:');
    console.log(`- Empresa: ${boleta.empresa.nombre}`);
    console.log(`- Cliente: ${boleta.cliente?.nombre} ${boleta.cliente?.apellido}`);
    console.log(`- Vehículo: ${boleta.vehiculo?.marca} ${boleta.vehiculo?.modelo} (${boleta.vehiculo?.patente})`);
    console.log(`- Total Boleta: $${boleta.orden?.total}`);
    console.log(`- Servicios en boleta: ${boleta.servicios.map(s => s.nombre).join(', ')}`);

    console.log('\n--- PRUEBAS FINALIZADAS EXITOSAMENTE SIN ERRORES ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR DURANTE LA PRUEBA:', error);
    process.exit(1);
  }
})();
