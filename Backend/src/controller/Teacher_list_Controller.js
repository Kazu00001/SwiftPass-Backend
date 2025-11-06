import {teacher_list, attendance_data, getScheduleByTeacher, getListOfPermissionsAndJust} from "../DB/querySql.js";

export const get_Teacher_list =  async (req, res) => {
    try {
        const teachers = await teacher_list();
        res.status(200).json( teachers );
        console.log('Lista de maestros enviada correctamente');
    } catch (error) {
        console.error('Error al obtener la lista de maestros:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
};
export const get_Attendance_data =  async (req, res) => {
    const { id_maestro } = req.params;
    try {
        const attendance = await attendance_data(id_maestro);
        res.status(200).json({ 
            status: 'ok',
            attendance: attendance });
        console.log('Datos de asistencia enviados correctamente');
    } catch (error) {
        console.error('Error al obtener los datos de asistencia:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
};
export const schedule = async (req, res) => {
    const { id_maestro } = req.params;
    try {
        const scheduleData = await getScheduleByTeacher(id_maestro);
        res.status(200).json({ 
            status: 'ok',
            schedule: scheduleData });
        console.log('Horario enviado correctamente para el maestro ID:', id_maestro);
    } catch (error) {
        console.error('Error al obtener el horario del maestro:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
        
    }
}
export const get_Permissions_and_Justificantes = async (req, res) => {
    const { id_maestro } = req.params;
    try {
        const records = await getListOfPermissionsAndJust(id_maestro);
        res.status(200).json({ 
            status: 'ok',
            records: records });
        console.log('Permisos y justificantes enviados correctamente para el maestro ID:', id_maestro);
    } catch (error) {
        console.error('Error al obtener permisos y justificantes del maestro:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
        
    }
}   