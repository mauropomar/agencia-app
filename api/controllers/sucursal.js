'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Sucursal = require('../models/sucursal');
var Usuario = require('../models/usuario');

//metodo que inserta una ciudad determninada
function saveSucursal(req, res) {
    var params = req.body;
    if (params.pais == '1' || params.ciudad == '1') {
        return res.status(200).send({success: false, message: 'Envia todos los campos necesarios'});
    }
    var sucursal = new Sucursal();
    sucursal.codigo = params.codigo;
    sucursal.nombre = params.nombre;
    sucursal.pais = params.pais;
    sucursal.ciudad = params.ciudad;
    sucursal.tipo = params.tipo;
    Sucursal.findOne({codigo: params.codigo, nombre: params.nombre}, (err, suc) => {
        if (err) return res.status(500).send({success: false, message: 'Error de peticion'});
        if (suc) {
            return res.status(200).send({success: false, message: 'Ya existe una sucursal con esos datos.'});
        }
        sucursal.save((err, datos) => {
            if (err) return res.status(500).send({success: false, message: 'Error al guardar la sucursal.'});
            if (!datos) return res.status(404).send({success: false, message: 'No se ha registrado la sucursal'});
            return res.status(200).send({
                success: true,
                sucursal: datos,
                message: 'La sucursal fue registrada con éxito',
            });
        });
    });
}

//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updateSucursal(req, res) {
    var sucId = req.params.id;
    var update = req.body;
    if (update.ciudad == '1' || update.tiposucursal == '1') {
        return res.status(200).send({success: false, message: 'Envia todos los campos necesarios'});
    }
    Sucursal.find({codigo: update.codigo, nombre: update.nombre.toLowerCase()}, (err, sucs) => {
        var suc_isset = false;
        sucs.forEach((suc) => {
            if (suc && suc._id != sucId)
                suc_isset = true
        });
        if (suc_isset) return res.status(200).send({
            success: false,
            message: 'La sucursal que intentas actualizar ya existe.'
        });
        Sucursal.findByIdAndUpdate(sucId, update, {new: true}, (err, datosSucursales) => {
            if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
            if (!datosSucursales) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
            return res.status(200).send({
                sucursal: datosSucursales,
                message: 'La sucursal fue actualizada con éxito',
                success: true
            });
        });
    })
}

//metodo que devuelve una sucursal determninada
function getSucursal(req, res) {
    var sucursalId = req.params.id;
    Sucursal.findById(sucursalId, (err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La sucursal no existe'});
        return res.status(200).send({datos});
    });
}

//metodo que devuelve una sucursal determninada
function getSucursals(req, res) {
    var paisId = req.query.paisId;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Sucursal.find({'pais': paisId}).sort('tipo').populate('pais', 'nombre').populate('ciudad', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay sucursales disponibles.'});
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function getSucursalsByUser(req, res) {
    var userId = req.query.userId;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Usuario.findById(userId, (err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'El usuario no existe'});
        if (datos.sucursal) {
            var sucursalId = datos.sucursal;
            Sucursal.find({'_id': sucursalId}).sort('_id').populate('pais', 'nombre').populate('ciudad', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
                if (err)
                    return res.status(500).send({message: 'Error en la petición'});
                if (!datos)
                    return res.status(404).send({message: 'La sucursal no existe'});
                return res.status(200).send({
                    datos,
                    total: 1,
                    pages: 1
                });
            });
        }
    })
}

function getSucursalsByRuta(req, res) {
    var rutaId = req.query.rutaId;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Sucursal.find({'ruta': rutaId}).sort('tipo').populate('pais', 'nombre').populate('ciudad', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La sucursal no existe'});
        return res.status(200).send({
            datos,
            total: 1,
            pages: 1
        });
    });

}

function getSucursalsByPais(req, res) {
    var paisId = req.query.paisId;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Sucursal.find({'pais': paisId}).sort('tipo').populate('pais', 'nombre').populate('ciudad', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La sucursal no existe'});
        return res.status(200).send({
            datos,
            total: 1,
            pages: 1
        });
    });
}

function getSucursalsByTipo(req, res) {
    var page = 1;
    var tipoId = req.query.tipoId;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Sucursal.find({'tipo': tipoId}).sort('tipo').populate('pais', 'nombre').populate('ciudad', 'nombre').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La sucursal no existe'});
        return res.status(200).send({
            datos: datos,
            total: total,
            pages: page
        });
    });
}


function uploadImage(req, res) {
    var sucId = req.params.id;

    if (req.files) {
        var file_path = req.files.imagen.path;
        //  console.log(file_path);
        var file_split = file_path.split('\\');
        //   console.log(file_split);
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        //     console.log(ext_split);
        var file_ext = ext_split[1];
        //     console.log(file_ext);
        /*  if (userId != req.user.sub) {
              return removeFilePathUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario.');
          }*/
        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg') {
            //Actualizar documento usuario logueado
            Sucursal.findByIdAndUpdate(sucId, {imagen: file_name}, {new: true}, (err, datos) => {
                if (err) return res.status(500).send({message: 'Error en la peticion.'});
                if (!datos) return res.status(404).send({message: 'No se ha podido actualizar.'});
                return res.status(200).send({user: datos});
            })
        } else {
            return removeFilePathUploads(res, file_path, 'Extensión no válida.');
        }
    } else {
        return res.status(200).send({message: 'No se han subido imagenes.'});
    }
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/sucursales/' + image_file;
    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({message: 'No existe la imagen...'});
        }
    });
}

function removeFilePathUploads(res, filepath, message) {
    fs.unlink(filepath, (err) => {
        return res.status(200).send({message: message});
    })
}

function deleteSucursal(req, res) {
    var sucursalId = req.params.id;
    Sucursal.find({'_id': sucursalId}).remove((err, sucursalRwemoved) => {
        if (err) return res.status(500).send({message: 'Error al borrar la sucursal.'});
        if (!sucursalRwemoved) return res.status(404).send({message: 'No existe esta sucursal.'});
        return res.status(200).send({success: true, message: 'La sucursal ha sido borrada con éxito.'});
    });
}

module.exports = {
    saveSucursal,
    updateSucursal,
    getSucursal,
    getSucursals,
    getSucursalsByUser,
    getSucursalsByRuta,
    getSucursalsByPais,
    getSucursalsByTipo,
    uploadImage,
    getImageFile,
    deleteSucursal
}
