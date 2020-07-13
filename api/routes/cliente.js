'use strict'

var express = require('express');
var ClienteController = require('../controllers/cliente');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-cliente', md_auth.ensureAuth,ClienteController.saveCliente);
api.get('/filter-cliente', md_auth.ensureAuth,ClienteController.filterCliente);
api.get('/filter-cliente-tiposucursal', md_auth.ensureAuth,ClienteController.filterClienteTipoSucursal);
api.get('/filter-cliente-sucursal', md_auth.ensureAuth,ClienteController.filterClienteSucursal);
api.put('/update-cliente/:id', md_auth.ensureAuth, ClienteController.updateCliente);

api.get('/cliente/:id', md_auth.ensureAuth, ClienteController.getCliente);
api.get('/clientes/:page?', md_auth.ensureAuth, ClienteController.getClientes);
api.get('/clientes-suc/:page?', md_auth.ensureAuth, ClienteController.getClientesBySucursal);
api.get('/clientes-tiposuc/:page?', md_auth.ensureAuth, ClienteController.getClientesByTipoSucursal);
api.get('/clientes-pais/:page?', md_auth.ensureAuth, ClienteController.getClientesByPais);
api.delete('/delete-cliente/:id',md_auth.ensureAuth, ClienteController.deleteCliente);
module.exports = api;
