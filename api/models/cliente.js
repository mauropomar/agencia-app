'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClienteSchema = Schema({
    nombre: String,
    apellidos: String,
    pasaporte: String,
    fecha_nac: Date,
    pais_nac: String,
    ciudad_nac: String,
    sucursal: {type: Schema.ObjectId, ref: 'Sucursal'},
    usuario: {type: Schema.ObjectId, ref: 'Usuario'},
    ruta: {type: Schema.ObjectId, ref: 'Ruta'},
    subruta: {type: Schema.ObjectId, ref: 'SubRuta'},
    prog: {type: Schema.ObjectId, ref: 'Programacion'},
    carriying: String,
    issueing:String,
    confirmado:Boolean,
    nopago:Boolean,
    noabordo:Boolean,
    fecha_ida: Date,
    fecha_regreso: Date,
    fecha_expiracion: Date,
    fecha:Date,
    telefono: String,
    email: String,
    paquete: String,
    titulo: String,
    tipohab:  {type: Schema.ObjectId, ref: 'TipoHabitacion'},
    importe: Number,
    imagen: String,
    created_at: String
});

module.exports = mongoose.model('Cliente', ClienteSchema);
