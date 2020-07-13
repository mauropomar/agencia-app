'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var TipoHabitacion = require('../models/tipohabitacion');

function saveTipoHab(req, res) {
    var params = req.body;
    if (!params.nombre || !params.precio) {
        return res.status(200).send({message: 'Envia todos los campos necesarios'});
    }
    var tipo = new TipoHabitacion();
    tipo.nombre = params.nombre;
    tipo.ruta = params.ruta;
    tipo.precio = params.precio;
    TipoHabitacion.findOne({ruta: params.ruta, nombre: params.nombre}, (err, tip) => {
        if (err) return res.status(500).send({message: 'Error de peticion'});
        if (tip) {
            return res.status(200).send({message: 'Ya existe un tipo de habitación con ese nombre.'});
        }
        tipo.save((err, datos) => {
            if (err) return res.status(500).send({message: 'Error al guardar el tipo de habitación.'});
            if (!datos) return res.status(404).send({message: 'No se ha registrado el tipo de habitación'});
            return res.status(200).send({
                success: true,
                datos: datos,
                message:'El  hospedaje ha sido registrado con éxito.'
            });
        });
    });
}

function updateTipoHab(req, res) {
        var tipoId = req.params.id;
        var update = req.body;
        TipoHabitacion.find({nombre: update.nombre.toLowerCase()}, (err, tips) => {
            var tip_isset = false;
            tips.forEach((t) => {
                if (t && t._id != tipoId)
                    tip_isset = true
            });
            if (tip_isset) return res.status(200).send({
                success: false,
                message: 'El hospedaje que intentas actualizar ya existe.'
            });
            TipoHabitacion.findByIdAndUpdate(tipoId, update, {new: true}, (err, datosTipo) => {
                if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
                if (!datosTipo) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
                return res.status(200).send({
                    sucursal: datosTipo,
                    message: 'El hospedaje fue actualizada con éxito',
                    success: true
                });
            });
        })
}

function deleteTipoHab(req, res) {
    var tipoId = req.params.id;
    TipoHabitacion.find({'_id': tipoId}).remove((err, tipoIdRwemoved) => {
        if (err) return res.status(500).send({success:false,message: 'Error al borrar este hospedaje.'});
        if (!tipoIdRwemoved) return res.status(404).send({success:false, message: 'No existe este hospedaje.'});
        return res.status(200).send({success: true, message: 'El hospedaje ha sido borrada con éxito.'});
    });
}

function getTipoHab(req, res){
    var tipoId = req.params.id;
    TipoHabitacion.findById(tipoId, (err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'El hospedaje no existe'});
        return res.status(200).send({datos});
    });
}

function getTiposHabitaciones(req, res) {
    var rutaId = req.query.rutaId;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    TipoHabitacion.find({'ruta': rutaId}).sort('_id').populate('ruta', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err)
            return res.status(500).send({success:false, message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({success:false, message: 'El hospedaje no existe'});
        return res.status(200).send({
            datos,
            total: 1,
            pages: 1
        });
    });
}

module.exports = {
    saveTipoHab,
    updateTipoHab,
    deleteTipoHab,
    getTiposHabitaciones,
    getTipoHab
}
