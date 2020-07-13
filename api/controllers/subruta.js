'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Ruta = require('../models/subruta');

//metodo que inserta una ruta determninada
function saveRuta(req, res) {
    var params = req.body;
    if (!params.nombre || !params.ciudad_origen || !params.ciudad_destino) {
        res.status(200).send({message: 'Envia todos los campos necesarios'});
    }
    var ruta = new Ruta();
    ruta.codigo = params.codigo;
    ruta.nombre = params.nombre;
    ruta.descripcion = params.descripcion;
    ruta.ciudad_origen = params.ciudad_origen;
    ruta.ciudad_destino = params.ciudad_destino;
    ruta.ruta = params.ruta;
    Ruta.findOne({
        $or: [{codigo: ruta.codigo.toLowerCase()},{nombre: ruta.nombre.toLowerCase()},
            {ciudad_origen: ruta.ciudad_origen, ciudad_destino: ruta.ciudad_destino},
            {ciudad_origen: ruta.ciudad_destino, ciudad_destino: ruta.ciudad_origen}]
    }).exec((err, rut) => {
        if (err) return res.status(500).send({success: false, message: 'Error de peticion'});
        if (rut) {
            return res.status(200).send({success: false, message: 'Ya existe una ruta con esos datos.'});
        }
        ruta.save((err, datos) => {
            if (err) return res.status(500).send({success: false, message: 'Error al guardar la ruta.'});
            if (!datos) return res.status(404).send({success: false, message: 'No se ha registrado la ruta'});
            return res.status(200).send({
                success: true,
                message: 'La sub-ruta fue registrada con éxito',
                ruta: datos
            });
        });
    });
}


//metodo que devuelve un pais determninado
//----------------------------------------Pais---------------------------------------//
function getRuta(req, res) {
    var rutaId = req.params.id;
    Ruta.findById(rutaId, (err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La ruta no existe'});
        return res.status(200).send({datos});
    });
}

//-----------------------------------Users-------------------------------------------------//
//metodo que devuelve un listado de usuarios paginados
function getRutas(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var rutaId = req.query.padreId;
    var itemsPerPage = 5;
    Ruta.find({'ruta': rutaId}).sort('_id').populate('ciudad_origen').populate('ciudad_destino').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay rutas disponibles.'});
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updateRutas(req, res) {
    var rutaId = req.params.id;
    var update = req.body;
    if (!update.ciudad_origen || !update.ciudad_destino) {
        res.status(200).send({success:false, message: 'Envia todos los campos necesarios'});
    }
    Ruta.find({
        $or: [{codigo: update.codigo.toLowerCase()},{nombre: update.nombre.toLowerCase()},
            {ciudad_origen: update.ciudad_origen, ciudad_destino: update.ciudad_destino},
            {ciudad_origen: update.ciudad_destino, ciudad_destino: update.ciudad_origen}]
    }).exec((err, rutas) => {
        var rut_isset = false;
        rutas.forEach((rut) => {
            if (rut && rut._id != rutaId)
                rut_isset = true
        });
        if (rut_isset) {
            return res.status(200).send({
                success: false,
                message: 'La ruta que intentas actualizar ya existe.'
            });
        }
        Ruta.findByIdAndUpdate(rutaId, update, {new: true}, (err, datosRuta) => {
            if (err) return res.status(500).send({message: 'Error en la peticion.'});
            if (!datosRuta) return res.status(404).send({message: 'No se ha podido actualizar.'});
            return res.status(200).send({
                success:true,
                message: 'La ruta fue actualizada con éxito.',
                datos: datosRuta
            });
        })
    })
}

function deleteRuta(req, res) {
    var rutaId = req.params.id;
    Ruta.find({'_id': rutaId}).remove((err, rutaRwemoved) => {
        if (err) return res.status(500).send({message: 'Error al borrar la ruta.'});
        if (!rutaRwemoved) return res.status(404).send({message: 'No existe esta ruta.'});
        return res.status(200).send({
            success:true,
            message: 'La ruta ha sido borrada con éxito.'
        });
    });
}

module.exports = {
    saveRuta,
    getRuta,
    getRutas,
    updateRutas,
    deleteRuta
}
