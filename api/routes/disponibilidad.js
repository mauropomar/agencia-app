'use strict'

var express = require('express');
var Controller = require('../controllers/disponibilidad');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.get('/disponibilidades/:page?', md_auth.ensureAuth, Controller.getDisponibilidad);
api.post('/save-disponibilidad/:prog', md_auth.ensureAuth, Controller.saveDisponibilidad);
module.exports = api;