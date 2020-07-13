'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GeneralSchema = Schema({
    recibo_factura:Number
});

module.exports = mongoose.model('General', GeneralSchema);