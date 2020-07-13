'use strict'

var express = require('express');
var TipoSucursalController = require('../controllers/tiposucursal');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-tiposuc', md_auth.ensureAuth,TipoSucursalController.saveTipoSuc);
api.put('/update-tiposuc/:id', md_auth.ensureAuth,TipoSucursalController.updateTipoSuc);
api.delete('/delete-tiposuc/:id',md_auth.ensureAuth,TipoSucursalController.deleteTipoSuc);
api.get('/tiposuc/:id', md_auth.ensureAuth, TipoSucursalController.getTipoSuc);
api.get('/tiposucursales/:page?', md_auth.ensureAuth, TipoSucursalController.getTiposSucursalesPorPais);
api.get('/tiposucursales-todos/:page?', md_auth.ensureAuth, TipoSucursalController.getTiposSucursales);
module.exports = api;