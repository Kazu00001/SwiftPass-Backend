import {teacher_list, attendance_data, getScheduleByTeacher, getListOfPermissionsAndJust,UpdateDayProfileAdmin} from "../DB/querySql.js";

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

export const update_Day_Profile_Admin = async (req, res) => {
    const { teacherId, date, status } = req.body;
    console.log('Datos recibidos para actualizar el perfil del día:', req.body);
    // Validar parámetros básicos
    if (typeof teacherId === 'undefined' || !teacherId) {
        return res.status(400).json({ status: 'error', mensaje: 'Falta id_maestro en el body.' });
    }
    if (typeof date === 'undefined' || !date) {
        return res.status(400).json({ status: 'error', mensaje: 'Falta date en el body. Formato esperado: YYYY-MM-DD' });
    }
    if (typeof status === 'undefined' || status === null) {
        return res.status(400).json({ status: 'error', mensaje: 'Falta status en el body.' });
    }
    try {
        const resultado = await UpdateDayProfileAdmin(teacherId, date, status);
        if (resultado) {
            res.status(200).json({ 
                status: 'ok',
                mensaje: 'Perfil del día actualizado correctamente.' });
            console.log('Perfil del día actualizado para el maestro ID:', teacherId, 'Fecha:', date);
        } else {
            res.status(400).json({ 
                status: 'error',
                mensaje: 'No se pudo actualizar el perfil del día.' });
            console.log('Fallo al actualizar el perfil del día para el maestro ID:', id_maestro, 'Fecha:', date);
        }   
    } catch (error) {
        console.error('Error al actualizar el perfil del día del maestro:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
}