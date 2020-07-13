'use strict'

var express = require('express');
var ProgController = require('../controllers/importarprog');
var ClienteController = require('../controllers/importarcliente');
var md_auth = require('../middlewares/authenticated');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/importar'});
var api = express.Router();

api.post('/import-excel-prog', [md_auth.ensureAuth, md_upload], ProgController.importProg);
api.post('/import-excel-cliente',  md_upload, ClienteController.importCliente);
module.exports = api;