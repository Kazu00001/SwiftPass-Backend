import connection from "./connection.js";
import cron from 'node-cron';

function formatTime(value) {
    if (!value) return null;

    // If it's already a time string like 'HH:MM' or 'HH:MM:SS', return HH:MM
    if (typeof value === 'string') {
        const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (timeMatch) {
            const hh = String(timeMatch[1]).padStart(2, '0');
            const mm = timeMatch[2];
            return `${hh}:${mm}`;
        }
        // If it's a full datetime string, try to parse it
        const dTry = new Date(value);
        if (!isNaN(dTry.getTime())) {
            const hh = String(dTry.getHours()).padStart(2, '0');
            const mm = String(dTry.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
        }
        return null;
    }

    // If it's a Date object or timestamp
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
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
                        const [asistencia] = await connection.execute(
                                `UPDATE Registro_Asistencias SET fecha_update = ?, status = ?
                                 WHERE id_asistencia = (
                                     SELECT id_asistencia FROM (
                                         SELECT id_asistencia FROM Registro_Asistencias
                                         WHERE id_maestro = ?
                                         ORDER BY fecha DESC LIMIT 1
                                     ) x
                                 )`,
                                [fecha, 4, rows[0].id_maestro]
                        );
                        if (!asistencia || asistencia.affectedRows === 0) {
                                throw new Error('Error al registrar la asistencia (no se encontró registro reciente).');
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
             LEFT JOIN Departments d ON m.departamento = d.id_department
             INNER JOIN Usuarios u ON u.id_maestro = m.id_maestro
             WHERE u.rol = 'maestro'`
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

                // Traer sólo el registro más reciente por maestro para el día de hoy.
                // Usamos una subconsulta que obtiene MAX(fecha) por id_maestro y la join-eamos
                // para recuperar fecha_update y status del registro más reciente.
                const [timeandstatus] = await connection.execute(
                        `SELECT r.id_maestro, r.fecha_update AS fecha, r.status
                         FROM Registro_Asistencias r
                         INNER JOIN (
                             SELECT id_maestro, MAX(fecha) AS max_fecha
                             FROM Registro_Asistencias
                             WHERE DATE(fecha) = CURDATE() AND id_maestro IN (${placeholders})
                             GROUP BY id_maestro
             ) recent ON recent.id_maestro = r.id_maestro AND recent.max_fecha = r.fecha`,
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
export const teacher_ausent = async () => {
    try {
        // Obtener el registro más reciente por maestro para el día de hoy y filtrar ausentes (status = 3)
        const [ausentes] = await connection.execute(
            `SELECT r.id_maestro, m.nombre AS name, i.src AS photo, r.fecha_update, r.status
             FROM Registro_Asistencias r
             INNER JOIN (
               SELECT id_maestro, MAX(fecha) AS max_fecha
               FROM Registro_Asistencias
               WHERE DATE(fecha) = CURDATE()
               GROUP BY id_maestro
             ) recent ON recent.id_maestro = r.id_maestro AND recent.max_fecha = r.fecha
             JOIN Maestros m ON m.id_maestro = r.id_maestro
             LEFT JOIN Imagenes i ON i.tabla_origen = 'Maestros' AND i.id_record = m.id_maestro
             JOIN Usuarios u ON u.id_maestro = m.id_maestro
             WHERE u.rol = 'maestro' AND r.status = 3
             ORDER BY m.nombre`);

        if (!ausentes || ausentes.length === 0) return [];

        return ausentes.map(a => ({
            id: `T${String(a.id_maestro).padStart(3, '0')}`,
            name: a.name,
            photo: a.photo || null,
            time: formatTime(a.fecha_update),
            status: a.status
        }));
        
    } catch (error) {
        console.error('teacher_ausent error:', error);
        throw error;
    }
}
export const pendientes_justificantesyJustificantes= async () => { 
    try {
        // permisos pendientes (aprobado = 0)
        const [permisos] = await connection.execute(
            `SELECT p.id_permiso, p.hora_regristro, p.id_maestro, m.nombre AS name,
                    im_maestro.src AS maestro_photo,
                    ip.src AS record_photo,
                    p.nombre_permiso, p.descripcion, p.aprobado, p.fecha_inicio, p.fecha_fin
             FROM Permisos p
             JOIN Maestros m ON m.id_maestro = p.id_maestro
             LEFT JOIN Usuarios u ON u.id_maestro = m.id_maestro
             LEFT JOIN Imagenes im_maestro ON im_maestro.tabla_origen = 'Maestros' AND im_maestro.id_record = m.id_maestro
             LEFT JOIN Imagenes ip ON ip.tabla_origen = 'Permisos' AND ip.id_record = p.id_permiso
             WHERE p.aprobado = 0 AND u.rol = 'maestro'`
        );

        // justificantes pendientes (autorizado = 0)
        const [justificantes] = await connection.execute(
        `SELECT j.id_justificante, j.id_maestro, j.titulo, m.nombre AS name,
            im_maestro.src AS maestro_photo,
            ij.src AS record_photo,
            j.motivo, j.fecha, j.autorizado
             FROM Justificantes j
             JOIN Maestros m ON m.id_maestro = j.id_maestro
             LEFT JOIN Usuarios u ON u.id_maestro = m.id_maestro
             LEFT JOIN Imagenes im_maestro ON im_maestro.tabla_origen = 'Maestros' AND im_maestro.id_record = m.id_maestro
             LEFT JOIN Imagenes ij ON ij.tabla_origen = 'Justificantes' AND ij.id_record = j.id_justificante
             WHERE j.autorizado = 0 AND u.rol = 'maestro'`
        );

        const permisosMapped = (permisos || []).map(p => ({
            id: `H${String(p.id_permiso).padStart(4, '0')}`,
            name: p.name,
            photo: p.maestro_photo || null,
            // try hora_regristro (if exists), otherwise fallback to fecha_inicio
            time: formatTime(p.hora_regristro) || formatTime(p.fecha_inicio) || null,
            status: 2,
            recordId: p.id_permiso,
            recordType: 'Permiso',
            // detalle extra del permiso
            details: {
                nombre_permiso: p.nombre_permiso,
                descripcion: p.descripcion,
                aprobado: p.aprobado,
                fecha_inicio: setdateinformat(p.fecha_inicio) || null,
                fecha_fin: setdateinformat(p.fecha_fin) || null,
                hora_regristro: p.hora_regristro ? formatTime(p.hora_regristro) : null,
                recordPhoto: p.record_photo || null
            }
        }));

        const justificantesMapped = (justificantes || []).map(j => ({
            id: `C${String(j.id_justificante).padStart(3, '0')}`,
            name: j.name,
            photo: j.maestro_photo || null,
            time: j.fecha ? formatTime(j.fecha) : null,
            status: 1,
            recordId: j.id_justificante,
            recordType: 'Justificante',
            details: {
                titulo: j.titulo || null,
                motivo: j.motivo,
                fecha: j.fecha ? setdateinformat(j.fecha) : null,
                autorizado: j.autorizado,
                recordPhoto: j.record_photo || null
            }
        }));

        const combined = [...permisosMapped, ...justificantesMapped];

        return combined;
    } catch (error) {
        console.error('pendientes_u_apro_justificantesyJustificantes error:', error);
        throw error;
    }
}
//create search Modal

export const pendientes_u_apro_justificantesyJustificantes = async () => {
    try {
        // permisos
        const [permisos] = await connection.execute(
          `SELECT p.id_permiso, p.hora_regristro, p.id_maestro, m.nombre AS name, i.src AS photo, p.fecha_inicio, p.aprobado,
                ip.src AS permiso_photo
           FROM Permisos p
           JOIN Maestros m ON m.id_maestro = p.id_maestro
           LEFT JOIN Imagenes i ON i.tabla_origen = 'Maestros' AND i.id_record = m.id_maestro
           LEFT JOIN Imagenes ip ON ip.tabla_origen = 'Permisos' AND ip.id_record = p.id_permiso
           JOIN Usuarios u ON u.id_maestro = m.id_maestro
           WHERE u.rol = 'maestro'`
        );

        // justificantes
        const [justificantes] = await connection.execute(
        `SELECT j.id_justificante, j.id_maestro, j.titulo, m.nombre AS name, i.src AS photo, j.fecha, j.autorizado,
            ij.src AS justificante_photo, j.motivo
           FROM Justificantes j
           JOIN Maestros m ON m.id_maestro = j.id_maestro
           LEFT JOIN Imagenes i ON i.tabla_origen = 'Maestros' AND i.id_record = m.id_maestro
           LEFT JOIN Imagenes ij ON ij.tabla_origen = 'Justificantes' AND ij.id_record = j.id_justificante
           JOIN Usuarios u ON u.id_maestro = m.id_maestro
           WHERE u.rol = 'maestro'`
        );

        const permisosMapped = (permisos || []).map(p => ({
            id: `P${String(p.id_permiso).padStart(3, '0')}`,
            name: p.name,
            photo: p.photo || null,
            time: formatTime(p.hora_regristro) || formatTime(p.fecha_inicio) || null,
            status: 2,
            date: setdateinformat(p.fecha_inicio) || null,
            isPending: p.aprobado == 1 ? false : true,
            recordId: p.id_permiso,
            recordType: 'permiso',
            recordPhoto: p.permiso_photo || null
        }));

        const justificantesMapped = (justificantes || []).map(j => ({
            id: `J${String(j.id_justificante).padStart(3, '0')}`,
            name: j.name,
            photo: j.photo || null,
            time: j.fecha ? formatTime(j.fecha) : null,
            status: 1,
            date: setdateinformat(j.fecha) || null,
            isPending: j.autorizado == 1 ? false : true,
            recordId: j.id_justificante,
            recordType: 'justificante',
            recordPhoto: j.justificante_photo || null,
            title: j.titulo || null,
            motivo: j.motivo || null
        }));

        const combined = [...permisosMapped, ...justificantesMapped];

        // Ordenar por fecha ascendente (más antiguo primero). Fechas nulas al final. Empate por nombre.
        combined.sort((a, b) => {
            const da = a.date || null;
            const db = b.date || null;
            if (da && db) {
                const cmp = da.localeCompare(db);
                if (cmp !== 0) return cmp;
            } else if (da && !db) {
                return -1;
            } else if (!da && db) {
                return 1;
            }
            return (a.name || '').localeCompare(b.name || '');
        });

        return combined;
    } catch (error) {
        console.error('pendientes_u_apro_justificantesyJustificantes error:', error);
        throw error;
    }
};

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
export const insert_new_justificante = async (id_maestro, titulo, motivo, fecha) => {
    try {
        const [result] = await connection.execute(
            'INSERT INTO Justificantes (id_maestro, titulo, motivo, fecha) VALUES (?,?,?,?)',[id_maestro, titulo, motivo, fecha]
        );
        // devolver el id insertado para poder asociar imágenes
        if (result && result.insertId) return result.insertId;
        return null;
    } catch (error) {
        console.error('insert_new_justificante error:', error);
        throw error;
    }
}

export const insertImage = async (tabla_origen, id_record, src) => {
    try {
        const [result] = await connection.execute(
            'INSERT INTO Imagenes (tabla_origen, id_record, src) VALUES (?, ?, ?)',
            [tabla_origen, id_record, src]
        );
        if (result && result.insertId) return result.insertId;
        return null;
    } catch (error) {
        console.error('insertImage error:', error);
        throw error;
    }
}


cron.schedule('0 0 * * *', async () => {
  const conn = await connection.getConnection();
    try {
        // Insert only for teachers who have at least one scheduled class today.
        // NOTE: assumes `Schedules.day_of_week` uses 1=Monday .. 7=Sunday.
        const insertSql = `
            INSERT INTO Registro_Asistencias (id_maestro, id_nfc, status, fecha_update)
            SELECT DISTINCT
                m.id_maestro,
                nfc.id_nfc,
                CASE WHEN p.aprobado = 1 THEN 2 ELSE 3 END AS status,
                NOW()
            FROM Maestros m
            INNER JOIN NFC_Maestros nfc ON m.id_maestro = nfc.id_maestro
            -- join schedules for the current weekday (WEEKDAY + 1 -> 1=Monday..7=Sunday)
            INNER JOIN Schedules s ON s.id_maestro = m.id_maestro AND s.day_of_week = (WEEKDAY(CURDATE()) + 1)
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
        console.log('Cron: insertadas asistencias faltantes (solo para profesores con clase hoy).');
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
            `SELECT p.id_permiso, p.id_maestro, p.nombre_permiso, p.descripcion, p.fecha_inicio, p.fecha_fin, p.aprobado,
                    ip.src AS permiso_photo
             FROM Permisos p
             LEFT JOIN Imagenes ip ON ip.tabla_origen = 'Permisos' AND ip.id_record = p.id_permiso
             WHERE p.id_maestro = ?`,
            [id_maestro]
        );

        // Obtener justificantes
        const [justificantes] = await connection.execute(
            `SELECT j.id_justificante, j.id_maestro, j.titulo, j.motivo, j.fecha, j.autorizado,
                    ij.src AS justificante_photo
             FROM Justificantes j
             LEFT JOIN Imagenes ij ON ij.tabla_origen = 'Justificantes' AND ij.id_record = j.id_justificante
             WHERE j.id_maestro = ?`,
            [id_maestro]
        );

        const results = [];

        // permisos: status = 2
        for (const p of permisos) {
            results.push({
                id:`P${String(p.id_permiso).padStart(3, '0')}`,
                date: setdateinformat(p.fecha_inicio) || null,
                status: 2,
                type: 'permiso',
                title: p.nombre_permiso,
                description: p.descripcion,
                fecha_fin: setdateinformat(p.fecha_fin) || null,
                autorizado: p.autorizado,
                recordPhoto: p.permiso_photo || null
            });
        }

        // justificantes: status = 1
        for (const j of justificantes) {
            results.push({
                id: `J${String(j.id_justificante).padStart(3, '0')}`,
                date: setdateinformat(j.fecha) || null,
                status: 1,
                type: 'justificante',
                titulo: j.titulo || null,
                motivo: j.motivo,
                autorizado: j.autorizado,
                recordPhoto: j.justificante_photo || null
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

// Obtener la ruta/registro de imagen asociada a un maestro (si existe)
export async function getImageForTeacher(id_maestro) {
    try {
        const [rows] = await connection.execute(
            `SELECT src FROM Imagenes WHERE tabla_origen = 'Maestros' AND id_record = ? LIMIT 1`,
            [id_maestro]
        );
        if (rows && rows.length > 0) return rows[0].src || null;
        return null;
    } catch (error) {
        console.error('getImageForTeacher error:', error);
        throw error;
    }
}
export const list_permisos_and_justificantes = async (id_maestro) => {
    try {
        // info maestro
        const [info_maestro] = await connection.execute(
            `SELECT nombre, departamento FROM Maestros WHERE id_maestro = ?`,
            [id_maestro]
        );

        // photo (opcional)
        const [fotos] = await connection.execute(
            `SELECT src FROM Imagenes WHERE tabla_origen = ? AND id_record = ? LIMIT 1`,
            ['Maestros', id_maestro]
        );
        const photo = fotos && fotos.length ? fotos[0].src : null;

        // permisos
        const [permisos] = await connection.execute(
            `SELECT id_permiso, id_maestro, nombre_permiso, descripcion, fecha_inicio, fecha_fin, aprobado
             FROM Permisos WHERE id_maestro = ?`,
            [id_maestro]
        );

        // justificantes
        const [justificantes] = await connection.execute(
            `SELECT j.id_justificante, j.id_maestro, j.titulo, j.motivo, j.fecha, j.autorizado,
                    ij.src AS justificante_photo
             FROM Justificantes j
             LEFT JOIN Imagenes ij ON ij.tabla_origen = 'Justificantes' AND ij.id_record = j.id_justificante
             WHERE j.id_maestro = ?`,
            [id_maestro]
        );

        // construir lista unificada
        const items = [];
        for (const p of permisos) {
            items.push({
                id: `P${String(p.id_permiso).padStart(3, '0')}`,
                type: 'permiso',
                title: p.nombre_permiso,
                description: p.descripcion,
                fecha_inicio: setdateinformat(p.fecha_inicio),
                aprobado: p.aprobado ? 1 : 0
            });
        }
        for (const j of justificantes) {
            items.push({
                id: `J${String(j.id_justificante).padStart(3, '0')}`,
                type: 'justificante',
                titulo: j.titulo || null,
                motivo: j.motivo,
                fecha: setdateinformat(j.fecha),
                autorizado: j.autorizado ? 1 : 0,
                recordPhoto: j.justificante_photo || null
            });
        }

        // resumen/flags
        const anyAutorizado = items.some(i => (i.aprobado && i.aprobado === 1) || (i.autorizado && i.autorizado === 1)) ? 1 : 0;

        const teacher = info_maestro && info_maestro.length ? info_maestro[0] : { nombre: null, departamento: null };

        return {
            id: `T${String(id_maestro).padStart(3, '0')}`,
            name: teacher.nombre,
            photo,
            autorizado: anyAutorizado,
            records: items,
                // lista plana con la estructura compacta solicitada (se repite la info del maestro por cada registro)
                list: (() => {
                    const flat = [];
                    // Use stable teacher id format 'T###' without random suffix so components can reuse it predictably
                    const teacherId = `T${String(id_maestro).padStart(3, '0')}`;
                    // agregar permisos (status = 2)
                    for (const p of permisos) {
                        const timeVal = p.fecha_inicio ? formatTime(new Date(p.fecha_inicio)) : null;
                        flat.push({
                            id: `P${String(p.id_permiso).padStart(3, '0')}`,
                            name: teacher.nombre,
                            photo,
                            time: timeVal,
                            status: 2
                        });
                    }
                    // agregar justificantes (status = 1)
                    for (const j of justificantes) {
                        const timeVal = j.fecha ? formatTime(new Date(j.fecha)) : null;
                        flat.push({
                            id: `J${String(j.id_justificante).padStart(3, '0')}`,
                            name: teacher.nombre,
                            photo,
                            time: timeVal,
                            status: 1
                        });
                    }
                    return flat;
                })()
        };
    } catch (error) {
        console.error('list_permisos_and_justificantes error:', error);
        throw error;
    }
};
export async function UpdateDayProfileAdmin (id_maestro, date, status) {
    try {
        // Validar parámetros recibidos
        if (typeof id_maestro === 'undefined' || !id_maestro) throw new Error('id_maestro is required');
        if (typeof date === 'undefined' || !date) throw new Error('date is required (YYYY-MM-DD)');
        if (typeof status === 'undefined' || status === null) throw new Error('status is required');

        // Construir rango para el día (start inclusive, end exclusive)
        const start = `${date} 00:00:00`;
        const nextDay = new Date(date + 'T00:00:00');
        nextDay.setDate(nextDay.getDate() + 1);
        const end = `${nextDay.getFullYear()}-${String(nextDay.getMonth()+1).padStart(2,'0')}-${String(nextDay.getDate()).padStart(2,'0')} 00:00:00`;

        const [result] = await connection.execute(
            `UPDATE Registro_Asistencias
             SET status = ?, fecha_update = ?
             WHERE id_asistencia = (
               SELECT id_asistencia FROM (
                 SELECT id_asistencia FROM Registro_Asistencias
                 WHERE id_maestro = ? AND fecha >= ? AND fecha < ?
                 ORDER BY fecha DESC LIMIT 1
               ) x
             )`,
            [status, new Date(), id_maestro, start, end]
        );

        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }

}

// Report data: obtener asistencias, permisos y justificantes en un rango de fechas
export async function getReportData(startDate, endDate, id_maestro = null) {
    try {
        const params = [];
        let whereTeacher = '';
        if (id_maestro) {
            whereTeacher = ' AND r.id_maestro = ?';
            params.push(id_maestro);
        }

        // Asistencias / inasistencias
        const [asistencias] = await connection.execute(
            `SELECT r.id_asistencia, r.id_maestro, r.id_nfc, r.status, r.fecha, m.nombre AS nombre_maestro
             FROM Registro_Asistencias r
             JOIN Maestros m ON m.id_maestro = r.id_maestro
             WHERE DATE(r.fecha) BETWEEN ? AND ? ${whereTeacher}
             ORDER BY r.id_maestro, r.fecha`,
            [startDate, endDate, ...params]
        );

        // Permisos en rango
        const [permisos] = await connection.execute(
            `SELECT p.id_permiso, p.id_maestro, p.nombre_permiso, p.descripcion, p.fecha_inicio, p.fecha_fin, p.aprobado, m.nombre as nombre_maestro,
                    ip.src AS permiso_photo
             FROM Permisos p
             JOIN Maestros m ON m.id_maestro = p.id_maestro
             LEFT JOIN Imagenes ip ON ip.tabla_origen = 'Permisos' AND ip.id_record = p.id_permiso
             WHERE (DATE(p.fecha_inicio) BETWEEN ? AND ?) OR (DATE(p.fecha_fin) BETWEEN ? AND ?)
             ${id_maestro ? ' AND p.id_maestro = ?' : ''}
             ORDER BY p.id_maestro, p.fecha_inicio`,
            id_maestro ? [startDate, endDate, startDate, endDate, id_maestro] : [startDate, endDate, startDate, endDate]
        );

        // Justificantes en rango
        const [justificantes] = await connection.execute(
            `SELECT j.id_justificante, j.id_maestro, j.titulo, j.motivo, j.fecha, j.autorizado, m.nombre as nombre_maestro,
                    ij.src AS justificante_photo
             FROM Justificantes j
             JOIN Maestros m ON m.id_maestro = j.id_maestro
             LEFT JOIN Imagenes ij ON ij.tabla_origen = 'Justificantes' AND ij.id_record = j.id_justificante
             WHERE DATE(j.fecha) BETWEEN ? AND ? ${id_maestro ? ' AND j.id_maestro = ?' : ''}
             ORDER BY j.id_maestro, j.fecha`,
            id_maestro ? [startDate, endDate, id_maestro] : [startDate, endDate]
        );

        return { asistencias, permisos, justificantes };
    } catch (error) {
        console.error('getReportData error:', error);
        throw error;
    }
}

export const estadistica_asistencias = async (teacher_id) => {
    try {
        const [stats_justifcantes] = await connection.execute('SELECT * FROM Registro_Asistencias WHERE id_maestro = ? AND status = ?;', [teacher_id, 1]);
        const [stats_permisos] = await connection.execute('SELECT * FROM Registro_Asistencias WHERE id_maestro = ? AND status = ?;', [teacher_id, 2]);
        const [stats_asistencias] = await connection.execute('SELECT * FROM Registro_Asistencias WHERE id_maestro = ? AND status = ?;', [teacher_id, 4]);
        const [stats_faltas] = await connection.execute('SELECT * FROM Registro_Asistencias WHERE id_maestro = ? AND status = ?;', [teacher_id, 3]);
        const [stats_retardo] = await connection.execute('SELECT * FROM Registro_Asistencias WHERE id_maestro = ? AND status = ?;', [teacher_id, 5]);
        const data = [
        // 13 asistencias (3)
        ...Array(stats_faltas.length).fill({ status: 3 }),
        // 3 faltas (4)
        ...Array(stats_asistencias.length).fill({ status: 4 }),
        // 4 retardos (5)
        ...Array(stats_retardo.length).fill({ status: 5 }),
        // 2 justificados (1)
        ...Array(stats_justifcantes.length).fill({ status: 1 }),
        // 3 permisos (2)
        ...Array(stats_permisos.length).fill({ status: 2 }),
        ];
        return data;
    } catch (error) {
        throw error;
    }
}
export const update_aprove_status = async (record_type, record_id, approve_status) => {
    try {
        let tableName = '';
        let statusField = '';
        if (record_type === 'permiso') {
            tableName = 'Permisos';
            statusField = 'aprobado';
        } else if (record_type === 'justificante') {
            tableName = 'Justificantes';
            statusField = 'autorizado';
        } else {
            throw new Error('Invalid record type');
        }

        const [result] = await connection.execute(
            `UPDATE ${tableName} SET ${statusField} = ? WHERE ${tableName === 'Permisos' ? 'id_permiso' : 'id_justificante'} = ?`,
            [approve_status, record_id]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('update_aprove_status error:', error);
        throw error;
    }   
}
