import {insert_new_permiso, insertImage} from '../DB/querySql.js';

export const generar_permisos = async (req, res) => {
    const { id_maestro, motivo, fecha_inicio, fecha_fin } = req.body;
    try {
        // Insertar permiso y obtener id insertado
        const insertId = await insert_new_permiso(id_maestro, motivo, fecha_inicio, fecha_fin);
        if (!insertId) {
            return res.status(400).json({ status: 'error', mensaje: 'No se pudo generar el permiso.' });
        }

        let savedSrc = null;
        // Si llegó un archivo vía multer, asociarlo en Imagenes
        if (req.file) {
            try {
                const filename = req.file.filename;
                // Guardamos la ruta relativa para portabilidad
                const src = `/images/${filename}`;
                await insertImage('Permisos', insertId, src);
                savedSrc = src;
            } catch (err) {
                console.error('Error guardando imagen de permiso en Imagenes:', err);
            }
        }

        res.status(201).json({
            status: 'ok',
            mensaje: 'Permiso generado correctamente.',
            id_permiso: insertId,
            image: savedSrc
        });
        console.log('Permiso generado para el maestro ID:', id_maestro, 'ID permiso:', insertId);
    } catch (error) {
        console.error('Error al generar el permiso:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
}