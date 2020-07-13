'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var Cliente = require('../models/cliente');
var General = require('../models/general');
const docx = require('docx');
const open = require('open');

const {
    Media, Document, Packer, Paragraph, Table, TableCell, TableRow,
    TextRun, AlignmentType, WidthType, ShadingType, HeadingLevel, Header, VerticalAlign,
    BorderStyle,
} = docx;


function print(req, res) {
    console.log('ss')
    const doc = new Document();
    var clientes = req.query.clientes;
    var recibo_factura = req.query.numero;
    recibo_factura++;
    clientes = eval('(' + clientes + ')');
    var filePath = './uploads/sucursales/' + clientes[0].imagen;
    var image = Media.addImage(doc, fs.readFileSync(filePath));
    var tableHeader = getTableHeader(image, recibo_factura);
    var tableBody = getTableBody(clientes);
    var tableGaranty = getTableGarantia();
    var tableFirma = getTableFirma();
    var tableObs = getTableObs();

    doc.addSection({
        headers: {
            default: new Header({
                children: [tableHeader],
            }),
        },
        children: [new Paragraph("\n"), tableBody,
            new Paragraph("\n"), tableGaranty,
            new Paragraph("\n"), tableFirma,
            new Paragraph("\n"), tableObs],
    });

    Packer.toBuffer(doc).then((buffer) => {
        var fileName = 'Factura_' + recibo_factura + '.docx';
        var filePath = './uploads/factura/' + fileName;
        fs.writeFileSync(filePath, buffer);
        var path_file = filePath;
        fs.exists(path_file, (exist) => {
            if (exist) {
                var fichero = path.resolve(path_file);
                open(fichero, {wait: false});
                return res.status(200).send({
                    success: true,
                    message: 'La factura fue exportada con exito.'
                });
            }
        });
    });
}


function getRows(clientes) {
    var array = [new TableRow({
        children: [
            getCellEncab('CLIENTE', 25, "E3E3E3", true),
            getCellEncab('RUTA', 25, "E3E3E3", true),
            getCellEncab('SALIDA', 25, "E3E3E3", true),
            getCellEncab('REGRESO', 25, "E3E3E3", true),
            getCellEncab('LINEA AEREA', 25, "E3E3E3", true),
            getCellEncab('PAGO CUBA', 25, "E3E3E3", true),
            getCellEncab('PAGO HAITI', 25, "E3E3E3", true)
        ]
    })];
    for (var i = 0; i < clientes.length; i++) {
        var row = getRow(clientes[i]);
        array.push(row);
    }

    var rowHosp = getRowHosp(clientes[0]);
    array.push(rowHosp);
    return array;
}

function getRow(cliente) {
    var fecha_ida = formatearDate(cliente.fecha_ida);
    var fecha_regreso = formatearDate(cliente.fecha_regreso);
    var pagoHaiti = (cliente.paquete == 1) ? 260 : 40;
    var importe = cliente.importe * 1;
    var row = new TableRow({
        children: [
            getCellEncab(cliente.nombre, 23, "FFFFFF", false),
            getCellEncab(cliente.ruta, 23, "FFFFFF", false),
            getCellEncab(fecha_ida, 23, "FFFFFF", false),
            getCellEncab(fecha_regreso, 23, "FFFFFF", false),
            getCellEncab(cliente.aerolinea, 23, "FFFFFF", false),
            getCellEncab(pagoHaiti, 23, "FFFFFF", false),
            getCellEncab(importe, 23, "FFFFFF", false)
        ]
    })
    return row;
}

function getRowHosp(cliente) {
    var pagoHaiti = (cliente.paquete == 1) ? 260 : 40;
    var total = cliente.importe + pagoHaiti;
    var hosp = cliente.hospedaje;
    var texto = "TOTAL. $  $" + total + " X PERSONA TOTAL DEL PAQUETE  HAB, " + hosp + "";
    var table = new TableRow({
        children: [
            new TableCell({
                columnSpan: 7,
                children: [new Paragraph({
                    children: [
                        new TextRun({
                            text: texto,
                            bold: true,
                            size: 23
                        }),
                    ]
                }), new Paragraph("\n")],
            })
        ],
    });
    return table;
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

function getTableHeader(image, recibo) {
    actualizarRecibo(recibo);
    var table = new Table({
        borders: getBorders(),
        width: {
            size: '100%',
            type: WidthType.DXA,
        },
        margins: {
            top: 400,
            bottom: 400,
            right: 400,
            left: 400,
        },
        alignment: AlignmentType.CENTER,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        alignment: AlignmentType.LEFT,
                        children: [new Paragraph(image)],
                    }),
                    new TableCell({
                        margins: {
                            top: 400,
                            bottom: 400,
                            right: 400,
                            left: 400,
                        },
                        children: [new Paragraph("\n"), new Paragraph("\n"), new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun({
                                text: "Recibo No. " + recibo,
                                bold: true
                            })],
                        }), new Paragraph("\n"), new Paragraph("\n"),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [new TextRun({
                                    text: "Fecha:" + getFechaActual(),
                                    bold: true
                                })],
                            })],
                    }),
                ],
            })
        ],
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

