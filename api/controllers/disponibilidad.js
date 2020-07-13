'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Disponibilidad = require('../models/disponibilidad');
var TipoSucursal = require('../models/tiposucursal');

//metodo que inserta una ciudad determninada

function awaitSave(prog, data) {
    return new Promise(resolve => {
        var disponibilidad = new Disponibilidad();
        disponibilidad.prog = prog;
        disponibilidad.tiposucursal = data['tiposucursal'];
        disponibilidad.valor = data['valor'];
        disponibilidad.save((err, datos) => {
            if (err) return res.status(500).send({success: false, message: 'Error al guardar la disponibilidad.'});
            if (!datos) return res.status(404).send({success: false, message: 'No se ha registrado la disponibilidad'});
            resolve(datos);
        });
    })
}

async function asyncSave(prog, datos) {
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        var d = await awaitSave(prog, datos[i]);
        cant++;
    }
    return {
        succees: true,
        cant: cant
    }
}

function saveDisponibilidad(req, res) {
    var prog = req.params.prog;
    var datos = req.body.datos;
    Disponibilidad.find({'prog': prog}).remove((err, dispRemoved) => {
        if (err) return res.status(500).send({message: 'Error al borrar el cliente.'});
        if (!dispRemoved) return res.status(404).send({message: 'No existe este cliente.'});
        for (var i = 0; i < datos.length; i++) {
            var disponibilidad = new Disponibilidad();
            disponibilidad.prog = prog;
            disponibilidad.tiposucursal = datos[i]['idtipo'];
            disponibilidad.valor = datos[i]['valor'];
            disponibilidad.save((err, datos) => {
            });
        }
    });
    return res.status(200).send({
        success: true,
        message: 'La distribución fue registrado con éxito'
    });
}

//------------------------------------------devolver disponibilidades-------------------------------------//
function awaitTiposSucursales(paisId) {
    return new Promise(resolve => {
        TipoSucursal.find({pais: paisId}).paginate(1, 15, (err, datos, total) => {
            resolve(datos);
        })
    });
}

function awaitgetDisponilidades(tipoId, progId) {
    return new Promise(resolve => {
        Disponibilidad.find({tiposucursal: tipoId, prog: progId}).paginate(1, 15, (err, datos, total) => {
            resolve(datos);
        })
    });
}

async function asyncDisponibilidad(paisId, progId) {
    var tipos = await awaitTiposSucursales(paisId);

    var array = [];
    for (var j = 0; j < tipos.length; j++) {
        var tipoId = tipos[j]._id;
        var disp = await awaitgetDisponilidades(tipoId, progId);
        var length = disp.length;
        var id_disp = (length > 0) ? disp[0]._id : null;
        var valor = (length > 0) ? disp[0].valor : null;
        var prog = progId;
        array.push({
            id: id_disp,
            idtipo: tipos[j]._id,
            prog: prog,
            nombre: tipos[j].nombre,
            valor: valor
        });
    }
    return {
        success: true,
        datos: array
    }
}

function getDisponibilidad(req, res) {
    var progId = req.query.progId;
    var paisId = req.query.paisId;
    asyncDisponibilidad(paisId, progId).then((value) => {
        return res.status(200).send({
            success: true,
            datos: value.datos
        });
    });
}

module.exports = {
    getDisponibilidad,
    saveDisponibilidad
}