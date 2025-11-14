import {teacher_list, attendance_data, getScheduleByTeacher, getListOfPermissionsAndJust,UpdateDayProfileAdmin, list_permisos_and_justificantes,
    estadistica_asistencias, teacher_ausent, pendientes_justificantesyJustificantes, pendientes_u_apro_justificantesyJustificantes, update_aprove_status} from "../DB/querySql.js";

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
export const listar_permisos_y_justificantes = async (req, res) => {
    const { id_maestro } = req.params;
    try {
        const records = await list_permisos_and_justificantes(id_maestro);
        res.status(200).json({ 
            status: 'ok',
            records: records });
        console.log('Listado de permisos y justificantes enviado correctamente para el maestro ID:', id_maestro);
    } catch (error) {
        console.error('Error al listar permisos y justificantes del maestro:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
        
    }
}   

export const estadisticaAsistencias = async (req, res) => {
    const { id_maestro } = req.params;
    try {
        const stats = await estadistica_asistencias(id_maestro);
        res.status(200).json({ 
            status: 'ok',
            statistics: stats });
        console.log('Estadísticas de asistencias enviadas correctamente para el maestro ID:', id_maestro);
    } catch (error) {
        console.error('Error al obtener estadísticas de asistencias del maestro:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
        
    }
}   
export const teacherAusent = async (req, res) => {  

    try {
        const ausentes = await teacher_ausent();
        res.status(200).json({ 
            status: 'ok',
            ausentes: ausentes });
        console.log('Lista de maestros ausentes enviada correctamente');
        
    } catch (error) {
        console.error('Error al obtener la lista de maestros ausentes:', error);
        res.status(500).json({ mensaje: 'Error del servidor.' });
        
    }
}
export const pendientesJus_Per = async(req,res) =>{
    try {
        const pendientes= await pendientes_justificantesyJustificantes();
        res.status(200).json({
            status: 'ok',
            pendientes: pendientes
        })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
}
export const pendientesUaproJus_Per = async(req,res) =>{
    try {
        const pendientes= await pendientes_u_apro_justificantesyJustificantes();
        res.status(200).json({
            status: 'ok',
            pendientes: pendientes
        })
    } catch (error) {
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
}   

export const updateRecordApproval = async (req, res) => {
    // Expect body: { id_record, type, teacher_id, approve_status }
    const { id_record, type, teacher_id, approve_status } = req.body;
    if (!id_record || !type) {
        return res.status(400).json({ status: 'error', mensaje: 'Faltan id_record o type en el body.' });
    }
    // normalize type
    const recordType = String(type).toLowerCase();
    if (recordType !== 'permiso' && recordType !== 'justificante') {
        return res.status(400).json({ status: 'error', mensaje: 'type debe ser "permiso" o "justificante".' });
    }
    const approved = typeof approve_status !== 'undefined' ? approve_status : 1;
    try {
        const ok = await update_aprove_status(recordType, id_record, approved);
        if (!ok) {
            return res.status(404).json({ status: 'error', mensaje: 'Registro no encontrado o no actualizado.' });
        }

        // devolver listado actualizado del maestro si se proporcionó teacher_id
        if (teacher_id) {
            const records = await getListOfPermissionsAndJust(teacher_id);
            return res.status(200).json({ status: 'ok', mensaje: 'Estado actualizado.', records });
        }

        return res.status(200).json({ status: 'ok', mensaje: 'Estado actualizado.' });
    } catch (error) {
        console.error('updateRecordApproval error:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error del servidor.' });
    }
}