function getTableGarantia() {
    var texto = "Este recibo constituye la garantía de que usted compró su servicio con nuestra Agencia, por esta razón deberá conservarlo hasta el día de regreso.";
    var table = new Table({
        width: {
            size: '100%',
            type: WidthType.AUTO,
        },
        rows: [
            new TableRow({
                children: [new TableCell({
                    shading: {
                        fill: "E3E3E3",
                        color: "e2df0b",
                    },
                    margins: {
                        top: 100,
                        bottom: 100,
                        right: 100,
                        left: 100,
                    },
                    children: [new Paragraph({
                        alignment: AlignmentType.LEFT,
                        margins: {
                            top: 40,
                            bottom: 40,
                        },
                        children: [
                            new TextRun({
                                text: texto,
                                bold: true,
                                size: 23
                            })
                        ]
                    }), new Paragraph({
                        alignment: AlignmentType.CENTER,
                        margins: {
                            top: 40,
                            bottom: 40,
                        },
                        children: [
                            new TextRun({
                                text: "Gracias por preferirnos.",
                                bold: true,
                                size: 23
                            })
                        ]
                    })]
                })]
            })]
    });
    return table;
}

function getTableFirma() {
    var texto = "Este recibo constituye la garantía de que usted compró su servicio con nuestra Agencia, por esta razón deberá conservarlo hasta el día de regreso.";
    var table = new Table({
        width: {
            size: '100%',
            type: WidthType.AUTO,
        },
        rows: [
            new TableRow({
                children: [new TableCell({
                    shading: {
                        fill: "FFFFFF",
                        color: "e2df0b",
                    },
                    margins: {
                        top: 100,
                        bottom: 100,
                        right: 100,
                        left: 100,
                    },
                    children: [new Paragraph({
                        alignment: AlignmentType.LEFT,
                        margins: {
                            top: 40,
                            bottom: 40,
                        },
                        children: [
                            new TextRun({
                                text: "Firma del cliente.",
                                bold: true,
                                size: 20
                            })
                        ]
                    }), new Paragraph("\n")]
                })]
            })]
    });
    return table;
}

function getTableObs() {
    var table = new Table({
        width: {
            size: '100%',
            type: WidthType.AUTO,
        },
        rows: [
            new TableRow({
                children: [new TableCell({
                    shading: {
                        fill: "FFFFFF",
                        color: "e2df0b",
                    },
                    margins: {
                        top: 100,
                        bottom: 100,
                        right: 100,
                        left: 100,
                    },
                    children: [new Paragraph({
                        alignment: AlignmentType.LEFT,
                        margins: {
                            top: 40,
                            bottom: 40,
                        },
                        children: [
                            new TextRun({
                                text: "Condiciones de la Agencia:  NO ES REEMBOLSABLE, NO ADMITE CAMBIOS DE FECHA.",
                                bold: true,
                                size: 23
                            })
                        ]
                    }),
                        new Paragraph({
                            alignment: AlignmentType.LEFT,
                            margins: {
                                top: 40,
                                bottom: 40,
                            },
                            children: [
                                new TextRun({
                                    text: ". SI NO SE PRESENTA A SU VUELO O ELUDE SU PAGO EN HAITI,  LAS AUTORIDADES DE SUNRISE EMITIRAN UNA ALERTA Y A SU REGRESO USTED NO PODRA ABORDAR  HASTA TANTO NO ABONE EL PRECIO DEL MISMO.",
                                    bold: true,
                                    size: 23
                                })
                            ]
                        }), new Paragraph("\n"),
                        new Paragraph({
                            alignment: AlignmentType.LEFT,
                            margins: {
                                top: 40,
                                bottom: 40,
                            },
                            children: [
                                new TextRun({
                                    text: "Importante: No se admiten Reembolsos ni Cambios en caso de no presentarse el día de su vuelo.",
                                    bold: true,
                                    size: 20
                                })
                            ]
                        }), new Paragraph("\n"),
                        new Paragraph({
                            alignment: AlignmentType.LEFT,
                            margins: {
                                top: 40,
                                bottom: 40,
                            },
                            children: [
                                new TextRun({
                                    text: "No es responsabilidad de la Agencia si decide comprar un boleto que no está comprendido en las fechas de validez de su visado y si su documentación para el viaje está incompleta.",
                                    bold: true,
                                    size: 20
                                })
                            ]
                        }), new Paragraph("\n"),
                        new Paragraph({
                            alignment: AlignmentType.LEFT,
                            margins: {
                                top: 40,
                                bottom: 40,
                            },
                            children: [
                                new TextRun({
                                    text: "Usted debe verificar con las autoridades de Inmigración y los funcionarios de la Embajada si posee todos los documentos y permisos exigidos para los viajes al exterior por las legislaciones cubanas.",
                                    bold: true,
                                    size: 20
                                })
                            ]
                        }), new Paragraph("\n")]
                })]
            })]
    });
    return table;
}

function getBorders() {
    var border = {
        insideVertical: {
            style: BorderStyle.NONE,
        },
        insideHorizontal: {
            style: BorderStyle.NONE,
        },
        top: {
            style: BorderStyle.NONE,
        },
        bottom: {
            style: BorderStyle.NONE,
        },
        left: {
            style: BorderStyle.NONE
        },
        right: {
            style: BorderStyle.NONE
        },
    }
    return border
}

function actualizarRecibo(recibo) {
    General.findByIdAndUpdate('5eb3a749b729722320eed41c', {recibo_factura: recibo}, (err, datosProg) => {
    });
}


function getFechaActual() {
    var date = new Date();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
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
