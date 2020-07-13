'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TipoSucursalSchema = Schema({
    codigo: String,
    nombre: String,
    descripcion:String,
    pais: {type: Schema.ObjectId, ref: 'Pais'}
});

module.exports = mongoose.model('TipoSucursal', TipoSucursalSchema);