'use strict'

var express = require('express');
var ConfiguracionController = require('../controllers/configuracion');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-conf', md_auth.ensureAuth, ConfiguracionController.saveConf);
api.put('/update-conf/:id', md_auth.ensureAuth, ConfiguracionController.updateConf);
api.get('/configuracion/:ruta', md_auth.ensureAuth, ConfiguracionController.getConfiguracion);
api.post('/configuracion-deleteAll',md_auth.ensureAuth, ConfiguracionController.deleteAll);
module.exports = api;
