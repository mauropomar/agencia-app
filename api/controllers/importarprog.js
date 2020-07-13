'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');

var xlsToJson = require('xls-to-json');
var xlsxToJson = require('xlsx-to-json');
var Programacion = require('../models/programacion');
var Disponibilidad = require('../models/disponibilidad');
var TipoSucursal = require('../models/tiposucursal');
var SubRuta = require('../models/subruta');


function importProg(req, res) {
    if (req.files) {
        var file_path = req.files.fichero.path;
        xlsToJson({
            input: file_path,  // input xls
            output: "uploads/importar/output.json", // output json
        }, function (err, result) {
            if (err) {
                console.error(err);
            } else {
                if(result.length == 0){
                    return res.status(200).send({
                        success: false,
                        message: 'El excel no tiene programaciones.'
                    });
                }
                if(!isValid(result[0])){
                    return res.status(200).send({
                        success: false,
                        message: 'El excel no tiene el formato correcto.'
                    });
                }
                var datos = getDatos(result);
                configProgs(datos, res);
            }
        });
    }
}

function isValid(datos) {
    if (datos['Codigo'] && datos['FechaIda'] && datos['FechaRegreso'] && datos['Ruta']
        && datos['TipoSucursal'] && datos['Aerolinea'] && datos['Asientos'])
        return true
    else return false
}

function getDatos(datos) {
    var array = [];
    for (var i = 0; i < datos.length; i++) {
        if (datos[i]['Codigo'] != '' && datos[i]['Ruta'] != '' && datos[i]['FechaIda'] != ''
            && datos[i]['FechaRegreso'] != '' && datos[i]['TipoSucursal'] != ''
            && datos[i]['Asientos'] != '')
            array.push(datos[i]);
    }
    return array;
}

//metodo que configura las programaciones a importar
function configProgs(json, res) {
    if (json.length == 0) {
        return res.status(200).send({
            success: false,
            message: 'No existen datos que importar.',
        });
    }

    asyncSaveProgs(json, res).then((value) => {
        return res.status(200).send({
            success: value.success,
            message: value.message
        });
    });
}

async function asyncSaveProgs(datos) {
    var array = [];
    var arraydisp = [];
    var existe = false;
    for (var i = 0; i < datos.length; i++) {
        var codigo = datos[i]['Codigo'];
        var prog = await Programacion.collection.findOne({codigo: codigo});
        var subruta = await SubRuta.collection.findOne({codigo: datos[i]['Ruta']});
        var tipo = await TipoSucursal.collection.findOne({codigo: datos[i]['TipoSucursal']});
        if (prog != null)
            await Disponibilidad.collection.deleteOne({tiposucursal: tipo._id, prog: prog._id});
        var pais = tipo.pais;
        var idsubruta = subruta._id;
        var ruta = subruta.ruta;
        var asientos = datos[i]['Asientos'];
        var disponibilidad = asientos;
        var fechaida = getRealDate(new Date(datos[i]['FechaIda']));
        var fecharegreso = getRealDate(new Date(datos[i]['FechaRegreso']));
        existe = false;
        for (var j = 0; j < array.length; j++) {
            if (codigo == array[j]['codigo']) {
                existe = true;
                array[j]['asientos'] = array[j]['asientos'] * 1 + asientos * 1;
                array[j]['disponibilidad'] = array[j]['asientos'];
                break;
            }
        }
        arraydisp.push({
            tiposucursal: tipo._id,
            codigo: datos[i]['Codigo'],
            valor: datos[i]['Asientos']
        });
        if (!existe && prog == null) {
            array.push({
                codigo: datos[i]['Codigo'],
                pais: pais,
                ruta: ruta,
                subruta: idsubruta,
                asientos: asientos,
                disponibilidad: disponibilidad,
                aerolinea: datos[i]['Aerolinea'],
                aeronave: datos[i]['Aeronave'],
                fecha_entrada: fechaida,
                fecha_salida: fecharegreso
            })
        }
    }
    if (array.length > 0) {
        await Programacion.collection.insertMany(array);
        await Programacion.collection.find().toArray(function (err, datos) {
            var newArray = [];
            for (var j = 0; j < datos.length; j++) {
                var progid = datos[j]['_id'];
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
            }
            Disponibilidad.collection.insertMany(newArray);
        });
    }

    if (array.length == 0) {
        //console.log(array.length);
        return {
            message: 'Ya existen las programaciones que se desea importar.',
            success: false
        }
    }
    return {
        message: 'Los datos fueron importados correctamente.',
        success: true
    }
}

function getRealDate(date, cant) {
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    return new Date(year, month, day, 3, 0, 0);
}

module.exports = {
    importProg
}