'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProgSchema = Schema({
    codigo: String,
    aerolinea: String,
    aeronave: String,
    fecha_salida: Date,
    fecha_entrada: Date,
    asientos: Number,
    disponibilidad: Number,
    pais: {type: Schema.ObjectId, ref: 'Pais'},
    ruta: {type: Schema.ObjectId, ref: 'Ruta'},
    subruta: {type: Schema.ObjectId, ref: 'SubRuta'}
});

module.exports = mongoose.model('Programacion', ProgSchema);
