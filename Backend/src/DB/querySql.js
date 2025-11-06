import connection from "./connection.js";
import cron from 'node-cron';

function formatTime(value) {
    if (!value) return null;
    const d = new Date(value);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}
export async function verificacion_Uid_nfc(uid_nfc) {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM NFC_Maestros WHERE uid =?',[uid_nfc]
        );
        if (rows.length > 0 ) {
            if(rows[0].acces === 1){
               const fecha = new Date();
            const [asistencia]= await connection.execute(
                "UPDATE Registro_Asistencias SET fecha_update = ?, status = ? WHERE id_maestro = ?",[fecha, 4, rows[0].id_maestro]
            );
            if(asistencia.affectedRows < 0){
                throw new Error('Error al registrar la asistencia.');
            }
            return true;
           }else{
            const [asistencia_denegada]= await connection.execute(
                "INSERT INTO Regristro_no_permitido( targeta_nfc, motivo) VALUES (?,?)", [uid_nfc, 'Acceso denegado por administrador']
            );
            return false;
           }
        } else {
              const [asistencia_denegada]= await connection.execute(
                "INSERT INTO Regristro_no_permitido( targeta_nfc, motivo) VALUES (?,?)", [uid_nfc, 'Targeta no registrada']
            );
            return false;
        }
    } catch (error) {
        throw error;
    }
};
export async function teacher_list(){
    try{
        const [teacherids] = await connection.execute(
            `SELECT 
            m.id_maestro, 
            m.nombre, 
            m.correo,
            m.departamento, 
            d.name 
            FROM Maestros m
            LEFT JOIN Departments d ON m.departamento = d.id_department`
        );
        if (!teacherids || teacherids.length === 0) {
            console.log('No hay maestros registrados');
            return [];
        }

        const maestrosIds = teacherids.map(t => t.id_maestro);

        const placeholders = maestrosIds.map(() => '?').join(',');

        const [fotos] = await connection.execute(
            `SELECT id_record, src FROM Imagenes WHERE tabla_origen = ? AND id_record IN (${placeholders})`,
            ['Maestros', ...maestrosIds]
        );

        const [timeandstatus] = await connection.execute(
            `SELECT id_maestro, fecha, status FROM Registro_Asistencias WHERE id_maestro IN (${placeholders}) AND DATE(fecha) = CURDATE()`,
            [...maestrosIds]
        );

        const [schedules] = await connection.execute(
            `SELECT s.id_schedule AS id_materia,
                    s.id_maestro,
                    m.nombre_materia,
                    s.salon,
                    DATE_FORMAT(s.start_time, '%H:%i') AS startTime,
                    DATE_FORMAT(s.end_time,   '%H:%i') AS endTime,
                    s.day_of_week
            FROM Schedules s
            JOIN Materias m ON m.id_materia = s.id_materia
            WHERE s.id_maestro IN (${placeholders})
            ORDER BY s.id_maestro, s.day_of_week, s.start_time`,
            [...maestrosIds]
        );
         if (!schedules || schedules.length === 0) {   
            console.log('No hay horarios registrados');
        }
        const scheduleMap = new Map();
        for (const s of schedules) {
            if (!scheduleMap.has(s.id_maestro)) scheduleMap.set(s.id_maestro, []);
            scheduleMap.get(s.id_maestro).push({
                id_materia: s.id_materia,
                id_maestro: s.id_maestro,
                nombre_materia: s.nombre_materia,
                salon: s.salon,
                startTime: s.startTime,
                endTime: s.endTime,
                day_of_week: s.day_of_week
            });
        }
        const fotoMap = new Map();
        for (const f of fotos) {
            if (!fotoMap.has(f.id_record)) fotoMap.set(f.id_record, f.src);
        }

        const attendanceMap = new Map();
        for (const a of timeandstatus) {
            const existing = attendanceMap.get(a.id_maestro);
            if (!existing || new Date(a.fecha) > new Date(existing.fecha)) {
                attendanceMap.set(a.id_maestro, { fecha: a.fecha, status: a.status });
            }
        }
        const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        const teacherData = teacherids.map(teacher => {
            const photo = fotoMap.get(teacher.id_maestro) || null;
            const attendance = attendanceMap.get(teacher.id_maestro) || null;
            const scheduleArr = scheduleMap.get(teacher.id_maestro) || [];

            // construir objeto por día
            const scheduleObj = {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: []
            };

            for (const s of scheduleArr) {
                const idx = (Number(s.day_of_week) || 1) - 1; 
                const dayKey = DAY_KEYS[idx] || 'monday';
                scheduleObj[dayKey].push({
                    id: s.id_materia,
                    id_maestro: s.id_maestro,
                    subject: s.nombre_materia,
                    location: s.salon,
                    startTime: s.startTime,
                    endTime: s.endTime
                });
            }

            return {
                id: teacher.id_maestro,
                name: teacher.nombre,
                photo,
                time: attendance ? formatTime(attendance.fecha) : null,
                status: attendance ? attendance.status : null,
                email: teacher.correo,
                department: teacher.name,
                schedule: scheduleObj
            };
        });

        return teacherData;
    } catch (error) {
        throw error;
    }
}; 
export const inset_new_teacher = async (nombre,correo,telefono,uid_nfc,departamento) => {
    //nombre, correo, telefono, foto (opcional)
    //segunda consulta para insertar nfc, id_maestro, uid
    try {
            const [saveTeacher] = await connection.execute(
            ' INSERT INTO Maestros(nombre, correo, telefono, departamento) VALUES(?,?,?,?)',[nombre, correo, telefono,departamento]
        );
        if(saveTeacher.affectedRows > 0){
            const [save_nfc] = await connection.execute(
                'INSERT INTO NFC_Maestros(id_maestro, uid, acces) VALUES (?,?,?)',[saveTeacher.insertId, uid_nfc, 0]
            );
            if(save_nfc.affectedRows > 0){
                return true;
            }else{
                return false;
            }
        }
    } catch (error) {
        return false;
        throw error;
    }
}
export const insert_new_permiso = async (id_maestro,nombre_permiso,descripcion, fecha_fin,fecha_inicio) => {
    try {
        const [permiso] = await connection.execute(
            'INSERT INTO Permisos(id_maestro, nombre_permiso, descripcion, fecha_inicio, fecha_fin) VALUES (?,?,?,?,?)'
            ,[id_maestro,nombre_permiso,descripcion, fecha_fin,fecha_inicio]);
            if(permiso.affectedRows > 0){
                return true;
            }else{
                return false;
            }   
    } catch (error) {
    }
}
export const insert_new_justificante = async (id_maestro, motivo, fecha) => {
    try {
        const [justificante] = await connection.execute(
            'INSERT INTO Justificantes (id_maestro, motivo, fecha) VALUES (?,?,?)',[id_maestro, motivo, fecha]
        )
        if(justificante.affectedRows > 0){
            return true 
        }else{
            return false
        }
    } catch (error) {
        
    }
}   


