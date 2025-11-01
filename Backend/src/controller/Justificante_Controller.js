import {insert_new_justificante} from '../DB/querySql.js';

export const generar_justificante = async (req, res) => {
    const { id_maestro, motivo, fecha_inicio, fecha_fin } = req.body;
 try {
    const resultado = await insert_new_justificante(id_maestro, motivo, fecha_inicio, fecha_fin);
    if (resultado) {
        res.status(201).json({ 
            status: 'ok',
            mensaje: 'Justificante generado correctamente.' });
        console.log('Justificante generado para el maestro ID:', id_maestro);
    } else {
        res.status(400).json({ 
            status: 'error',
            mensaje: 'No se pudo generar el justificante.' });
        console.log('Fallo al generar el justificante para el maestro ID:', id_maestro);
    }   
    
 } catch (error) {
    
 }

};