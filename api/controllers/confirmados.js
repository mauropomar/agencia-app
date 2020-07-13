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


function confirmarCliente(req, res) {
    var clienteId = req.params.id;
    Cliente.findByIdAndUpdate(clienteId, {confirmado: true}, (err, datosCliente) => {
        if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
        if (!datosCliente) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
        return res.status(200).send({
            ruta: datosCliente,
            message: 'El pasaporte del  cliente fue confirmado con éxito.',
            success: true
        });
    });
}


function noPagoCliente(req, res) {
    var clienteId = req.params.id;
    var nopago = req.body.nopago;
    Cliente.findByIdAndUpdate(clienteId, {nopago: nopago}, (err, datosCliente) => {
        if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
        if (!datosCliente) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
        var message = (!nopago) ? 'El cliente pago su viaje de regreso.' : 'El cliente no ha pagado el viaje de regreso.'
        return res.status(200).send({
            ruta: datosCliente,
            message: message,
            success: true
        });
    });
}

function noAbordoCliente(req, res) {
    var clienteId = req.params.id;
    var noabordo = req.body.noabordo;
    Cliente.findByIdAndUpdate(clienteId, {noabordo: noabordo}, (err, datosCliente) => {
        if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
        if (!datosCliente) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
        var message = (!noabordo) ? 'El cliente abordo el viaje de regreso.' : 'El cliente no ha abordado el avión.'
        return res.status(200).send({
            ruta: datosCliente,
            message: message,
            success: true
        });
    });
}


