'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CiudadSchema = Schema({
    nombre: String,
    pais: {type: Schema.ObjectId, ref: 'Pais'}
});

module.exports = mongoose.model('Ciudad', CiudadSchema);
