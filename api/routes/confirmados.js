'use strict'

var express = require('express');
var Controller = require('../controllers/confirmados');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();


api.get('/cliente-confirmados/:page?', md_auth.ensureAuth, Controller.getClienteConfirmados);
api.get('/cliente-confirmados-suc/:page?', md_auth.ensureAuth, Controller.getConfirmadosSucursal);
api.get('/cliente-confirmados-tiposuc/:page?', md_auth.ensureAuth, Controller.getConfirmadosTipo);
api.get('/filter-confirmados', md_auth.ensureAuth,Controller.filterConfirmados);
api.get('/filter-confirmados-sucursal', md_auth.ensureAuth, Controller.filterConfirmadosSucursal);
api.get('/filter-confirmados-tiposucursal', md_auth.ensureAuth, Controller.filterConfirmadosTipoSucursal);
api.put('/nopago-cliente/:id', md_auth.ensureAuth, Controller.noPagoCliente);
api.put('/noabordo-cliente/:id', md_auth.ensureAuth, Controller.noAbordoCliente);
api.put('/confirmar-todos', md_auth.ensureAuth, Controller.confirmarTodos);
api.put('/confirmar-cliente/:id', md_auth.ensureAuth, Controller.confirmarCliente);
module.exports = api;