'use strict'

var express = require('express');
var ProgController = require('../controllers/programacion');
var multipart = require('connect-multiparty');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/save-prog', md_auth.ensureAuth,ProgController.saveProg);
api.get('/filter-prog', md_auth.ensureAuth,ProgController.filterProg);
api.put('/update-prog/:id', md_auth.ensureAuth, ProgController.updateProg);
api.get('/prog/:id', md_auth.ensureAuth, ProgController.getProg);
api.get('/progs', md_auth.ensureAuth, ProgController.getAllProgs);
api.get('/progs-ruta/:page', md_auth.ensureAuth, ProgController.getProgsByRuta);
api.get('/progsall-ruta/:page', md_auth.ensureAuth, ProgController.getAllProgsByRuta);
api.get('/progs-subruta', md_auth.ensureAuth, ProgController.getProgsBySubRuta);
api.delete('/delete-prog/:id',md_auth.ensureAuth, ProgController.deleteProg);

module.exports = api;
