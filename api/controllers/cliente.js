'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Cliente = require('../models/cliente');
var Configuracion = require('../models/configuracion');
var TipoHabitacion = require('../models/tipohabitacion');
var Sucursal = require('../models/sucursal');
var Programacion = require('../models/programacion');
var Disponibilidad = require('../models/disponibilidad');


function actualizarDisp(dispProg, dispSuc, progId, progAnt) {
    var dispId = dispSuc._id;
    dispProg = dispProg - 1;
    Programacion.findByIdAndUpdate(progId, {disponibilidad: dispProg}, (err, datosProg) => {
    });
    var newValor = dispSuc.valor - 1;
    Disponibilidad.findByIdAndUpdate(dispId, {valor: newValor}, (err, datosProg) => {
    });
    //aunmentar la disponibilidad del la programacion anterior
    if (progAnt) {
        Programacion.findById(progAnt, (err, data) => {
            var disp_anterior = data.disponibilidad + 1;
            Programacion.findByIdAndUpdate(progAnt, {disponibilidad: disp_anterior}, (err, datosProg) => {
            });
        })
    }
}

function awaitProgramacion(progId) {
    return new Promise(resolve => {
        Programacion.findOne({_id: progId}).exec((err, pr) => {
            var disp = pr.disponibilidad;
            resolve(disp);
        })
    })
}

function awaitSucursalDatos(sucId) {
    return new Promise(resolve => {
        Sucursal.findOne({_id: sucId}).exec((err, suc) => {
            resolve(suc.tipo);
        })
    });
}

function awaitDisponibilidad(tipo, prog) {
    return new Promise(resolve => {
        Disponibilidad.findOne({tiposucursal: tipo, prog: prog}).exec((err, datos) => {
            resolve(datos);
        })
    })
}

async function asyncSaveCliente(cl, progId) {
    var tipo = await awaitSucursalDatos(cl.sucursal);
    var dispProg = await awaitProgramacion(progId);
    if (dispProg == 0) {
        return {
            success: false,
            message: 'La programación seleccionada no tiene asientos disponibles.'
        }
    }
    var dispSuc = await awaitDisponibilidad(tipo, progId);
    if (!dispSuc || dispSuc.valor == 0) {
        return {
            success: false,
            message: 'La programación seleccionada no tiene asientos disponibles para esta sucursal.'
        }
    }
    return {
        success: true,
        dispsuc: dispSuc,
        disprog: dispProg
    }
}


function saveCliente(req, res) {
    var params = req.body;
    if (params.ruta == '1' || params.subruta == '1' || params.prog == '1') {
        return res.status(200).send({sucess: false, message: 'Envia todos los campos necesarios'});
    }
    if (params.paquete == '1' && params.tipohab == '1') {
        return res.status(200).send({sucess: false, message: 'Debe seleccionar un tipo de habitación.'});
    }
    var cliente = new Cliente();
    cliente.nombre = params.nombre;
    cliente.apellidos = params.apellidos;
    cliente.pasaporte = params.pasaporte;
    cliente.fecha_nac = params.fecha_nac;
    cliente.pais_nac = params.pais_nac;
    cliente.ciudad_nac = params.ciudad_nac;
    cliente.sucursal = params.sucursal;
    cliente.fecha_ida = params.fecha_ida;
    cliente.fecha_regreso = params.fecha_regreso;
    cliente.fecha_expiracion = params.fecha_expiracion;
    cliente.fecha = params.fecha;
    cliente.carriying = params.carriying;
    cliente.issueing = params.issueing;
    cliente.telefono = params.telefono;
    cliente.email = params.email;
    cliente.ruta = params.ruta;
    cliente.subruta = params.subruta;
    cliente.prog = params.prog;
    cliente.usuario = params.usuario;
    cliente.tipohab = (params.tipohab == '1') ? null : params.tipohab;
    cliente.paquete = params.paquete;
    cliente.confirmado = (params.paquete == '2') ? true : false;
    cliente.nopago = false;
    cliente.noabordo = false;
    cliente.titulo = params.titulo;
    cliente.importe = params.importe;
    cliente.created_at = moment().unix();
    var progId = params.prog;
    asyncSaveCliente(cliente, progId).then((value) => {
        if (!value.success) {
            return res.status(200).send({success: false, message: value.message});
        }
        var dispsuc = value.dispsuc;
        var disprog = value.disprog;
        //busca si el existe
        Cliente.find({
            $or: [{pasaporte: cliente.pasaporte.toLowerCase()},
                {email: cliente.email.toLowerCase()}]
        }).exec((err, client) => {
            if (client && client.length > 1) {
                return res.status(200).send({success: false, message: 'Ya existe un cliente con esos datos.'});
            }
            cliente.save((err, datos) => {
                if (err) return res.status(500).send({success: false, message: 'Error al guardar el cliente.'});
                if (!datos) return res.status(404).send({success: false, message: 'No se ha registrado el cliente.'});
                actualizarDisp(disprog, dispsuc, progId);
                return res.status(200).send({
                    success: true,
                    message: 'El cliente fue registrado con éxito.'
                });
            });
        });
    });
}


