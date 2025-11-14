import {insert_new_justificante, insertImage} from '../DB/querySql.js';

export const generar_justificante = async (req, res) => {
    // Expect body: { id_maestro, titulo, motivo, fecha } and optional file in req.file
    const { id_maestro, titulo, motivo, fecha } = req.body;
    try {
        const insertId = await insert_new_justificante(id_maestro, titulo, motivo, fecha);
        if (!insertId) {
            return res.status(400).json({ status: 'error', mensaje: 'No se pudo generar el justificante.' });
        }

        let savedSrc = null;
        // si llegó un archivo, insertar en Imagenes y construir la URL pública
        if (req.file) {
            const filename = req.file.filename; // ya guardado por multer
            const src = `${req.protocol}://${req.get('host')}/images/${filename}`;
            try {
                await insertImage('Justificantes', insertId, src);
                savedSrc = src;
            } catch (err) {
                console.error('Error guardando imagen en Imagenes:', err);
            }
        }

        res.status(201).json({ 
            status: 'ok',
            mensaje: 'Justificante generado correctamente.',
            id_justificante: insertId,
            image: savedSrc
        });
        console.log('Justificante generado para el maestro ID:', id_maestro, 'ID:', insertId);
    } catch (error) {
        console.error('generar_justificante error:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error del servidor.' });
    }
};