//------------------filtro para todos los clientes que no tengan la visa aprobado----------------------//
function filterConfirmados(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var query = req.query;
    var queryCode = getQueryCond(query);
    Cliente.find(queryCode).sort('sucursal').sort('fecha_ida').populate('sucursal').populate('subruta').populate('prog').populate('ruta').exec((err, datos) => {
        if (err) return res.status(500).send({succss: false, message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        if (query.tiposucursal) {
            datos = filtrarPorTipoSucursal(datos, query.tiposucursal);
        }
        return res.status(200).send({
            datos: datos,
            success: true
        });
    });
}

//------------------------------------filtrar confirmados por sucursal--------------------------------//
function filterConfirmadosTipoSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var query = req.query;
    var tiposucursal = query.tiposucursal_user;
    var queryCode = getQueryCond(query);
    queryCode.paquete = '1';
    Cliente.find(queryCode).sort('sucursal').sort('fecha_ida').populate('sucursal').populate('subruta').populate('prog').populate('ruta').exec((err, datos) => {
        if (err) return res.status(500).send({succss: false, message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        var array = [];
        for (var i = 0; i < datos.length; i++) {
            if (tiposucursal == datos[i].sucursal.tipo)
                array.push(datos[i]);
        }
        datos = array;
        return res.status(200).send({
            datos: datos,
            success: true
        });
    });
}

//------------------------------------filtrar confirmados por sucursal--------------------------------//
function filterConfirmadosSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var query = req.query;
    var queryCode = getQueryCond(query);
    queryCode.sucursal = req.query.sucursal_user;
    Cliente.find(queryCode).sort('sucursal').sort('fecha_ida').populate('sucursal').populate('subruta').populate('prog').populate('ruta').exec((err, datos) => {
        if (err) return res.status(500).send({succss: false, message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        return res.status(200).send({
            datos: datos,
            success: true
        });
    });
}

//-----------------------------------devolver clientes confirmados--------------------------------//
async function asyncConfirm(datos, paisId) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        var sucursal = datos[i]['sucursal'];
        if (sucursal != null) {
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
    }
    return {
        cantidad: cant,
        datos: array
    }
};

function getClienteConfirmados(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var paisId = req.query.paisId;
    var query2 = {pais: paisId};
    var itemsPerPage = 30;
    var fechaActual = new Date(new Date().setHours(23, 59, 59));
    Cliente.find({confirmado: true, fecha_regreso: {$gte: fechaActual}},
    ).sort('sucursal').sort('fecha_ida').populate('sucursal', null, query2).populate('ruta').populate('subruta').populate('prog').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncConfirm(datos).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}

//-----------------------------------devolver clientes confirmados sucursal--------------------------------//
async function asyncConfirmSucursal(datos) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        var sucursal = datos[i]['sucursal'];
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

function getConfirmadosSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var sucId = req.query.sucId;
    var itemsPerPage = 15;
    var fechaActual = new Date(new Date().setHours(23, 59, 59));
    Cliente.find({
        confirmado: true,
        sucursal: sucId,
        fecha_regreso: {$gte: fechaActual}
    }).sort('fecha_ida').populate('sucursal').populate('ruta').populate('subruta').populate('prog').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncConfirmSucursal(datos).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}

//-----------------------------------------confirmados por tipo de susursal-------------------------------------//
async function asyncConfirmTipo(datos) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        var sucursal = datos[i]['sucursal'];
        if (sucursal != null) {
            cant++;
            /*  var ruta = datos[i]['ruta']._id;
              var tipohab = datos[i]['tipohab'];
              var tipo = await awaitPrecioHab(ruta, tipohab);
              var pasaje = await awaitPrecioPasaje(ruta);
              var importe = tipo.precio + pasaje.precio_pasaje;*/
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

function getConfirmadosTipo(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var tipoId = req.query.tipoId;
    var itemsPerPage = 30;
    var query3 = {tipo: tipoId};
    var fechaActual = new Date(new Date().setHours(23, 59, 59));
    Cliente.find({
        confirmado: true,
        paquete: 1,
        fecha_regreso: {$gte: fechaActual}
    }).sort('sucursal').sort('fecha_ida').populate('sucursal', null, query3).populate('ruta').populate('subruta').populate('prog').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncConfirmTipo(datos).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}

//-------------------------------------confirmar todos------------------------------------------------//
function confirmarTodos(req, res) {
    var update = req.body;
    var rutaId = update.rutaId;
    var fechaActual = update.fecha;
    Cliente.find({ruta: rutaId}).exec((err, datos) => {
            for (var i = 0; i < datos.length; i++) {
                var clienteId = datos[i]['_id'];
                var fecha = convertFecha(datos[i]['fecha']);
                fechaActual = convertFecha(fechaActual);
                if (fecha == fechaActual) {
                    Cliente.findByIdAndUpdate(clienteId, {confirmado: true}, (err, datosCliente) => {
                    });
                }
            }
            return res.status(200).send({
                success: true,
                message: 'Los clientes fueron confirmados con éxito'
            });
        }
    )
}

function filtrarPorTipoSucursal(datos, tiposucursal) {
    var array = [];
    for (var i = 0; i < datos.length; i++) {
        if (datos[i]['sucursal'].tipo == tiposucursal) {
            array.push(datos[i]);
        }
    }
    return array;
}


function getQueryCond(query) {
    var queryCond = {};
    if (query.paquete) {
        queryCond.paquete = query.paquete
    }
    if (query.nombre) {
        queryCond.nombre = {$regex: query.nombre, $options: "i"}
    }
    if (query.pasaporte) {
        queryCond.pasaporte = {$regex: query.pasaporte, $options: "i"}
    }
    if (query.prog) {
        queryCond.prog = query.prog
    }
    if (query.ruta) {
        queryCond.ruta = query.ruta
    }
    if (query.subruta) {
        queryCond.subruta = query.subruta
    }
    if (query.sucursal) {
        queryCond.sucursal = query.sucursal
    }
    if (query.pagonoconfirmado) {
        queryCond.nopago = query.pagonoconfirmado
    }
    if (query.vuelonoabordado) {
        queryCond.noabordo = query.vuelonoabordado
    }
    if (query.pais_nac) {
        queryCond.pais_nac = {$regex: query.pais_nac, $options: "i"}
    }
    if (query.telefono) {
        queryCond.telefono = {$regex: query.telefono, $options: "i"}
    }
    if (query.email) {
        queryCond.email = {$regex: query.email, $options: "i"}
    }
    if (query.issueing) {
        queryCond.issueing = {$regex: query.issueing, $options: "i"}
    }
    if (query.fechacreated) {
        var fechaini = new Date(new Date(query.fechacreated).setHours(0, 0, 0));
        var fechafin = new Date(new Date(query.fechacreated).setHours(23, 59, 59));
        queryCond.fecha = {$gte: fechaini, $lt: fechafin};
    }
    if (query.fechaexp) {
        var fechaini = new Date(new Date(query.fechaexp).setHours(0, 0, 0));
        var fechafin = new Date(new Date(query.fechaexp).setHours(23, 59, 59));
        queryCond.fecha_expiracion = {$gte: fechaini, $lt: fechafin};
    }
    var fechaida;
    var fecharegreso;
    var fechaactual = new Date(new Date().setHours(23, 59, 59));
    if (query.fechaida) {
        fechaida = new Date(new Date(query.fechaida).setHours(0, 0, 0));
        queryCond.fecha_ida = {$gte: fechaida}
    }
    if (query.fecharegreso) {
        fecharegreso = new Date(new Date(query.fecharegreso).setHours(23, 59, 59));
        queryCond.fecha_regreso = {$lt: fecharegreso}
    } else {
        queryCond.fecha_regreso = {$gte: fechaactual}
    }
    queryCond.confirmado = true;
    //  queryCond.paquete = 1;
    return queryCond;
}

function convertFecha(fecha) {
    var fecha = new Date(fecha);
    var year = fecha.getFullYear();
    var month = fecha.getMonth() + 1;
    var day = fecha.getDate();
    return year + '-' + month + '-' + day;
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
        "nopago": datos['nopago'],
        "noabordo": datos['noabordo'],
        "carriying": datos['carriying'],
        "paquete": datos['paquete'],
        "issueing": datos['issueing'],
        "importe": importe
    }
}


module.exports = {
    filterConfirmados,
    filterConfirmadosTipoSucursal,
    filterConfirmadosSucursal,
    confirmarCliente,
    noPagoCliente,
    noAbordoCliente,
    getClienteConfirmados,
    getConfirmadosSucursal,
    getConfirmadosTipo,
    confirmarTodos
}
