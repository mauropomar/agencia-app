'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Programacion = require('../models/programacion');
var Disponibilidad = require('../models/disponibilidad');
var TipoSucursal = require('../models/tiposucursal');
var Cliente = require('../models/cliente');

//metodo que inserta una programación determninada
function saveProg(req, res) {
    var params = req.body;
    if (!params.pais || !params.ruta || !params.subruta) {
        return res.status(200).send({ message: 'Envia todos los campos necesarios' });
    }
    var prog = new Programacion();
    prog.codigo = params.codigo;
    prog.aeronave = params.aeronave;
    prog.aerolinea = params.aerolinea;
    prog.pais = params.pais;
    prog.asientos = params.asientos;
    prog.disponibilidad = params.disponibilidad;
    prog.ruta = params.ruta;
    prog.subruta = params.subruta;
    prog.fecha_entrada = params.fecha_entrada;
    prog.fecha_salida = params.fecha_salida;
    Programacion.findOne({
        codigo: params.codigo
    }).exec((err, pr) => {
        if (err) return res.status(500).send({ success: false, message: 'Error de peticion' });
        if (pr) {
            return res.status(200).send({ success: false, message: 'Ya existe una programación con esos datos.' });
        }
        prog.save((err, datos) => {
            if (err) return res.status(500).send({ success: false, message: 'Error al guardar la programación.' });
            if (!datos) return res.status(404).send({ success: false, message: 'No se ha registrado la programación' });
            //agregar dinamicamente las disponibilidades a esta programacion
            addDisponibilidades(datos._id, datos.disponibilidad, datos.pais);
            return res.status(200).send({
                success: true,
                programacion: datos,
                message: 'La programación fue registrada con éxito',
            });
        });
    });
}

function addDisponibilidades(progId, dispTotal, paisId) {
    TipoSucursal.find({
        pais: paisId,
    }).exec((err, tipos) => {
        var disp = dispTotal / tipos.length;
        for (var j = 0; j < tipos.length; j++) {
            var disponibilidad = new Disponibilidad();
            disponibilidad.prog = progId;
            disponibilidad.tiposucursal = tipos[j]._id;
            disponibilidad.valor = disp;
            disponibilidad.save((err, datos) => { })
        }

    })
}

//editar los datos del usuario
function updateProg(req, res) {
    var progId = req.params.id;
    var update = req.body;
    Programacion.find({
        codigo: update.codigo
    }).exec((err, progs) => {
        var pr_isset = false;
        progs.forEach((p) => {
            if (p && p._id != progId)
                pr_isset = true
        });
        if (pr_isset) {
            return res.status(200).send({
                success: false,
                message: 'La programación que intentas actualizar ya existe.'
            });
        }
        Programacion.findByIdAndUpdate(progId, update, { new: true }, (err, datosProg) => {
            if (err) return res.status(500).send({ message: 'Error en la peticion.' });
            if (!datosProg) return res.status(404).send({ message: 'No se ha podido actualizar.' });
            return res.status(200).send({
                message: 'La programación fue actualizada con éxito.',
                datos: datosProg,
                success: true,
            });
        })
    })
}

function getProg(req, res) {
    var progId = req.params.id;
    Programacion.findById(progId, (err, datos) => {
        if (err)
            return res.status(500).send({ success: false, message: 'Error en la petición' });
        if (!datos)
            return res.status(404).send({ success: false, message: 'La programación no existe' });
        return res.status(200).send({
            success: true,
            datos: datos
        });
    });
}

