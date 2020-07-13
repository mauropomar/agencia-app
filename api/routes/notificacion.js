'use strict'

var express = require('express');
var NotificacionController = require('../controllers/notificaciones');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.get('/notificaciones/:id', md_auth.ensureAuth,NotificacionController.getNotificaciones);
module.exports = api;