cron.schedule('0 0 * * *', async () => {
  const conn = await connection.getConnection();
  try {
    const insertSql = `
      INSERT INTO Registro_Asistencias (id_maestro, id_nfc, status, fecha_update)
      SELECT
        m.id_maestro,
        nfc.id_nfc,
        CASE WHEN p.aprobado = 1 THEN 2 ELSE 3 END AS status,
        NOW()
      FROM Maestros m
      INNER JOIN NFC_Maestros nfc ON m.id_maestro = nfc.id_maestro
      LEFT JOIN Permisos p
        ON p.id_maestro = m.id_maestro
        AND p.fecha_inicio <= CURDATE()
        AND p.fecha_fin >= CURDATE()
      WHERE NOT EXISTS (
        SELECT 1 FROM Registro_Asistencias r
        WHERE r.id_maestro = m.id_maestro AND DATE(r.fecha) = CURDATE()
      );
    `;
    await conn.execute(insertSql);
    console.log('Cron: insertadas asistencias faltantes (si las había).');
  } catch (err) {
    console.error('Error en cron de asistencias:', err);
  } finally {
    conn.release();
  }
}, {
  timezone: 'America/Mexico_City'
});

export async function getUser(username) {
    try {
        const [user] = await connection.execute(
            'SELECT * FROM Usuarios WHERE username = ?', [username]
        );
        if (user.length > 0) {
            return user[0];
        } else {
            return null;
        }
    } catch (error) {
        
    }
}
const setdateinformat = (value) => {
    if (!value) return null;
    const d = new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
export async function attendance_data(id_maestro) {
    try {
        const [rows] = await connection.execute(
            'SELECT fecha, status FROM Registro_Asistencias WHERE id_maestro = ? ORDER BY fecha DESC',
            [id_maestro]
        );
        if (!rows || rows.length === 0) return [];

        return rows.map(r => ({
            fecha: setdateinformat(r.fecha),
            estado: r.status
        }));
    } catch (error) {
        console.error('attendance_data error:', error);
        throw error;
    }
}
export async function getScheduleByTeacher(id_maestro) {
    try {
        // Query schedules for the given teacher
        const [schedules] = await connection.execute(
            `SELECT s.id_schedule AS id_materia,
                    s.id_maestro,
                    m.nombre_materia,
                    s.salon,
                    DATE_FORMAT(s.start_time, '%H:%i') AS startTime,
                    DATE_FORMAT(s.end_time,   '%H:%i') AS endTime,
                    s.day_of_week
            FROM Schedules s
            JOIN Materias m ON m.id_materia = s.id_materia
            WHERE s.id_maestro = ?
            ORDER BY s.day_of_week, s.start_time`,
            [id_maestro]
        );

        // Keys for days (DB stores 1..7)
        const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Initialize empty schedule object for the teacher
        const scheduleObj = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
        };

        // If no schedules, return empty object (easier for the client)
        if (!schedules || schedules.length === 0) {
            // console.log('No hay horarios registrados');
            return scheduleObj;
        }

        // Fill scheduleObj grouping by day_of_week
        for (const s of schedules) {
            const idx = (Number(s.day_of_week) || 1) - 1; // map 1..7 to 0..6
            const dayKey = DAY_KEYS[idx] || 'monday';
            scheduleObj[dayKey].push({
                id: s.id_materia,
                id_maestro: s.id_maestro,
                subject: s.nombre_materia,
                location: s.salon,
                startTime: s.startTime,
                endTime: s.endTime,
                day_of_week: s.day_of_week
            });
        }

        return scheduleObj;
    } catch (error) {
        console.error('getScheduleByTeacher error:', error);
        throw error;
    }
}
export async function getListOfPermissionsAndJust(id_maestro) {
    try {
        // Obtener permisos
        const [permisos] = await connection.execute(
            `SELECT id_permiso, id_maestro, nombre_permiso, descripcion, fecha_inicio, fecha_fin, aprobado
             FROM Permisos WHERE id_maestro = ?`,
            [id_maestro]
        );

        // Obtener justificantes
        const [justificantes] = await connection.execute(
            `SELECT id_justificante, id_maestro, motivo, fecha, autorizado FROM Justificantes WHERE id_maestro = ?`,
            [id_maestro]
        );

        const results = [];

        // permisos: status = 2
        for (const p of permisos) {
            results.push({
                id: p.id_permiso,
                date: setdateinformat(p.fecha_inicio) || null,
                status: 2,
                type: 'permiso',
                title: p.nombre_permiso,
                description: p.descripcion,
                fecha_fin: setdateinformat(p.fecha_fin) || null,
                autorizado: p.autorizado
            });
        }

        // justificantes: status = 1
        for (const j of justificantes) {
            results.push({
                id: j.id_justificante,
                date: setdateinformat(j.fecha) || null,
                status: 1,
                type: 'justificante',
                motivo: j.motivo,
                autorizado: j.autorizado
            });
        }

        // ordenar por fecha descendente
        results.sort((a, b) => {
            const da = a.date || '';
            const db = b.date || '';
            return db.localeCompare(da);
        });

        return results;
    } catch (error) {
        console.error('getListOfPermissionsAndJust error:', error);
        throw error;
    }
}