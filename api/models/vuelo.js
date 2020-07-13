'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VueloSchema = Schema({
    cliente:  {type: Schema.ObjectId, ref: 'Cliente'},
    prog: {type: Schema.ObjectId, ref: 'Programacion'}
});

module.exports = mongoose.model('Vuelo', VueloSchema);