function getAllProgs(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var fechainicio = new Date();
    var seconds_inicio = Date.parse(fechainicio);
    Programacion.find().sort('fecha_ida').populate('ruta').populate('subruta').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({ message: 'No hay programaciones disponibles.' });
        var array = new Array();
        for (var j = 0; j < datos.length; j++) {
            var fecha_entrada = datos[j]['fecha_entrada'];
            var seconds_entrada = Date.parse(fecha_entrada);
            if (seconds_inicio < seconds_entrada) {
                array.push(datos[j]);
            }
        }
        return res.status(200).send({
            datos: array,
            total: total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function getProgsByRuta(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var rutaId = req.query.rutaId;
    var fechaida = req.query.fechaInicio;
    var fecharegreso = req.query.fechaFin;
    var fechaini = new Date(new Date(fechaida).setHours(0, 0, 0));
    var fechafin = new Date(new Date(fecharegreso).setHours(23, 59, 59));
    Programacion.find({ ruta: rutaId, fecha_entrada: {$gte: fechaini, $lt: fechafin}}
        ).sort('fecha_entrada').populate('subruta').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({ message: 'No hay programaciones disponibles.' });
        return res.status(200).send({
            datos: datos,
            total: total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function getAllProgsByRuta(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var rutaId = req.query.rutaId;
    Programacion.find({ 'ruta': rutaId }).sort('fecha_entrada').populate('subruta').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({ message: 'No hay programaciones disponibles.' });
        return res.status(200).send({
            datos: datos,
            total: total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function getProgsBySubRuta(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    var rutaId = req.query.rutaId;
    var fechaida = req.query.fechainicio;
    var fechaida = new Date(new Date(fechaida).setHours(0, 59, 59));
    Programacion.find({ 'subruta': rutaId,  fecha_entrada: {$gte: fechaida}}).sort('fecha_entrada').populate('subruta').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({ message: 'No hay programaciones disponibles.' });
        return res.status(200).send({
            datos: datos,
            total: total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function deleteProg(req, res) {
    var progId = req.params.id;
    Cliente.find({ 'prog': progId }).exec((err, datos) => {
        if(datos.length > 0){
            return res.status(200).send({
                success: false,
                message:'Imposible eliminar la programación seleccionada, tiene clientes asociados a ella.' 
            }); 
        }
        Programacion.find({ '_id': progId }).remove((err, progRwemoved) => {
            if (err) return res.status(500).send({ message: 'Error al borrar la programación.' });
            if (!progRwemoved) return res.status(404).send({ message: 'No existe esta programación.' });
            Disponibilidad.find({ 'prog': progId }).deleteMany((err, progRwemoved) => { });
            return res.status(200).send({ 
                success: true,
                message: 'La programación ha sido borrado con éxito.'
            });
        });
    });
}

function filterProg(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var queryCond = {};
    var query = req.query;
    if (query.codigo) {
        queryCond.codigo = {$regex: query.codigo, $options: "i"}
    }
   if (query.aerolinea) {
        queryCond.aerolinea = {$regex: query.aerolinea, $options: "i"}
    }
    if (query.subruta) {
        queryCond.subruta = query.subruta;
    }
   if (query.asientos!='null') {
        queryCond.asientos = query.asientos;
    }
    if (query.disponibilidad != 'null') {
        queryCond.disponibilidad = query.disponibilidad;
    }
    Programacion.find(queryCond).sort('fecha_entrada').populate('ruta').populate('subruta').exec((err, datos) => {
        if (err) return res.status(500).send({ succss: false, message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({message: 'No hay programaciones disponibles.'});
       // console.log(datos)
        datos = filtrarFechas(query, datos);
        return res.status(200).send({
            datos: datos,
            success: true
        });
    });
}

function filtrarFechas(query, datos) {
    var second_inicio = (query.fechaentrada != 'null') ? Date.parse(query.fechaentrada) : null;
    var second_fin = (query.fechasalida != 'null') ? Date.parse(query.fechasalida) : null;
    var array = [];
    if (second_inicio != null || second_fin != null) {
        for (var i = 0; i < datos.length; i++) {
            var second_fecha_entrada = Date.parse(datos[i].fecha_entrada);
            var second_fecha_salida = Date.parse(datos[i].fecha_salida);
            if ((second_inicio != null && second_fin != null) && (second_inicio < second_fecha_entrada && second_fin > second_fecha_salida))
                array.push(datos[i]);
            if ((second_inicio != null && second_fin == null) && second_inicio < second_fecha_entrada)
                array.push(datos[i]);
            if ((second_inicio == null && second_fin != null) && second_fin > second_fecha_salida)
                array.push(datos[i]);
        }
        datos = array;
    }
    return datos;
}


module.exports = {
    saveProg,
    updateProg,
    getProgsByRuta,
    getAllProgsByRuta,
    getProgsBySubRuta,
    getAllProgs,
    getProg,
    filterProg,
    deleteProg
}
