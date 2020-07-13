'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var Cliente = require('../models/cliente');
const docx = require('docx');
const open = require('open');

const {Media, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, Header} = docx;


function print(req, res) {
    const doc = new Document();
    var clientes = req.query.clientes;
    clientes = eval('(' + clientes + ')');
    var filePath = './uploads/sucursales/' + clientes[0].imagen;

    const image = Media.addImage(doc, fs.readFileSync(filePath));
    const table = new Table({
        rows: getRows(clientes),
    });
    doc.addSection({
        headers: {
            default: new Header({
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [image]
                })],
            }),
        },
        children: [new Paragraph("\n"), new Paragraph("\n"), new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    text: "VOUCHER DE SERVICIO ",
                    size: 38,
                    bold: true
                }),
            ],
        }),new Paragraph("\n"),new Paragraph("\n"), table],
    });
    Packer.toBuffer(doc).then((buffer) => {
        var fileName = 'Voucher_' + Math.random() + '.docx';
        var filePath = './uploads/voucher/' + fileName;
        fs.writeFileSync(filePath, buffer);
        var path_file = filePath;
        fs.exists(path_file, (exist) => {
            if (exist) {
                var fichero = path.resolve(path_file);
                open(fichero, {wait: false});
                return res.status(200).send({
                    success: true,
                    message: 'El voucher fue exportado con exito.'
                });
            }
        });
    });



}


function getRows(clientes) {
    var array = [];
    var nombre = "";
    var row;
    for (var i = 0; i < clientes.length; i++) {
        var j = i + 1;
        nombre = "NOMBRE y APELLIDO # " + j + ": " + clientes[i].titulo + ". " + clientes[i].nombre;
        row = getRow(nombre);
        array.push(row);
    }

    nombre = "PAQUETE TURISTICO: VUELO + HOTEL CON DESAYUNO + CENA + TRANSFER IN AND OUT";
    row = getRow(nombre);
    array.push(row);
    nombre = "HOTELS DE PASCALE -  SE LES AVISARA SU HOTEL A LA LLEGADA EN HAITI";
    row = getRow(nombre);
    array.push(row);
    var fecha_llegada = formatearDate(clientes[0].fecha_ida);
    nombre = "FECHA DE LLEGADA: " + fecha_llegada;
    row = getRow(nombre);
    array.push(row);
    var fecha_salida = formatearDate(clientes[0].fecha_regreso);
    nombre = "FECHA DE SALIDA: " + fecha_salida;
    row = getRow(nombre);
    array.push(row);
    nombre = "TIPO DE HABITACION: " + clientes[0].hospedaje;
    row = getRow(nombre);
    array.push(row);
    return array;
}

function getRow(nombre) {
    var table = new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [
                        new TextRun({
                            text: nombre,
                            size: 23
                        }),
                    ]
                }),new Paragraph("\n"),new Paragraph("\n")],
            })
        ],
    });
    return table;

}

function formatearDate(fecha) {
    var year = fecha.substring(0, 4);
    var month = fecha.substring(5, 7);
    var day = fecha.substring(8, 10);
    var newDate = day + '/' + month + '/' + year;
    return newDate;
}


module.exports = {
    print
}