//editar los datos del cliente
function updateCliente(req, res) {
    var clienteId = req.params.id;
    var update = req.body;
    if (update.ruta == '1' || update.subruta == '1' || update.prog == '1') {
        return res.status(200).send({sucess: false, message: 'Envia todos los campos necesarios'});
    }
    if (update.paquete == '1' && update.tipohab == '1') {
        return res.status(200).send({sucess: false, message: 'Debe seleccionar un tipo de habitación.'});
    }
    update.confirmado = (update.paquete == '2') ? true : false;
    Cliente.find({
        $or: [{nombre: update.nombre.toLowerCase()},
            {pasaporte: update.pasaporte}]
    }).exec((err, clientes) => {
        var cl_isset = false;
        clientes.forEach((cl) => {
            if (cl && cl._id != clienteId)
                cl_isset = true
        });
        if (cl_isset) {
            return res.status(200).send({
                success: false,
                message: 'El cliente que intentas actualizar ya existe.'
            });
        }
        var progId = update.prog;
        var progAnt = update.prog_anterior;
        asyncSaveCliente(update, progId).then((value) => {
            if (!value.success) {
                return res.status(200).send({success: false, message: value.message});
            }
            var dispsuc = value.dispsuc;
            var disprog = value.disprog;
            Cliente.findByIdAndUpdate(clienteId, update, {new: true}, (err, datosCliente) => {
                if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
                if (!datosCliente) return res.status(404).send({
                    success: false,
                    message: 'No se ha podido actualizar.'
                });
                if (progId != progAnt) {
                    actualizarDisp(disprog, dispsuc, progId, progAnt);
                }
                return res.status(200).send({
                    ruta: datosCliente,
                    message: 'El cliente fue actualizado con éxito.',
                    success: true
                });
            });
        })
    })
}


//------------------------------filtrar entre todos los clientes-------------------------//
function filterCliente(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var query = req.query;
    var queryCond = getQueryCond(query);
    Cliente.find(queryCond).sort('_id').populate('sucursal').populate('ruta').populate('subruta').populate('prog').exec((err, datos) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
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

//----------------------Filtrar clientes por el tipo de sucursal--------------------------------//
function filterClienteTipoSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var query = req.query;
    var tiposucursal = query.tiposucursal_user;
    var queryCode = getQueryCond(query);
    queryCode.paquete = '1';
    Cliente.find(queryCode).populate('sucursal').populate('ruta').populate('subruta').populate('prog').exec((err, datos) => {
            if (err) return res.status(500).send({message: 'Error en la peticion'});
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
        }
    )
    ;
}

//-------------------------------Filtrar cliente por sucursal-----------------------------------------//
function filterClienteSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var query = req.query;
    var queryCode = getQueryCond(query);
    queryCode.sucursal = req.query.sucursal_user;
    Cliente.find(queryCode).populate('sucursal').populate('ruta').populate('subruta').populate('prog').exec((err, datos) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        return res.status(200).send({
            datos: datos,
            success: true
        });
    });
}

//--------------------------------------------------------------------------------------------------//

function getCliente(req, res) {
    var clienteId = req.params.id;
    Cliente.findById(clienteId, (err, datos) => {
        if (err)
            return res.status(500).send({success: false, message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({success: false, message: 'El cliente no existe'});
        return res.status(200).send({
            success: true,
            datos: datos
        });
    });
}

//----------------------------------devolver clientes por sucursal-------------------------------------------//
async function asyncClientesSucursal(datos) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        cant++;
        //      var ruta = datos[i]['ruta']._id;
        //       var tipohab = datos[i]['tipohab'];
        //       var tipo = await awaitPrecioHab(ruta, tipohab);
        //       var pasaje = await awaitPrecioPasaje(ruta);
        //       var importe = tipo.precio + pasaje.precio_pasaje;
        var importe = datos[i]['importe'];
        var obj = getObjetoClient(datos[i], importe);
        array.push(obj);
    }
    return {
        cantidad: cant,
        datos: array
    }
};

function getClientesBySucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 30;
    var sucursalId = req.query.sucId;
    var fecha = req.query.fecha;
    var fechaini = new Date(new Date(fecha).setHours(0, 0, 0));
    var fechafin = new Date(new Date(fecha).setHours(23, 59, 59));
    var queryCond = {
        sucursal: sucursalId,
        fecha: {$gte: fechaini, $lt: fechafin}
    }
    var user = req.user;
    //si es comercial
    if (user.rol == '5e92e48842041a0d344a7a19')
        queryCond['paquete'] = '1';
    Cliente.find(queryCond).sort('_id').populate('sucursal').populate('subruta').populate('prog').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncClientesSucursal(datos).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}

//-------------------------------------devolver clientes por tipo de sucursal-------------------------------//
async function asyncClientesTipoSucursal(datos) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        var sucursal = datos[i]['sucursal'];
        if (sucursal != null) {
            cant++;
            /*    var ruta = datos[i]['ruta']._id;
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

function getClientesByTipoSucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 30;
    var sucursalId = req.query.sucursalId;
    var fecha = req.query.fecha;
    var fechaini = new Date(new Date(fecha).setHours(0, 0, 0));
    var fechafin = new Date(new Date(fecha).setHours(23, 59, 59));
    Cliente.find({
        paquete: '1',
        sucursal: sucursalId,
        fecha: {$gte: fechaini, $lt: fechafin}
    }).sort('_id').populate('sucursal', null).populate('subruta').populate('prog').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        asyncClientesTipoSucursal(datos).then((value) => {
            var total = value.cantidad;
            return res.status(200).send({
                datos: value.datos,
                total: total,
                pages: Math.ceil(total / itemsPerPage)
            });
        });
    });
}


//-------------------------------------------devolver clientes-----------------------------------//
function getClientes(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;

    Cliente.find({'fecha': fecha}).sort('_id').populate('sucursal').populate('subruta').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay clientes disponibles.'});
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}


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

//--------------------------------devolver clientes por el pais------------------------------------------//
async function asyncClientes(datos) {
    var array = new Array();
    var cant = 0;
    for (var i = 0; i < datos.length; i++) {
        var sucursal = datos[i]['sucursal'];
        if (sucursal != null) {
            cant++;
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

function getClientesByPais(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 30;
    var paisId = req.query.paisId;
    var fecha = req.query.fecha;
    var fechaini = new Date(new Date(fecha).setHours(0, 0, 0));
    var fechafin = new Date(new Date(fecha).setHours(23, 59, 59));
    var query1 = {"fecha": {$gte: fechaini, $lt: fechafin}};
    var query2 = {pais: paisId};
    Cliente.find(query1).sort('_id').populate('sucursal', null, query2).populate('subruta').populate('prog').paginate(page, itemsPerPage, (err, datos, total) => {
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


//--------------------------------------eliminar cliente--------------------------------------------------//
async function asyncUpdateProg(prog, suc) {
    var tipo = await awaitSucursalDatos(suc);
    var dispProg = await awaitProgramacion(prog);
    var dispSuc = await awaitDisponibilidad(tipo, prog);
    return {
        success: true,
        dispsuc: dispSuc,
        tipo: tipo,
        disprog: dispProg
    }
}

function deleteCliente(req, res) {
    var clienteId = req.params.id;
    Cliente.findOne({_id: clienteId}).exec((err, datosCliente) => {
        var progId = datosCliente.prog;
        var sucId = datosCliente.sucursal;
        Cliente.find({'_id': clienteId}).remove((err, clienteRwemoved) => {
            if (err) return res.status(500).send({message: 'Error al borrar el cliente.'});
            if (!clienteRwemoved) return res.status(404).send({message: 'No existe este cliente.'});
            asyncUpdateProg(progId, sucId).then((value) => {
                var newvalue = value.dispsuc.valor + 1;
                var id_disp = value.dispsuc._id;
                var disprog = value.disprog + 1;
                Programacion.findByIdAndUpdate(progId, {disponibilidad: disprog}, (err, datos) => {
                });
                Disponibilidad.findByIdAndUpdate(id_disp, {valor: newvalue}, (err, datos) => {
                });
                return res.status(200).send({
                    success: true,
                    message: 'El cliente ha sido borrado con éxito.'
                })
            })
        });
    })
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
    return queryCond;
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

//------------------------------------------------------------------------------------------------//

function convertFecha(fecha) {
    var fecha = new Date(fecha);
    var year = fecha.getFullYear();
    var month = fecha.getMonth() + 1;
    var day = fecha.getDate();
    return year + '-' + month + '-' + day;
}


module.exports = {
    saveCliente,
    updateCliente,
    filterCliente,
    filterClienteTipoSucursal,
    filterClienteSucursal,
    getCliente,
    getClientes,
    getClientesBySucursal,
    getClientesByTipoSucursal,
    getClientesByPais,
    deleteCliente,
}
