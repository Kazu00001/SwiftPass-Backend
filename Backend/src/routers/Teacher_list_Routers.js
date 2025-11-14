import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { get_Teacher_list, get_Attendance_data , schedule, get_Permissions_and_Justificantes, update_Day_Profile_Admin, listar_permisos_y_justificantes,
    estadisticaAsistencias, teacherAusent, pendientesJus_Per, pendientesUaproJus_Per, updateRecordApproval, getTeacherProfileImage, create_teacher_record
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
// Perfil: obtener URL de imagen de perfil del maestro (JSON) o redirigir con ?redirect=1
router.get('/teachers/:id_maestro/photo', getTeacherProfileImage);
// Endpoint unificado para crear permiso o justificante con archivo opcional (campo 'file')
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// store uploads in Backend/public/images (two levels up from src/routers)
const uploadDir = path.join(__dirname, '..', '..', 'public', 'images');
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) { const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_'); cb(null, unique); }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/; const ext = path.extname(file.originalname).toLowerCase(); const mimeOk = allowed.test(file.mimetype); const extOk = allowed.test(ext); if (mimeOk && extOk) return cb(null, true); cb(new Error('Sólo se permiten imágenes JPG/PNG')); }
});

router.post('/teachers/:id/records', upload.single('file'), create_teacher_record);
export default router;