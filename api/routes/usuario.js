'use strict'

var express = require('express');
var UserController = require('../controllers/usuario');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/usuarios'});


var api = express.Router();
var md_auth = require('../middlewares/authenticated');
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/users-sucs/:page?', md_auth.ensureAuth, UserController.getUsersBySucursal);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.put('/update-perfil/:id', md_auth.ensureAuth, UserController.updatePerfil);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/search-user',UserController.searchUsuario);
api.get('/get-image-user/:imageFile',  UserController.getImageFile);
api.delete('/delete-user/:id', md_auth.ensureAuth, UserController.deleteUsuario);

module.exports = api;
