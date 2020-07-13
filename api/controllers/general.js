var General = require('../models/general');


function saveGeneral(req, res) {
    var params = req.body;
    var general = new General();
    general.recibo_factura = params.recibo_factura;
    general.save((err, store) => {
            if (err) return res.status(500).send({success: false, message: 'Error al guardar la configuración.'});
            if (!store) return res.status(404).send({
                success: false,
                message: 'No se ha registrado la configuración.'
            });
            return res.status(200).send({success: true, conf: store, message:'Los datos generales del sistema fueron actualizados con éxito'});
        });
}

function getInfo(req, res) {
    General.find().exec((err, datos) => {
        if (err)
            return res.status(500).send({message: 'Error en la petición'});
        if (!datos)
            return res.status(404).send({message: 'La datos generales no existe'});
        return res.status(200).send({datos});
    });
}


module.exports = {
    saveGeneral,
    getInfo
}