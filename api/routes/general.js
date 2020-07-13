'use strict'

var express = require('express');
var GeneralController = require('../controllers/general');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-general', GeneralController.saveGeneral);
api.get('/general', md_auth.ensureAuth, GeneralController.getInfo);
module.exports = api;