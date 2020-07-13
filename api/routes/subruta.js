'use strict'

var express = require('express');
var SubRutaController = require('../controllers/subruta');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-subruta', md_auth.ensureAuth,SubRutaController.saveRuta);
api.put('/update-subruta/:id', md_auth.ensureAuth,SubRutaController.updateRutas);
api.get('/subruta/:id', md_auth.ensureAuth, SubRutaController.getRuta);
api.get('/subrutas/:page?', md_auth.ensureAuth, SubRutaController.getRutas);
api.delete('/subruta/:id',md_auth.ensureAuth, SubRutaController.deleteRuta);
api.delete('/delete-subruta/:id',md_auth.ensureAuth, SubRutaController.deleteRuta);
module.exports = api;
