'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Cliente = require('../models/cliente');
var Configuracion = require('../models/configuracion');
var TipoHabitacion = require('../models/tipohabitacion');
var Disponibilidad = require('../models/disponibilidad');
var Programacion = require('../models/programacion');


function awaitClientesNoPagaron(paisId, user) {
    var fecha_actual = new Date();
    return new Promise(resolve => {
        Cliente.find({confirmado: true, nopago: true}).populate("ruta").exec((err, clients) => {
            var clientes = [];
            for (var i = 0; i < clients.length; i++) {
                var nombre = clients[i]['nombre'] + ' ' +clients[i]['apellidos'];
                var pais = clients[i].ruta.pais_origen;
                var fecha_regreso = new Date(clients[i].fecha_regreso);
                var dias = restarFechas(fecha_regreso, fecha_actual);
                if (!isAdmin(user) && paisId == pais && dias == 1) {
                    clientes.push(nombre);
                }
                if (isAdmin(user) && dias == 1) {
                    clientes.push(nombre);
                }
            }
            resolve(clientes);
        });
    })
}

function awaitClientesNoConfirmados(paisId, user) {
    var fecha_actual = new Date();
    return new Promise(resolve => {
        Cliente.find({"confirmado": false}).populate("ruta").exec((err, clients) => {
            var clientes = [];
            for (var i = 0; i < clients.length; i++) {
                var nombre = clients[i]['nombre'];
                var pais = clients[i].ruta.pais_origen;
                var fecha_ida = new Date(clients[i].fecha_ida);
                var dias = restarFechas(fecha_ida, fecha_actual);
                if (!isAdmin(user) && paisId == pais && dias <= 2) {
                    clientes.push(nombre);
                }
                if (isAdmin(user) && dias <= 2) {
                    clientes.push(nombre);
                }
            }
            resolve(clientes);
        });
    })
}

function awaitProgSinDisp(paisId, user) {
    var fecha_actual = new Date();
    return new Promise(resolve => {
        Programacion.find().populate("ruta").exec((err, progs) => {
            var pr = [];
            for (var i = 0; i < progs.length; i++) {
                var pais = progs[i].pais;
                var fecha_ida = new Date(progs[i].fecha_entrada);
                var dias = restarFechas(fecha_ida, fecha_actual);
                var disp = progs[i].disponibilidad;
                fecha_ida = getStringDate(progs[i].fecha_entrada);
                var fecha_regreso = getStringDate(progs[i].fecha_salida);
                var text = fecha_ida +'-'+ fecha_regreso;
                if (!isAdmin(user) && disp == 0 && dias > 0 && paisId == pais) {
                    pr.push(text);
                }
                if (isAdmin(user) && disp == 0 && dias > 0) {
                    pr.push(text);
                }
            }
            resolve(pr);
        });
    })
}

async function asyncNotificaciones(paisId, user) {
    var nopagados = await awaitClientesNoPagaron(paisId, user);
    var noconfirmados = await awaitClientesNoConfirmados(paisId, user);
    var progsSindisp = await awaitProgSinDisp(paisId, user);
    return {
        nopagados: nopagados,
        noconfirmados: noconfirmados,
        progsindisp: progsSindisp
    }
};


function getNotificaciones(req, res) {
    var paisId = req.params.id;
    var mensajes = [];
    var user = req.user;
    asyncNotificaciones(paisId, user).then((value) => {
        var msgs = getMensajes();
        for (var i = 0; i < msgs.length; i++) {
            if (value.nopagados.length > 0 && msgs[i].id == 1 && (isAdmin(user) || isSupervisor(user))) {
                msgs[i].data = value.nopagados;
                mensajes.push(msgs[i]);
            }
            if (value.noconfirmados.length > 0 && msgs[i].id == 2 && (isAdmin(user) || isComercial(user))) {
                msgs[i].data = value.noconfirmados;
                mensajes.push(msgs[i]);
            }
            if (value.progsindisp.length > 0 && msgs[i].id == 3) {
                msgs[i].data = value.progsindisp;
                mensajes.push(msgs[i]);
            }
        }
        return res.status(200).send({
            datos: mensajes
        });
    });
}

function getMensajes() {
    var msgs = [{
        id: 1,
        message: "Existen clientes que no han pagado su viaje de regreso",
        url: 'home/visados',
        data: []
    }, {
        id: 2,
        message: "Existen clientes que no han sido confirmados y se acerca su fecha de vuelo.",
        url: 'home/clientes',
        data: []
    }, {
        id: 3,
        message: "Existen programaciones sin disponibilidad de asientos.",
        url: 'home/programaciones/1',
        data: [],

    }];
    return msgs;
}

function getStringDate(fecha){
    var date = new Date(fecha);
    var day = fecha.getDate();
    var month = fecha.getMonth();
    var year = fecha.getFullYear();
    fecha = day + '/' + month + '/' + year;
    return fecha;
}

function getSecondsActual() {
    var date = new Date();
    date.setHours(23);
    date.setMinutes(59);
    date.setFullYear(59);
    var segundos = Date.parse(date);
    return segundos;
}

function restarFechas(fecha2, fecha1) {
    var resta = fecha2.getTime() - fecha1.getTime();
    var dias = (Math.round(resta / (1000 * 60 * 60 * 24)));
    return dias;
}

function isAdmin(user) {
    return (user.rol == '5e643def153ca529b82666f3')
}

function isSupervisor(user) {
    return (user.rol == '5e849784bef54731d88e0ff6')
}

function isComercial(user) {
    return (user.rol == '5e92e48842041a0d344a7a19')
}

function isOperador(user) {
    return (user.rol == '5e91c43082aab2150c5cd2fe')
}

module.exports = {
    getNotificaciones
}

