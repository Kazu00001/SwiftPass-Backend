import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {generar_permisos} from '../controller/Permisos_Controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// store uploads in Backend/public/images (two levels up from src/routers)
const uploadDir = path.join(__dirname, '..', '..', 'public', 'images');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
		cb(null, unique);
	}
});

const upload = multer({ 
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
	fileFilter: (req, file, cb) => {
		const allowed = /jpeg|jpg|png/;
		const ext = path.extname(file.originalname).toLowerCase();
		const mimeOk = allowed.test(file.mimetype);
		const extOk = allowed.test(ext);
		if (mimeOk && extOk) return cb(null, true);
		cb(new Error('Sólo se permiten imágenes JPG/PNG'));
	}
});

const router = express.Router();
// multipart/form-data: fields: id_maestro, motivo, fecha_inicio, fecha_fin. File field name: 'file'
router.post('/permisos', upload.single('file'), generar_permisos);

export default router;