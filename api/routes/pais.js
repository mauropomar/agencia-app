'use strict'

var express = require('express');
var PaisController = require('../controllers/pais');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var md_upload = multipart({uploadDir: './uploads/paises'});
var api = express.Router();

api.post('/save-pais',PaisController.savePais);
api.get('/pais/:id', md_auth.ensureAuth, PaisController.getPais);
api.get('/paises/:page?', md_auth.ensureAuth, PaisController.getPaises);
api.put('/update-pais/:id', md_auth.ensureAuth, PaisController.updatePais);
api.get('/get-image-pais/:imageFile',  PaisController.getImageFile);
api.post('/upload-image-pais/:id', [md_auth.ensureAuth, md_upload], PaisController.uploadImage);
api.delete('/delete-pais/:id',md_auth.ensureAuth, PaisController.deletePais);

module.exports = api;
