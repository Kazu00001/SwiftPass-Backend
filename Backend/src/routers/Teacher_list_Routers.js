import express from 'express';
import { get_Teacher_list, get_Attendance_data , schedule, get_Permissions_and_Justificantes, update_Day_Profile_Admin, listar_permisos_y_justificantes,
    estadisticaAsistencias, teacherAusent, pendientesJus_Per, pendientesUaproJus_Per, updateRecordApproval
} from '../controller/Teacher_list_Controller.js';
const router = express.Router();

router.get('/teachers', get_Teacher_list);
router.get('/teachers/:id_maestro/attendance', get_Attendance_data);
router.get('/teachers/:id_maestro/schedule', schedule);
router.get('/teachers/:id_maestro/records', get_Permissions_and_Justificantes);
router.put('/teachers/admin/update-day-profile', update_Day_Profile_Admin);
router.get('/teachers/:id_maestro/listar-permisos-justificantes', listar_permisos_y_justificantes);
router.get('/teachers/:id_maestro/estadistica-asistencias', estadisticaAsistencias);
router.get('/teachers/ausentes', teacherAusent);
router.get('/teachers/pendientes-jus-per', pendientesJus_Per);  
router.get('/teachers/pendientes-uapro-jus-per', pendientesUaproJus_Per);
router.put('/teachers/record/approve', updateRecordApproval);
export default router;