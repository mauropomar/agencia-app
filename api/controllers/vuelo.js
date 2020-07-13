'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
var Vuelo = require('../models/vuelo');


//metodo que inserta una ruta determninada
function saveVuelo(req, res) {
    var params = req.body;

    var vuelo = new Vuelo();
    vuelo.cliente = params.cliente;
    vuelo.prog = params.prog;
    Vuelo.findOne({cliente: vuelo.cliente}).exec((err, vls) => {
        if (err) return res.status(500).send({success: false, message: 'Error de peticion'});
        if (vls) {
            return res.status(200).send({success: false, message: 'Ya existe una cliente en este pueblo.'});
        }
        vuelo.save((err, datos) => {
            if (err) return res.status(500).send({success: false, message: 'Error al guardar el vuelo.'});
            if (!datos) return res.status(404).send({success: false, message: 'No se ha registrado el cliente a este vuelo.'});
            return res.status(200).send({
                success: true,
                ruta: datos,
                message: 'El cliente fue registrado en el vuelo con éxito'
            });
        });
    });
}

function getClientesByProg(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var progId = req.query.progId;
    Vuelo.find({'prog': progId}).sort('_id').populate('prog').populate('vuelo').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        return res.status(200).send({
            datos: datos,
            total: total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function deleteCliente(req, res) {
    var clienteId = req.params.id;
    Vuelo.find({'cliente': clienteId}).remove((err, clienteRwemoved) => {
        if (err) return res.status(500).send({message: 'Error al borrar el cliente.'});
        if (!clienteRwemoved) return res.status(404).send({message: 'No existe este cliente.'});
        return res.status(200).send({
            success: true,
            message: 'El cliente ha sido borrado de la programación con éxito.'
        });
    });
}

module.exports = {
    saveVuelo,
    getClientesByProg,
    deleteCliente
}
