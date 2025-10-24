import {teacher_list} from "../DB/querySql.js";

export const get_Teacher_list =  async (req, res) => {
    try {
        const teachers = await teacher_list();
        res.status(200).json({ 
            status: 'ok',
            teachers: teachers });
        console.log('Lista de maestros enviada correctamente');
    } catch (error) {
        console.error('Error al obtener la lista de maestros:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
};