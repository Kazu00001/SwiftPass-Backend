import express from 'express';
import { get_Teacher_list, get_Attendance_data , schedule, get_Permissions_and_Justificantes, update_Day_Profile_Admin} from '../controller/Teacher_list_Controller.js';
const router = express.Router();

router.get('/teachers', get_Teacher_list);
router.get('/teachers/:id_maestro/attendance', get_Attendance_data);
router.get('/teachers/:id_maestro/schedule', schedule);
router.get('/teachers/:id_maestro/records', get_Permissions_and_Justificantes);
router.put('/teachers/admin/update-day-profile', update_Day_Profile_Admin);
export default router;