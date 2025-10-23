import connection from "./connection.js";



export async function verificacion_Uid_nfc(uid_nfc) {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM NFC_Maestros WHERE uid =?',[uid_nfc]
        );
        if (rows.length > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
};