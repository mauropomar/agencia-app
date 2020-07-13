'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UsuarioSchema = Schema({
    nombre: String,
    apellidos: String,
    cuenta: String,
    email: String,
    password: String,
    rol: {type: Schema.ObjectId, ref: 'Rol'},
    ruta: {type: Schema.ObjectId, ref: 'Ruta'},
    sucursal: {type: Schema.ObjectId, ref: 'Sucursal'},
    imagen: String
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
