'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Configuracion = require('../models/configuracion');
var Cliente = require('../models/cliente');
var Programacion = require('../models/programacion');
var Disponibilidad = require('../models/disponibilidad');

function saveConf(req, res) {
    var params = req.body;
    if (!params.ruta) {
        return res.status(200).send({message: 'Envia todos los campos necesarios.'});
    }
    var conf = new Configuracion();
    conf.precio_pasaje = params.precio_pasaje;
    conf.ruta = params.ruta;
    Configuracion.findOne({ruta: params.ruta}, (err, confStore) => {
        if (err) return res.status(500).send({success: false, message: 'Error de peticion'});
        if (confStore) {
            return res.status(200).send({success: false, message: 'Ya existe una configuración con ese nombre.'});
        }
        conf.save((err, confStore) => {
            if (err) return res.status(500).send({success: false, message: 'Error al guardar la configuración.'});
            if (!confStore) return res.status(404).send({
                success: false,
                message: 'No se ha registrado la configuración.'
            });
            return res.status(200).send({success: true, conf: confStore, message:'Los configuración del sistema fue actualizada con éxito'});
        });
    });
}

//metodo que devuelve un pais determninado
//----------------------------------------Pais---------------------------------------//
function getConfiguracion(req, res) {
    var rutaId = req.params.ruta;
    Configuracion.find({'ruta':rutaId}).sort('_id').populate('ruta').exec((err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La configuración no existe'});
        return res.status(200).send({datos});
    });
}



//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updateConf(req, res) {
    var id = req.params.id;
    var update = req.body;
    Configuracion.findByIdAndUpdate(id, update, {new: true}, (err, datosConf) => {
        if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
        if (!datosConf) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
        return res.status(200).send({success: true, datos: datosConf, message:'Los configuración del sistema fue actualizada con éxito'});
    })
}
//----------------------------Eliminar todos los clientes y los------------------------------//


function awaitDeleteProgs(user) {
    var fecha_actual = new Date();
    return new Promise(resolve => {
        Programacion.find().exec((err, progs) => {
            var cantidad = 0;
            for (var i = 0; i < progs.length; i++) {
                var fecha_salida = new Date(progs[i].fecha_salida);
                var dias = restarFechas(fecha_actual, fecha_salida);
                var progId = progs[i]['_id'];
                if(dias > 5){
                    cantidad++;
                    Programacion.findOne({'_id': progId}).remove((err, progRwemoved) => {});
                    Disponibilidad.find({'prog':progId}).remove((err, progRwemoved) => {});
                }
            }
            resolve(cantidad);
        });
    })
}

function awaitDeleteClientes(user) {
    var fecha_actual = new Date();
    return new Promise(resolve => {
        Cliente.find().exec((err, clients) => {         
            var cantidad = 0;
            for (var i = 0; i < clients.length; i++) {
                var fecha_regreso = new Date(clients[i].fecha_regreso);
                var dias = restarFechas(fecha_actual, fecha_regreso);
                var clientId = clients[i]['_id'];
                dias = isNaN(dias)?0:dias;
                if(dias > 5){
                    cantidad++;
                    Cliente.findOne({'_id': clientId}).remove((err, clRwemoved) => {});
                }
            }
            resolve(cantidad);
        });
    })
}

async function asyncDeleteAll(user) {
    var progs = await awaitDeleteProgs(user);
    var clients = await awaitDeleteClientes(user);
    return {
        progs: progs,
        clients: clients
    }
};

function deleteAll(req, res) {
    var user = req.user;
    asyncDeleteAll(user).then((value) => {
        var cantidad = value.clients;
        var progs = value.progs;        
        return res.status(200).send({
          success:true,
          clientes:cantidad,
          progs:progs
        });
    });
}

function restarFechas(fecha2, fecha1){    
    var resta = fecha2.getTime() - fecha1.getTime();
    var dias = (Math.round(resta/(1000*60*60*24)));
    return dias;
}

module.exports = {
    saveConf,
    deleteAll,
    updateConf,
    getConfiguracion
}
