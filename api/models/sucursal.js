'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SucursalSchema = Schema({
    codigo: String,
    nombre: String,
    ruta: {type: Schema.ObjectId, ref: 'Ruta'},
    pais: {type: Schema.ObjectId, ref: 'Pais'},
    tipo: {type: Schema.ObjectId, ref: 'TipoSucursal'},
    ciudad: {type: Schema.ObjectId, ref: 'Ciudad'},
    imagen: String
});

module.exports = mongoose.model('Sucursal', SucursalSchema);
