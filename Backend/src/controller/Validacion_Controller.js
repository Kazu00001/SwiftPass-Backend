import {verificacion_Uid_nfc } from "../DB/querySql.js";

export const validar_Uid_nfc = async (req, res) => {
    const { uid_nfc } = req.params;
    console.log('UID NFC recibido para validación:', uid_nfc);
    try {
        const existeUid =  await verificacion_Uid_nfc(uid_nfc);
        if (existeUid) {
            res.status(200).json({ 
                status: 'ok',
                mensaje: 'UID NFC válido.' });
            console.log('UID NFC válido:', uid_nfc);
        } else {
            res.status(404).json({ 
                status: 'not_found',
                mensaje: 'UID NFC no encontrado O no autorizado' });
            console.log('UID NFC No válido:', uid_nfc);

        }
    } catch (error) {
        console.error('Error al validar UID NFC:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
};
