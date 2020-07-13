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
    var progs = params.progs;
    var tableBody = getTableBody(progs);
    doc.addSection({
        headers: {
            default: new Header({
                children: [new Paragraph({
                    text: 'Programación',
                    heading: HeadingLevel.HEADING_1,
                    thematicBreak: true,
                })],
            }),
        },
        children: [new Paragraph("\n"), tableBody],
    });

    Packer.toBuffer(doc).then((buffer) => {
        var fileName = 'Programacion_' + Math.random() + '.docx';
        var filePath = './uploads/exportar/' + fileName;
        fs.writeFileSync(filePath, buffer);
        var path_file = filePath;
        fs.exists(path_file, (exist) => {
            if (exist) {
                var fichero = path.resolve(path_file);
                open(fichero, {wait: true});
                return res.status(200).send({
                    success: true,
                    message: 'Las programación fueron exportados con exito.'
                });
            }
        });
    });
}

function getRows(progs) {
    var array = [new TableRow({
        children: [
            getCellEncab('CODIGO', 25, "E3E3E3", true),
            getCellEncab('FECHA', 25, "E3E3E3", true),
            getCellEncab('LINEA AEREA', 25, "E3E3E3", true),
            getCellEncab('RUTA', 25, "E3E3E3", true),
            getCellEncab('ASIENTOS', 25, "E3E3E3", true),
            getCellEncab('DISP.', 25, "E3E3E3", true)
        ]
    })];

    for (var i = 0; i < progs.length; i++) {
        var row = getRow(progs[i]);
        array.push(row);
    }
    return array;
}

function getRow(pr) {
    var fecha_entrada = formatearDate(pr.fecha_entrada);
    var fecha_salida = formatearDate(pr.fecha_salida);
    var fill = (pr.disponibilidad == 0)?"red" :"FFFFFF";
    var row = new TableRow({
        children: [
            getCellEncab(pr.codigo, 23, fill , false),
            getCellEncab(fecha_entrada +' - '+ fecha_salida, 23, fill , false),
            getCellEncab(pr.aerolinea, 23, fill , false),
            getCellEncab(pr.subruta.nombre, 23, fill , false),
            getCellEncab(pr.asientos, 23, fill , false),
            getCellEncab(pr.disponibilidad, 23, fill , false),
        ]
    })
    return row;
}

function getTableBody(progs) {
    var table = new Table({
        width: {
            size: '100%',
            type: WidthType.AUTO,
        },
        rows: getRows(progs),
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
