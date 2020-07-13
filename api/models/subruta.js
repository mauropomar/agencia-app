'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SubRutaSchema = Schema({
    codigo: String,
    nombre: String,
    descripcion: String,
    ruta: {type: Schema.ObjectId, ref: 'Ruta'},
    ciudad_origen: {type: Schema.ObjectId, ref: 'Ciudad'},
    ciudad_destino: {type: Schema.ObjectId, ref: 'Ciudad'}
});

module.exports = mongoose.model('SubRuta', SubRutaSchema );
