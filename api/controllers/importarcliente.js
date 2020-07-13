'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');

var xlsToJson = require('xls-to-json');
var xlsxToJson = require('xlsx-to-json');
var Cliente = require('../models/cliente');
var Programacion = require('../models/programacion');
var Sucursal = require('../models/sucursal');
var TipoHabitacion = require('../models/tipohabitacion');
var Disponibilidad = require('../models/disponibilidad');

function importCliente(req, res) {
    if (req.files) {
        var file_path = req.files.fichero.path;
        xlsToJson({
            input: file_path,  // input xls
            output: "uploads/importar/output.json", // output json
        }, function (err, result) {
            if (err) {
                console.error(err);
            } else {
                if (result.length == 0) {
                    return res.status(200).send({
                        success: false,
                        message: 'El excel no tiene clientes.'
                    });
                }
                if (!isValid(result[0])) {
                    return res.status(200).send({
                        success: false,
                        message: 'El excel no tiene el formato correcto.'
                    });
                }
                var datos = getDatos(result);
                configCliente(datos, res);
            }
        });
    }
}

function isValid(datos) {
    if (datos['Paquete'] && datos['Programacion'] && datos['Sucursal'] && datos['FechaIda']
        && datos['FechaRegreso'] && datos['Titulo'] && datos['Pasaporte'] && datos['Nombre']
        && datos['Apellidos'] && datos['Creacion'] && datos['CarryingInfant']
        && datos['FechaNac'])
        return true
    else return false
}

function getDatos(datos) {
    var array = [];
    for (var i = 0; i < datos.length; i++) {
        if (datos[i]['Programacion'] != '' && datos[i]['Sucursal'] != '' && datos['Sucursal'] != '' &&
            datos['FechaIda'] != '' && datos['FechaRegreso'] != '' && datos['Titulo'] != '' && datos['Pasaporte'] != '' &&
            datos['Nombre'] != '' && datos['Apellidos'] != '')
            array.push(datos[i]);
    }
    return array;
}

//metodo que configura las programaciones a importar
function configCliente(json, res) {
    if (json.length == 0) {
        return res.status(200).send({
            success: false,
            message: 'No existen datos que importar.',
        });
    }
    asyncCliente(json).then((value) => {
        return res.status(200).send({
            success: value.success,
            message: value.message
        });
    });
}

function getHospedaje(nombre) {
    if (nombre == 'sgl')
        nombre = 'Simple';
    if (nombre == 'dbl')
        nombre = 'Doble';
    if (nombre == 'tpl')
        nombre = 'Triple';
    return nombre;
}


async function asyncCliente(datos) {
    var cant = 0;
    var message = '';
    var array = [];
    for (var i = 0; i < datos.length; i++) {
        var cliente = await Cliente.collection.findOne({pasaporte: datos[i]['Pasaporte']});
        var prog = await Programacion.collection.findOne({codigo: datos[i]['Programacion']});
        if (prog == null) {
            message = 'El código de la programación no existe.'
            break
        }
        ;
        var sucursal = await Sucursal.collection.findOne({codigo: datos[i]['Sucursal']});
        if (sucursal == null) {
            message = 'El código de la sucursal no existe.'
            break
        }
        ;

        var dispsuc = await Disponibilidad.collection.findOne({tiposucursal: sucursal.tipo, prog: prog._id});
        if (!dispsuc || dispsuc.valor == 0 || prog.disponibilidad == 0) {
            return {
                success: false,
                message: 'Algunos clientes no fueron registrados por que no existe disponibilidad de asientos.'
            }
        }

        if (cliente == null) {
            var hospedaje = getHospedaje(datos[i]['Hospedaje']);
            var tipohab = await TipoHabitacion.collection.findOne({ruta: prog.ruta, nombre: hospedaje});
            var disp = prog.disponibilidad - 1;
            Programacion.collection.updateOne({'_id': prog._id}, {$set: {'disponibilidad': disp}});
            disp = dispsuc.valor - 1;
            Disponibilidad.collection.updateOne({'_id': dispsuc._id}, {$set: {'valor': disp}});
            var fecha_ida = prog.fecha_entrada;
            var fecha_regreso = prog.fecha_salida;
            array.push({
                nombre: datos[i]['Nombre'],
                apellidos: datos[i]['Apellidos'],
                pasaporte: datos[i]['Pasaporte'],
                fecha_nac: datos[i]['FechaNac'],
                pais_nac: datos[i]['Nationality'],
                ciudad_nac: datos[i]['PlaceBirth'],
                sucursal: sucursal._id,
                fecha_ida: new Date(fecha_ida),
                fecha_regreso: new Date(fecha_regreso),
                fecha_expiracion: getDate(new Date(datos[i]['FechaExpiracion'])),
                fecha: getDate(new Date(datos[i]['Creacion'])),
                carriying: datos[i]['CarryingInfant'],
                issueing: datos[i]['IssueingCountry'],
                telefono: datos[i]['Telefono'],
                email: datos[i]['Email'],
                importe: datos[i]['Importe'],
                ruta: prog.ruta,
                subruta: prog.subruta,
                prog: prog._id,
                usuario: null,
                tipohab: (tipohab != null) ? tipohab._id : null,
                paquete: datos[i]['Paquete'],
                confirmado: false,
                nopago: false,
                noabordo: false,
                titulo: datos[i]['Titulo'],
                created_at: moment().unix(),
            })
        }
    }
    if (message != '') {
        return {
            message: message,
            success: false
        }
    }
    if (array.length == 0) {
        return {
            message: 'Ya existen los clientes que desea importar.',
            success: false
        }
    }
    //  console.log(array);
    await Cliente.collection.insertMany(array, function (err, result) {
        /*  for (var j = 0; j < datos.length; j++) {
              var progid = datos[j]['prog'];
              var codigo = datos[j]['codigo'];
              for (var i = 0; i < arraydisp.length; i++) {
                  if (codigo == arraydisp[i]['codigo']) {
                      newArray.push({
                          tiposucursal: arraydisp[i]['tiposucursal'],
                          prog: progid,
                          valor: arraydisp[i]['valor']
                      })
                  }
              }
          }*/
    });
    return {
        message: 'Los datos fueron importados correctamente.',
        success: true
    }
}


//actualizar disponibilidad del tipo de sucersal y de la programacion.
function actualizarDisp(prog, dispsuc) {
    var progId = prog._id;
    var newValor = prog.disponibilidad - 1;
    var dispId = dispsuc._id;
    Programacion.findByIdAndUpdate(progId, {disponibilidad: newValor}, (err, datos) => {
    });
    newValor = dispsuc.valor - 1;
    Disponibilidad.findByIdAndUpdate(dispId, {valor: newValor}, (err, datos) => {
    });
}


function addDate(date, cant) {
    date.setDate(date.getDate() + cant);
    return date;
}

function getDate(date) {
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    return new Date(year, month, day, 23, 0, 0);
}

module.exports = {
    importCliente
}


