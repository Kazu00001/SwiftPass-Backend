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
            'SELECT id_maestro, nombre FROM Maestros'
        );
        if (!teacherids || teacherids.length === 0) {
            console.log('No hay maestros registrados');
            return [];
        }

        // IDs de los maestros
        const maestrosIds = teacherids.map(t => t.id_maestro);

        // Construir placeholders para la cláusula IN de forma segura
        const placeholders = maestrosIds.map(() => '?').join(',');

        // Obtener fotos (una por maestro si existe)
        const [fotos] = await connection.execute(
            `SELECT id_record, src FROM Imagenes WHERE tabla_origen = ? AND id_record IN (${placeholders})`,
            ['Maestros', ...maestrosIds]
        );

        const [timeandstatus] = await connection.execute(
            `SELECT id_maestro, fecha, status FROM Registro_Asistencias WHERE id_maestro IN (${placeholders}) AND DATE(fecha) = CURDATE()`,
            [...maestrosIds]
        );

        // Mapas para acceso rápido
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
        const teacherData = teacherids.map(teacher => {
            const photo = fotoMap.get(teacher.id_maestro) || null;
            const attendance = attendanceMap.get(teacher.id_maestro) || null;

            return {
                id: teacher.id_maestro,
                name: teacher.nombre,
                photo,
                time: attendance ? formatTime(attendance.fecha) : null,
                status: attendance ? attendance.status : null
            };
        });

        return teacherData;
    } catch (error) {
        throw error;
    }
}; 
export const inset_new_teacher = async (nombre,correo,telefono,uid_nfc) => {
    //nombre, correo, telefono, foto (opcional)
    //segunda consulta para insertar nfc, id_maestro, uid
    try {
            const [saveTeacher] = await connection.execute(
            ' INSERT INTO Maestros(nombre, correo, telefono) VALUES(?,?,?)',[nombre, correo, telefono]
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
            'INSERT INTO `Justificantes(id_maestro, motivo, fecha) VALUES (?,?,?,?)',[id_maestro, motivo, fecha]
        )
        if(justificante.affectedRows > 0){
            return true 
        }else{
            return false
        }
    } catch (error) {
        
    }
}   



// Tarea programada para ejecutar diariamente a la medianoche
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
