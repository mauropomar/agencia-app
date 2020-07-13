'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Ciudad = require('../models/ciudad');
var Ruta = require('../models/subruta');

//metodo que inserta una ciudad determninada
function saveCiudad(req, res) {
    var params = req.body;
    if (!params.nombre) {
        return res.status(200).send({message: 'Envia todos los campos necesarios'});
    }
    var ciudad = new Ciudad();
    ciudad.nombre = params.nombre;
    ciudad.pais = params.pais;
    Ciudad.findOne({pais: params.pais, nombre: params.nombre}, (err, prov) => {
        if (err) return res.status(500).send({message: 'Error de peticion'});
        if (prov) {
            return res.status(200).send({
                success: false,
                message: 'Ya existe una ciudad con ese nombre.'
            });
        }
        ciudad.save((err, datos) => {
            if (err) return res.status(500).send({message: 'Error al guardar la ciudad.'});
            if (!datos) return res.status(404).send({message: 'No se ha registrado la ciudad'});
            return res.status(200).send({
                datos: datos,
                success: true,
                message: 'La ciudad fue registrada con éxito.'
            });
        });
    });
}

//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updateCiudad(req, res) {
    var ciudadId = req.params.id;
    var update = req.body;
    Ciudad.find({nombre: update.nombre.toLowerCase()}, (err, ciudad) => {
        var ciudad_isset = false;
        ciudad.forEach((p) => {
            if (p && p._id != ciudadId)
                ciudad_isset = true
        });
        if (ciudad_isset) return res.status(200).send({
            success: false,
            message: 'La ciudad que intentas actualizar ya existe.'
        });
        Ciudad.findByIdAndUpdate(ciudadId, update, {new: true}, (err, datos) => {
            if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
            if (!datos) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
            return res.status(200).send({
                pais: datos,
                message: 'La ciudad fue actualizada con éxito',
                success: true
            });
        });
    })
}

//metodo que devuelve una ciudad determninada
function getCiudad(req, res) {
    var ciudadId = req.params.id;
    Ciudad.findById(ciudadId, (err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La ciudad no existe'});
        return res.status(200).send({datos});
    });
}

//metodo que devuelve una ciudad determninada
function getCiudades(req, res) {
    var paisId = req.query.paisId;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Ciudad.find({'pais': paisId}).sort('_id').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay ciudads disponibles.'});
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function deleteCiudad(req, res) {
    var ciudadId = req.params.id;
    Ruta.find({ciudad_destino:ciudadId}).exec((err, datos) => {
        console.log(datos)
        if (datos.length > 0) {
            return res.status(200).send({
                success: false,
                message: 'Imposible eliminar el país seleccionado, tiene rutas asociadas.'
            });
        }
        Ciudad.find({'_id': ciudadId}).remove((err, ciudadRwemoved) => {
            if (err) return res.status(500).send({message: 'Error al borrar la ciudad.'});
            if (!ciudadRwemoved) return res.status(404).send({message: 'No existe esta ciudad.'});
            return res.status(200).send({
                success: true,
                message: 'La ciudad fue eliminada correctamente.'
            });
        });
    });
}

module.exports = {
    saveCiudad,
    getCiudad,
    getCiudades,
    deleteCiudad,
    updateCiudad
}
