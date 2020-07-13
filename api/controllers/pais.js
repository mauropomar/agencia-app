'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Pais = require('../models/pais');
var Ruta = require('../models/ruta');

function savePais(req, res) {
    var params = req.body;
    if (!params.codigo && !params.nombre) {
        return res.status(200).send({message: 'Debo introducir un  nombre.'});
    }
    var pais = new Pais();
    pais.codigo = params.codigo;
    pais.nombre = params.nombre;
    Pais.findOne({codigo: params.codigo}, {nombre: params.nombre}, (err, paisStore) => {
        if (err) return res.status(500).send({message: 'Error de peticion'});
        if (paisStore) {
            return res.status(200).send({message: 'Ya existe una país con ese nombre.'});
        }
        pais.save((err, datos) => {
            if (err) return res.status(500).send({message: 'Error al guardar el país.'});
            if (!datos) return res.status(404).send({message: 'No se ha registrado el país'});
            return res.status(200).send({
                success: true,
                pais: datos,
                message: 'El país fue registrado con éxito.'
            });
        });
    });
}

//metodo que devuelve un pais determninado
//----------------------------------------Pais---------------------------------------//
function getPais(req, res) {
    var paisId = req.params.id;
    Pais.findById(paisId, (err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'El país no existe'});
        return res.status(200).send({datos});
    });
}

//-----------------------------------Users-------------------------------------------------//
//metodo que devuelve un listado de usuarios paginados
function getPaises(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Pais.find().sort('_id').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});
        if (!datos) return res.status(400).send({message: 'No hay paises disponibles.'});
        return res.status(200).send({
            datos: datos,
            total: total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updatePais(req, res) {
    var paisId = req.params.id;
    var update = req.body;
    Pais.find({codigo: update.codigo}, {nombre: update.nombre.toLowerCase()}, (err, paisc) => {
        var pais_isset = false;
        paisc.forEach((p) => {
            if (p && p._id != paisId)
                pais_isset = true
        });
        if (pais_isset) return res.status(200).send({
            success: false,
            message: 'El país que intentas actualizar ya existe.'
        });
        Pais.findByIdAndUpdate(paisId, update, {new: true}, (err, datos) => {
            if (err) return res.status(500).send({success: false, message: 'Error en la peticion.'});
            if (!datos) return res.status(404).send({success: false, message: 'No se ha podido actualizar.'});
            return res.status(200).send({
                pais: datos,
                message: 'El país fue actualizado con éxito',
                success: true
            });
        });
    })
}

//---------------------------------------------------------------------//


function uploadImage(req, res) {
    var paisId = req.params.id;

    if (req.files) {
        var file_path = req.files.imagen.path;
        //  console.log(file_path);
        var file_split = file_path.split('\\');
        //   console.log(file_split);
        var file_name = file_split[2];
        console.log(file_name);
        var ext_split = file_name.split('\.');
        //     console.log(ext_split);
        var file_ext = ext_split[1];
        //     console.log(file_ext);
        if (!req.user.sub) {
            return removeFilePathUploads(res, file_path, 'No tienes permiso para actualizar los datos del país.');
        }
        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg') {
            //Actualizar documento usuario logueado
            Pais.findByIdAndUpdate(paisId, {imagen: file_name}, {new: true}, (err, datos) => {
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
    var path_file = './uploads/paises/' + image_file;
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

function deletePais(req, res) {
    var paisId = req.params.id;
    Ruta.find({pais_origen: paisId}, {pais_destino: paisId}).exec((err, datos) => {
        if (datos.length > 0) {
            return res.status(200).send({
                success: false,
                message: 'Imposible eliminar el país seleccionado, tiene rutas asociadas.'
            });
        }
        Pais.find({'_id': paisId}).remove((err, paisRwemoved) => {
            if (err) return res.status(500).send({success:false, message: 'Error al borrar el país.'});
            if (!paisRwemoved) return res.status(404).send({success:false, message: 'No existe el país.'});
            return res.status(200).send({success: true, message: 'El país ha sido borrado con éxito.'});
        });
    })
}

    module.exports = {
        savePais,
        getPais,
        getPaises,
        updatePais,
        getImageFile,
        uploadImage,
        deletePais
    }
