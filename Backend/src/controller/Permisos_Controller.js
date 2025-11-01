import {insert_new_permiso} from '../DB/querySql.js';

export const generar_permisos = async (req, res) => {
    const { id_maestro, motivo, fecha_inicio, fecha_fin } = req.body;
 try {
    const resultado = await insert_new_permiso(id_maestro, motivo, fecha_inicio, fecha_fin);
    if (resultado) {
        res.status(201).json({ 
            status: 'ok',
            mensaje: 'Permiso generado correctamente.' });
        console.log('Permiso generado para el maestro ID:', id_maestro);
    } else {
        res.status(400).json({ 
            status: 'error',
            mensaje: 'No se pudo generar el permiso.' });
        console.log('Fallo al generar el permiso para el maestro ID:', id_maestro);
    }   
    
 } catch (error) {
    console.error('Error al generar el permiso:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
 }

}