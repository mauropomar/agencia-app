'use strict'

var express = require('express');
var TipoHabitacionController = require('../controllers/tipohabitacion');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-tipohab', md_auth.ensureAuth,TipoHabitacionController.saveTipoHab);
api.put('/update-tipohab/:id', md_auth.ensureAuth,TipoHabitacionController.updateTipoHab);
api.delete('/delete-tipohab/:id',md_auth.ensureAuth, TipoHabitacionController.deleteTipoHab);
api.get('/tipohabitacion/:id', md_auth.ensureAuth, TipoHabitacionController.getTipoHab);
api.get('/tiposhabitaciones/:page?', md_auth.ensureAuth, TipoHabitacionController.getTiposHabitaciones);
module.exports = api;
