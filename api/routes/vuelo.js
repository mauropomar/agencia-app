'use strict'

var express = require('express');
var VueloController = require('../controllers/vuelo');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-vuelo', md_auth.ensureAuth,VueloController.saveVuelo);
api.get('/vuelos/:page?', md_auth.ensureAuth, VueloController.getClientesByProg);
api.delete('/vuelo/:id',md_auth.ensureAuth, VueloController.deleteCliente);
module.exports = api;
