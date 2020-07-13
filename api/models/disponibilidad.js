'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DispSchema = Schema({
    prog:{type: Schema.ObjectId, ref: 'Programacion'},
    tiposucursal:{type: Schema.ObjectId, ref: 'TipoSucursal'},
    valor:Number,
});

module.exports = mongoose.model('Disponibilidad', DispSchema);