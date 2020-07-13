'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RolesSchema = Schema({
    nombre: String,
    descripcion: String
});

module.exports = mongoose.model('Rol', RolesSchema);