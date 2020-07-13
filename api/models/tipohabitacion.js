'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TipoHabitacionSchema = Schema({
    nombre: String,
    ruta: {type: Schema.ObjectId, ref: 'Ruta'},
    precio: Number
});

module.exports = mongoose.model('TipoHabitacion', TipoHabitacionSchema);
