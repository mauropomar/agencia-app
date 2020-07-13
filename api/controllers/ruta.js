'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
var Ruta = require('../models/ruta');

//metodo que inserta una ruta determninada
function saveRuta(req, res) {
    var params = req.body;
    if (!params.nombre || !params.pais_origen || !params.pais_destino) {
        return res.status(200).send({success: false, message: 'Envia todos los campos necesarios'});
    }
    if (params.pais_origen == params.pais_destino) {
        return res.status(200).send({
            success: false,
            message: 'El país de origen no puede ser igual al país de destino.'
        });
    }
    var ruta = new Ruta();
    ruta.nombre = params.nombre;
    ruta.descripcion = params.descripcion;
    ruta.pais_origen = params.pais_origen;
    ruta.pais_destino = params.pais_destino;
    Ruta.findOne({
        $or: [{nombre: ruta.nombre.toLowerCase()},
            {pais_origen: ruta.pais_origen, pais_destino: ruta.pais_destino},
            {pais_origen: ruta.pais_destino, pais_destino: ruta.pais_origen}]
    }).exec((err, ruts) => {
        if (err) return res.status(500).send({success: false, message: 'Error de peticion'});
        if (ruts) {
            return res.status(200).send({success: false, message: 'Ya existe una ruta con esos datos.'});
        }
        ruta.save((err, datos) => {
            if (err) return res.status(500).send({success: false, message: 'Error al guardar la ruta.'});
            if (!datos) return res.status(404).send({success: false, message: 'No se ha registrado la ruta'});
            return res.status(200).send({
                success: true,
                ruta: datos,
                message: 'La ruta fue registrada con éxito'
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
    var itemsPerPage = 10;
    Ruta.find().sort('_id').populate('pais_origen').populate('pais_destino').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay rutas disponibles.'});
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function getRutasByPais(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var paisId = req.query.paisId;
    var itemsPerPage = 10;
    Ruta.find({
        $or: [{pais_destino: paisId},
            {pais_origen: paisId}]
    }).sort('_id').populate('pais_origen').populate('pais_destino').paginate(page, itemsPerPage, (err, datos, total) => {
            if (err) return res.status(500).send({message: 'Error en la peticion'});
            if (!datos) return res.status(400).send({message: 'No hay rutas disponibles.'});
            return res.status(200).send({
                datos,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });
        })

}

//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updateRuta(req, res) {
    var rutaId = req.params.id;
    var update = req.body;
    if (update.pais_origen == update.pais_destino) {
        return res.status(200).send({
            success: false,
            message: 'El país de origen no puede ser igual al país de destino.'
        });
    }
    Ruta.find({
        $or: [{nombre: update.nombre.toLowerCase()},
            {pais_origen: update.pais_origen, pais_destino: update.pais_destino},
            {pais_origen: update.pais_destino, pais_destino: update.pais_origen}]
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
            if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
            if (!datosRuta) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
            return res.status(200).send({
                ruta: datosRuta,
                message: 'La ruta fue actualizada con éxito.',
                success: true
            });
        });
    })
}

function deleteRuta(req, res) {
    var rutaId = req.params.id;
    Ruta.find({'_id': rutaId}).remove((err, rutaRwemoved) => {
        if (err) return res.status(500).send({message: 'Error al borrar la ruta.'});
        if (!rutaRwemoved) return res.status(404).send({message: 'No existe esta ruta.'});
        return res.status(200).send({
            success: true,
            message: 'La ruta ha sido borrada con éxito.'
        });
    });
}

module.exports = {
    saveRuta,
    getRuta,
    getRutas,
    getRutasByPais,
    updateRuta,
    deleteRuta
}
