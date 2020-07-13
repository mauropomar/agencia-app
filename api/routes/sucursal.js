'use strict'

var express = require('express');
var SucursalController = require('../controllers/sucursal');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();
var md_upload = multipart({uploadDir: './uploads/sucursales'});

api.post('/save-sucursal',SucursalController.saveSucursal);
api.put('/update-sucursal/:id', md_auth.ensureAuth,SucursalController.updateSucursal);
api.get('/sucursal/:id', md_auth.ensureAuth, SucursalController.getSucursal);
api.get('/sucursales/:page?', md_auth.ensureAuth, SucursalController.getSucursals);
api.get('/sucursales-ruta', md_auth.ensureAuth, SucursalController.getSucursalsByRuta);
api.get('/sucursales-pais', md_auth.ensureAuth, SucursalController.getSucursalsByPais);
api.get('/sucursales-tipo', md_auth.ensureAuth, SucursalController.getSucursalsByTipo);
api.get('/sucursales-user/:page?', md_auth.ensureAuth, SucursalController.getSucursalsByUser);
api.post('/upload-image-sucursal/:id', [md_auth.ensureAuth, md_upload], SucursalController.uploadImage);
api.get('/get-image-sucursal/:imageFile',  SucursalController.getImageFile);
api.delete('/delete-sucursal/:id',md_auth.ensureAuth, SucursalController.deleteSucursal);
module.exports = api;
