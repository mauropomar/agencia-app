'use strinct'

var Usuario = require('../models/usuario');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');


//metodo de login
function loginUser(req, res) {
    var params = req.body;
    var email = params.email;
    var password = params.password;
    Usuario.findOne({ email: email }, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error de peticion' });
        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {
                    if (params.gettoken) {
                        //devolver  y generar token
                        res.status(200).send({
                            user: user,
                            token: jwt.createToken(user),
                        });
                    }
                } else {
                    return res.status(404).send({ message: 'Usuario y/o contraseña incorrecta.' })
                }
            })
        } else {
            return res.status(404).send({ message: 'El usuario no se ha podido identificar!!!' })
        }
    }
    ).populate('sucursal')
}

//salva los datos de un usuario
function saveUser(req, res) {
    var params = req.body;
    var user = new Usuario();
    if (params.rol != '1' && params.sucursal != '1') {
        user.nombre = params.nombre;
        user.apellidos = params.apellidos;
        user.cuenta = params.cuenta;
        user.email = params.email;
        user.rol = params.rol;
        user.sucursal = params.sucursal;
        user.imagen = null;
        Usuario.find({
            $or: [{ email: user.email.toLowerCase() },
            { cuenta: user.cuenta.toLowerCase() }]
        }).exec((err, users) => {
            if (err) return res.status(500).send({ success: false, message: 'Error en la petición de usuarios.' });
            if (users && users.length > 1) {
                return res.status(200).send({ success: false, message: 'El usuario que intentas registrar ya existe.' })
            } else {
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;
                    user.save((err, userStore) => {
                        if (err) return res.status(500).send({ message: 'Error al guardar el usuario' });
                        if (userStore) {
                            res.status(200).send({
                                user: userStore,
                                message: 'El usuario fue registrado con éxito',
                                success: true
                            });
                        } else {
                            res.status(404).send({ message: 'No se ha registrado el usuario' });
                        }
                    });
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

//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updatePerfil(req, res) {
    var userId = req.params.id;
    var update = req.body;
    Usuario.find({
        $or: [{ email: update.email.toLowerCase() },
        { cuenta: update.cuenta.toLowerCase() }]
    }).exec((err, users) => {
        var user_isset = false;
        users.forEach((user) => {
            if (user && user._id != userId)
                user_isset = true
        });
        if (user_isset) return res.status(200).send({
            success: false,
            message: 'El perfil que intentas actualizar ya existe.'
        });
        bcrypt.hash(update.password, null, null, (err, hash) => {
            var password = (update.password_anterior != update.password) ? hash : update.password;
            var user = {
                nombre: update.nombre,
                apellidos: update.apellidos,
                cuenta: update.cuenta,
                email: update.email,
                imagen: update.imagen,
                password: password
            };
            Usuario.findByIdAndUpdate(userId, user, { new: true }, (err, datosUsuario) => {
                if (err) return res.status(500).send({ success: false, message: 'Error en la peticion.' });
                if (!datosUsuario) return res.status(404).send({
                    success: false,
                    message: 'No se ha podido actualizar.'
                });
                return res.status(200).send({
                    user: datosUsuario,
                    message: 'El perfil fue actualizado con éxito',
                    success: true
                });
            });
        });
    });
}


//-----------------------------------------------------------------------------------------------------//
//editar los datos del usuario
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;
    // borrar propiedad password
    if (update.sucursal == '1') {
        return res.status(200).send({ message: 'Envia todos los campos necesarios' });
    }
    Usuario.find({
        $or: [{ email: update.email.toLowerCase() },
        { cuenta: update.cuenta.toLowerCase() }]
    }).exec((err, users) => {
        var user_isset = false;
        users.forEach((user) => {
            if (user && user._id != userId)
                user_isset = true
        });
        if (user_isset) return res.status(200).send({
            success: false,
            message: 'El usuario que intentas actualizar ya existe.'
        });
        bcrypt.hash(update.password, null, null, (err, hash) => {
            var password = (update.password_anterior != update.password) ? hash : update.password;
            console.log(update.password_anterior);
            console.log(update.password);
            var user = {
                nombre: update.nombre,
                apellidos: update.apellidos,
                cuenta: update.cuenta,
                email: update.email,
                rol: update.rol,
                sucursal: update.sucursal,
                imagen: update.imagen,
                password:password
            };
            Usuario.findByIdAndUpdate(userId, user, { new: true }, (err, datosUsuario) => {
                if (err) return res.status(500).send({ success: false, message: 'Error en la peticion.' });
                if (!datosUsuario) return res.status(404).send({
                    success: false,
                    message: 'No se ha podido actualizar.'
                });
                return res.status(200).send({
                    user: datosUsuario,
                    message: 'El usuario fue actualizado con éxito',
                    success: true
                });
            });
        });
    });
}


//metodo que devuelve un usuario determninado
//----------------------------------------User---------------------------------------//
function getUser(req, res) {
    var userId = req.params.id;
    Usuario.findById(userId, (err, datos) => {
        if (err)
            return res.status(500).send({ message: 'Error en la petición' });
        if (!datos)
            return res.status(404).send({ message: 'El usuario no existe' });
        var array = new Array({
            _id: datos['_id'],
            nombre: datos['nombre'],
            apellidos: datos['apellidos'],
            cuenta: datos['cuenta'],
            email: datos['email'],
            sucursal: datos['sucursal']['_id'],
            pais: datos['sucursal']['pais'],
            rol: datos['rol'],
            password: datos['password'],
            imagen: datos['imagen']
        });
        return res.status(200).send({ datos: array });
    }).populate('sucursal');
}

//-----------------------------------Users-------------------------------------------------//
//metodo que devuelve un listado de usuarios paginados
function getUsers(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 10;
    console.log('eee');
    Usuario.find().sort('_id').populate('rol', 'nombre').populate('sucursal', 'nombre pais').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({ message: 'No hay usuarios disponibles.' });
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

//-----------------------------------Users-------------------------------------------------//
//metodo que devuelve un listado de usuarios paginados
function getUsersBySucursal(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 20;
    Usuario.find({sucursal:req.query.sucId}).sort('_id').populate('rol', 'nombre').populate('sucursal', 'nombre pais').paginate(page, itemsPerPage, (err, datos, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({ message: 'No hay usuarios disponibles.' });
        return res.status(200).send({
            datos,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

function searchUsuario(req, res){
    
    var queryCond = {};
    var query = req.query;
  
    if (query.type == 'cuenta') {
        queryCond.cuenta = {$regex: query.term, $options: "i"}
    }
   if (query.type == 'nombre') {
        queryCond.nombre = {$regex: query.term, $options: "i"}
    }
    Usuario.find(queryCond).sort('nombre').exec((err, datos) => {
        if (err) return res.status(500).send({ succss: false, message: 'Error en la peticion' });
        if (!datos) return res.status(400).send({message: 'No hay usuarios disponibles.'});
        return res.status(200).send({
            datos: datos,
            success: true
        });
    });
}

function uploadImage(req, res) {
    var userId = req.params.id;

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
            Usuario.findByIdAndUpdate(userId, { imagen: file_name }, { new: true }, (err, datos) => {
                if (err) return res.status(500).send({ message: 'Error en la peticion.' });
                if (!datos) return res.status(404).send({ message: 'No se ha podido actualizar.' });
                return res.status(200).send({ user: datos });
            })
        } else {
            return removeFilePathUploads(res, file_path, 'Extensión no válida.');
        }
    } else {
        return res.status(200).send({ message: 'No se han subido imagenes.' });
    }
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/usuarios/' + image_file;
    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({ message: 'No existe la imagen...' });
        }
    });
}

function removeFilePathUploads(res, filepath, message) {
    fs.unlink(filepath, (err) => {
        return res.status(200).send({ message: message });
    })
}

function deleteUsuario(req, res) {
    var userId = req.params.id;
    Usuario.findOne({ '_id': userId }).remove(err => {
        if (err)
            return res.status(500).send({ success: false, message: 'Imposible borrar este usuario.' });
        return res.status(200).send({ success: true, message: 'El usuario ha sido borrado con éxito.' });
    })
}


module.exports = {
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    updatePerfil,
    uploadImage,
    getImageFile,
    deleteUsuario,
	searchUsuario,
    getUsersBySucursal
}
