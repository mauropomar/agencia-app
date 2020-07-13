'use strict'

var express = require('express');
var bodyParser = require('body-parser');

// Setting config for .env file
const dotenv = require('dotenv');
dotenv.config();

var app = express();
//cargar rutas
var user_routes = require('./routes/usuario');
var rol_routes = require('./routes/rol');
var pais_routes = require('./routes/pais');
var ciudad_routes = require('./routes/ciudad');
var sucursal_routes = require('./routes/sucursal');
var rutas_routes = require('./routes/ruta');
var subrutas_routes = require('./routes/subruta');
var cliente_routes = require('./routes/cliente');
var prog_routes = require('./routes/programacion');
var tipohaitacion_routes = require('./routes/tipohabitacion');
var configuracion_routes = require('./routes/configuracion');
var notificaciones_routes = require('./routes/notificacion');
var tiposucursal_routes = require('./routes/tiposucursal');
var clientespro_routes = require('./routes/clientesprog');
var confirmados_routes = require('./routes/confirmados');
var diponibilidad_routes = require('./routes/disponibilidad');
var importar_routes = require('./routes/importar');
var imprimir_routes = require('./routes/imprimir');
var general_routes = require('./routes/general');

//middleware

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

//rutas
app.use('/api', user_routes);
app.use('/api', rol_routes);
app.use('/api', pais_routes);
app.use('/api', ciudad_routes);
app.use('/api', sucursal_routes);
app.use('/api', subrutas_routes);
app.use('/api', rutas_routes);
app.use('/api', cliente_routes);
app.use('/api', prog_routes);
app.use('/api', tipohaitacion_routes);
app.use('/api', tiposucursal_routes);
app.use('/api', configuracion_routes);
app.use('/api', notificaciones_routes);
app.use('/api', clientespro_routes);
app.use('/api', confirmados_routes);
app.use('/api', diponibilidad_routes);
app.use('/api', importar_routes);
app.use('/api', imprimir_routes);
app.use('/api', general_routes);

//exportar

module.exports = app;

