'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaisSchema = Schema({
    codigo: String,
    nombre: String,
    imagen: String
});

module.exports = mongoose.model('Pais', PaisSchema);