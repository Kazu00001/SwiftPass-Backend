import connection from "./connection.js";

export async function verificacion_Uid_nfc(uid_nfc) {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM NFC_Maestros WHERE uid =?',[uid_nfc]
        );
        if (rows.length > 0 ) {
            if(rows[0].acces === 1){
               const fecha = new Date();
            const [asistencia]= await connection.execute(
                "UPDATE Registro_Asistencias SET fecha = ?, status = ? WHERE id_maestro = ?",[fecha, 4, rows[0].id_maestro]

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
            'SELECT id_maestro FROM Maestros'
        );
        if(teacherids.length <= 0){ console.log("No hay maestros registrados"); }
        return teacherids;
    } catch (error) {
        throw error;
    }
}; 
