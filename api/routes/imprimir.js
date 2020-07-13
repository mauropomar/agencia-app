'use strict'
var express = require('express');
var ClienteController = require('../controllers/imprimircliente');
var ConfirmadosController = require('../controllers/imprimirconfirmados');
var ProgsController = require('../controllers/imprimirprogs');
var VoucherController = require('../controllers/voucher');
var FacturaController = require('../controllers/factura');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.get('/voucher', md_auth.ensureAuth, VoucherController.print);
api.get('/factura', md_auth.ensureAuth, FacturaController.print);
api.post('/imprimirclientes', md_auth.ensureAuth, ClienteController.print);
api.post('/imprimirconfirmados', md_auth.ensureAuth, ConfirmadosController.print);
api.post('/imprimirprogs', md_auth.ensureAuth, ProgsController.print);

module.exports = api;