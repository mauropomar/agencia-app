'use strict'

var express = require('express');
var Controller = require('../controllers/clientesprog');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();


api.get('/clientes-prog/:page?', md_auth.ensureAuth, Controller.getClientesByProg);
api.get('/clientes-progsuc/:page?', md_auth.ensureAuth, Controller.getClientesByProgSucursal);
api.get('/clientes-prog-tiposuc/:page?', md_auth.ensureAuth, Controller.getClientesByProgTipoSucursal);
module.exports = api;
