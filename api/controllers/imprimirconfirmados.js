'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
const docx = require('docx');
const open = require('open');

const {
    Media, Document, Packer, Paragraph, Table, TableCell, TableRow,
    TextRun, AlignmentType, WidthType, ShadingType, HeadingLevel, Header, VerticalAlign,
    BorderStyle,
} = docx;

function print(req, res) {
    const doc = new Document();
    var params = req.body;
    var clientes = params.clientes;
    var tableBody = getTableBody(clientes);
    doc.addSection({
        headers: {
            default: new Header({
                children: [new Paragraph({
                    text: 'Clientes Confirmados',
                    heading: HeadingLevel.HEADING_1,
                    thematicBreak: true,
                })],
            }),
        },
        children: [new Paragraph("\n"), tableBody],
    });

    Packer.toBuffer(doc).then((buffer) => {
        var fileName = 'Confirmados_' + Math.random() + '.docx';
        var filePath = './uploads/exportar/' + fileName;
        fs.writeFileSync(filePath, buffer);
        var path_file = filePath;
        fs.exists(path_file, (exist) => {
            if (exist) {
                var fichero = path.resolve(path_file);
                open(fichero, {wait: true});
                return res.status(200).send({
                    success: true,
                    message: 'Los clientes fueron exportados con exito.'
                });
            }
        });
    });
}

function getRows(clientes) {
    var array = [new TableRow({
        children: [
            getCellEncab('CLIENTE', 25, "E3E3E3", true),
            getCellEncab('PASAPORTE', 25, "E3E3E3", true),
            getCellEncab('SUCURSAL', 25, "E3E3E3", true),
            getCellEncab('RUTA', 25, "E3E3E3", true),
            getCellEncab('SALIDA', 25, "E3E3E3", true),
            getCellEncab('REGRESO', 25, "E3E3E3", true),
            getCellEncab('IMPORTE', 25, "E3E3E3", true)
        ]
    })];

    for (var i = 0; i < clientes.length; i++) {
        var row = getRow(clientes[i]);
        array.push(row);
    }
    return array;
}

function getRow(cliente) {
    var fecha_ida = formatearDate(cliente.fecha_ida);
    var fecha_regreso = formatearDate(cliente.fecha_regreso);
    var importe = cliente.importe;
    var fill = "FFFFFF";
    if(cliente.nopago == true)
        fill = "FF9597"
    if(cliente.noabordo == true)
        fill = "FFF9C8"
    var row = new TableRow({
        children: [
            getCellEncab(cliente.nombre +' '+ cliente.apellidos, 23, fill, false),
            getCellEncab(cliente.pasaporte, 23, fill, false),
            getCellEncab(cliente.sucursal.nombre, 23, fill, false),
            getCellEncab(cliente.subruta.nombre, 23, fill, false),
            getCellEncab(fecha_ida, 23, fill, false),
            getCellEncab(fecha_regreso, 23, fill, false),
            getCellEncab(importe, 23, fill, false)
        ]
    })
    return row;
}

function getTableBody(clientes) {
    var table = new Table({
        width: {
            size: '100%',
            type: WidthType.AUTO,
        },
        rows: getRows(clientes),
    });
    return table;
}

function getCellEncab(texto, size, fill, bold) {
    return new TableCell({
        shading: {
            fill: fill,
            color: "e2df0b",
        },
        margins: {
            top: 100,
            bottom: 100,
            right: 100,
            left: 100,
        },
        children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            margins: {
                top: 40,
                bottom: 40,
            },
            children: [
                new TextRun({
                    text: texto,
                    bold: bold,
                    size: size
                })
            ]
        })]
    })
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
