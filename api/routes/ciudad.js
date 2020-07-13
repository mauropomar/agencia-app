'use strict'

var express = require('express');
var CiudadController = require('../controllers/ciudad');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-ciudad', md_auth.ensureAuth, CiudadController.saveCiudad);
api.get('/ciudad/:id', md_auth.ensureAuth, CiudadController.getCiudad);
api.get('/ciudades/:page?', md_auth.ensureAuth, CiudadController.getCiudades);
api.delete('/delete-ciudad/:id', md_auth.ensureAuth, CiudadController.deleteCiudad);
api.put('/update-ciudad/:id', md_auth.ensureAuth, CiudadController.updateCiudad);
module.exports = api;
