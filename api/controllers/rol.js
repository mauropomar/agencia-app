'use strinct'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Rol = require('../models/rol');

function saveRol(req, res) {
    var params = req.body;
    var role = new Rol();

    if (params.nombre) {
        role.nombre = params.nombre;
        role.descripcion = params.descripcion;
        Rol.find({ nombre: role.nombre.toLowerCase() }).exec((err, roles) => {
            if (err) return res.status(500).send({ mesage: 'Error en la petición de roles.' });
            if (roles && roles.length > 1) {
                return res.status(200).send({ message: 'El rol que intentas registrar ya existe.' })
            } else {
                role.save((err, roleStore) => {
                    if (err) return res.status(500).send({ message: 'Error al guardar el rol.' });
                    if (roleStore) {
                        res.status(200).send({ rol: roleStore });
                    } else {
                        res.status(404).send({ message: 'No se ha registrado el rol' });
                    }
                });
            }
        }
        )
    } else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios'
        });
    }
}

function getRoles(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    Rol.find().sort('_id').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({ message: 'No hay roles disponibles.' });
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}


function getRol(req, res) {
    var rolId = req.params.id;
    Rol.findById(rolId, (err, datos) => {
        if (err)
            return res.status(500).send({ message: 'Error en la petición' });
        if (!datos)
            return res.status(404).send({ message: 'El usuario no existe' });
        return res.status(200).send({ datos: datos });
    });
}

module.exports = {
    saveRol,
    getRoles,
    getRol
}
