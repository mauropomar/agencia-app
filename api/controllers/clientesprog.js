'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Cliente = require('../models/cliente');
var Configuracion = require('../models/configuracion');
var TipoHabitacion = require('../models/tipohabitacion');
var Programacion = require('../models/programacion');


//----------------------------------funciones de espera--------------------------------------------------//
function awaitPrecioPasaje(rutaId) {
    return new Promise(resolve => {
        Configuracion.findOne({"ruta": rutaId}).exec((err, conf) => {
            resolve(conf);
        });
    })
}

function awaitPrecioHab(rutaId, tipoHab) {
    return new Promise(resolve => {
        TipoHabitacion.findOne({"ruta": rutaId, "_id": tipoHab}).exec((err, hab) => {
            resolve(hab);
        });
    })
}

async function asyncClientes(datos) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        cant++;
     /*   var ruta = datos[i]['ruta']._id;
        var tipohab = datos[i]['tipohab'];
        var tipo = await awaitPrecioHab(ruta, tipohab);
        var pasaje = await awaitPrecioPasaje(ruta);
        var importe = tipo.precio + pasaje.precio_pasaje;*/
        var importe = datos[i]['importe'];
        var obj = getObjetoClient(datos[i], importe);
        array.push(obj);
    }
    return {
        cantidad: cant,
        datos: array
    }
};

//--------------------------------------devolver clientes por la programacion----------------------------------//
function getClientesByProg(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var progId = req.query.progId;
    Cliente.find({'prog': progId}).sort('_id').populate('sucursal').populate('subruta').populate('tipohab').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncClientes(datos).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}

//-----------------------------devoilver clientes por la sucursal-----------------------------------------------
function getClientesByProgSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var progId = req.query.progId;
    var sucId = req.query.sucId;
    Cliente.find({
        'prog': progId,
        'sucursal': sucId
    }).sort('_id').populate('sucursal').populate('subruta').populate('tipohab').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncClientes(datos).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });

    });
}

//-----------------------------devoilver clientes por la sucursal-----------------------------------------------
async function asyncClientesTipo(datos, tipoId) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        cant++;
        var ruta = datos[i]['ruta']._id;
        var tipohab = datos[i]['tipohab'];
        var tiposuc = datos[i]['sucursal'].tipo;
        if(tipoId == tiposuc) {
          //  var tipo = await awaitPrecioHab(ruta, tipohab);
         //   var pasaje = await awaitPrecioPasaje(ruta);
        //    var importe = tipo.precio + pasaje.precio_pasaje;
            var importe = datos[i]['importe'];
            var obj = getObjetoClient(datos[i], importe);
            array.push(obj);
        }
    }
    return {
        cantidad: cant,
        datos: array
    }
};
function getClientesByProgTipoSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var tipoId = req.query.tipoId;
    var progId = req.query.progId;
    Cliente.find({
        'prog': progId,
        'paquete':'1'
    }).sort('_id').populate('sucursal').populate('subruta').populate('tipohab').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncClientesTipo(datos, tipoId).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });

    });
}

//-------------------------------------------devolver--------------------------------------------------//
function getObjetoClient(datos, importe) {
    return {
        "_id": datos['id'],
        "nombre": datos['nombre'],
        "apellidos": datos['apellidos'],
        "fecha_nac": datos['fecha_nac'],
        "pais_nac": datos['pais_nac'],
        "ciudad_nac": datos['ciudad_nac'],
        "sucursal": datos['sucursal'],
        "fecha_ida": datos['fecha_ida'],
        "fecha_regreso": datos['fecha_regreso'],
        "fecha_expiracion": datos['fecha_expiracion'],
        "pasaporte": datos['pasaporte'],
        "prog": datos['prog'],
        "ruta": datos['ruta'],
        "subruta": datos['subruta'],
        "confirmado": datos['confirmado'],
        "paquete": datos['paquete'],
        "nopago": datos['nopago'],
        "noabordo": datos['noabordo'],
        "carriying": datos['carriying'],
        "issueing": datos['issueing'],
        "tipohab": datos['tipohab'],
        "titulo": datos['titulo'],
        "importe": importe
    }
}


module.exports = {
    getClientesByProg,
    getClientesByProgSucursal,
    getClientesByProgTipoSucursal
}