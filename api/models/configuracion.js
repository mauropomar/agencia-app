'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConfiguracionSchema = Schema({
    precio_pasaje: Number,
    ruta: {type: Schema.ObjectId, ref: 'Ruta'},
    recibo_factura:Number
});

module.exports = mongoose.model('Configuracion', ConfiguracionSchema);
