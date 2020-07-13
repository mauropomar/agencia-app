'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_desarrollar_red_social_angular';
exports.createToken = function (user) {
    var payload = {
        sub: user._id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol,
        image: user.image,
        sucursal: user.sucursal,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix
    }
    return jwt.encode(payload, secret);
}