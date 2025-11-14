import {insert_new_justificante} from '../DB/querySql.js';

export const generar_justificante = async (req, res) => {
    // Expect body: { id_maestro, titulo, motivo, fecha }
    const { id_maestro, titulo, motivo, fecha } = req.body;
 try {
    const resultado = await insert_new_justificante(id_maestro, titulo, motivo, fecha);
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