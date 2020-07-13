'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var TipoSucursal = require('../models/tiposucursal');

function saveTipoSuc(req, res) {
    var params = req.body;
    if (!params.nombre || !params.pais) {
        return res.status(200).send({message: 'Envia todos los campos necesarios'});
    }
    var tipo = new TipoSucursal();
    tipo.codigo = params.codigo;
    tipo.nombre = params.nombre;
    tipo.descripcion = params.descripcion;
    tipo.pais = params.pais;
    TipoSucursal.findOne({codigo:params.codigo, nombre: params.nombre}, (err, tip) => {
        if (err) return res.status(500).send({message: 'Error de peticion'});
        if (tip) {
            return res.status(200).send({message: 'Ya existe un tipo de sucursal con esos datos.'});
        }
        tipo.save((err, datos) => {
            if (err) return res.status(500).send({message: 'Error al guardar el tipo de sucursal.'});
            if (!datos) return res.status(404).send({message: 'No se ha registrado el tipo de sucursal'});
            return res.status(200).send({
                success: true,
                datos: datos,
                message:'El tipo de suscursal ha sido registrado con éxito.'
            });
        });
    });
}

function updateTipoSuc(req, res) {
    var tipoId = req.params.id;
    var update = req.body;
    TipoSucursal.find({nombre: update.nombre.toLowerCase()}, (err, tips) => {
        var tip_isset = false;
        tips.forEach((t) => {
            if (t && t._id != tipoId)
                tip_isset = true
        });
        if (tip_isset) return res.status(200).send({
            success: false,
            message: 'El tipo de sucursal que intentas actualizar ya existe.'
        });
        TipoSucursal.findByIdAndUpdate(tipoId, update, {new: true}, (err, datosTipo) => {
            if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
            if (!datosTipo) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
            return res.status(200).send({
                sucursal: datosTipo,
                message: 'El tipo de sucursal fue actualizada con éxito',
                success: true
            });
        });
    })
}

function deleteTipoSuc(req, res) {
    var tipoId = req.params.id;
    TipoSucursal.find({'_id': tipoId}).remove((err, tipoIdRwemoved) => {
        if (err) return res.status(500).send({success:false,message: 'Error al borrar este tipo de suscursal.'});
        if (!tipoIdRwemoved) return res.status(404).send({success:false, message: 'No existe este tipo de suscursal.'});
        return res.status(200).send({success: true, message: 'El tipo de suscursal ha sido borrada con éxito.'});
    });
}

function getTipoSuc(req, res){
    var tipoId = req.params.id;
    TipoSucursal.findById(tipoId, (err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'El tipo de suscursal no existe'});
        return res.status(200).send({datos});
    });
}

function getTiposSucursalesPorPais(req, res) {
    var paisId = req.query.paisId;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    TipoSucursal.find({'pais': paisId}).sort('_id').populate('pais', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err)
            return res.status(500).send({success:false, message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({success:false, message: 'El tipo de suscursal no existe'});
        return res.status(200).send({
            datos:datos,
            total: total,
            pages: page
        });
    });
}


function getTiposSucursales(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    TipoSucursal.find().sort('_id').populate('pais', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err)
            return res.status(500).send({success:false, message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({success:false, message: 'El tipo de suscursal no existe'});
        return res.status(200).send({
            datos:datos,
            total: total,
            pages: page
        });
    });
}

module.exports = {
    saveTipoSuc,
    updateTipoSuc,
    deleteTipoSuc,
    getTiposSucursales,
    getTiposSucursalesPorPais,
    getTipoSuc
}
