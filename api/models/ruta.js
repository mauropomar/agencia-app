'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RutaSchema = Schema({
    nombre: String,
    descripcion: String,
    pais_origen: {type: Schema.ObjectId, ref: 'Pais'},
    pais_destino: {type: Schema.ObjectId, ref: 'Pais'}
});

module.exports = mongoose.model('Ruta', RutaSchema);
