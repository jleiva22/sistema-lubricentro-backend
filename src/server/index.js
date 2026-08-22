// const products = require('../Routes/Products.js');
import clientes from '../routes/clientes.route.js'
import vehiculos from '../routes/vehiculos.route.js'
import ordenes from '../routes/ordenes.route.js'
import catalogos from '../routes/catalogos_servicios.route.js'
import usuarios from '../routes/usuarios.route.js'
import auth from '../routes/auth.route.js'
import boletas from '../routes/boletas.route.js'
// const users = require('../Routes/Users.js');
// const express = require('express');
import express from 'express'
// const clientRoutes = require('../Routes/Client.js');
// const categoryRoutes = require('../Routes/Category.js');

const apiRouter =(app)=> {
    const router = express.Router()
    app.use('/api/v1', router)
    router.use(('/auth'), auth);
    router.use(('/clientes'), clientes);
    router.use(('/vehiculos'), vehiculos);
    router.use(('/ordenes'), ordenes);
    router.use(('/catalogos'), catalogos);
    router.use(('/usuarios'), usuarios);
    router.use(('/boletas'), boletas);
}

export default apiRouter

