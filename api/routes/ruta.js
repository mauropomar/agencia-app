'use strict'

var express = require('express');
var RutaController = require('../controllers/ruta');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-ruta', md_auth.ensureAuth,RutaController.saveRuta);
api.put('/update-ruta/:id', md_auth.ensureAuth,RutaController.updateRuta);
api.get('/ruta/:id', md_auth.ensureAuth, RutaController.getRuta);
api.get('/rutas/:page?', md_auth.ensureAuth, RutaController.getRutas);
api.get('/rutas-pais/:page?', md_auth.ensureAuth, RutaController.getRutasByPais);
api.delete('/ruta/:id',md_auth.ensureAuth, RutaController.deleteRuta);
api.delete('/delete-ruta/:id',md_auth.ensureAuth, RutaController.deleteRuta);
module.exports = api;
