import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { generar_justificante } from '../controller/Justificante_Controller.js';

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

const upload = multer({ storage });

const router = express.Router();

// multipart/form-data: fields: id_maestro, titulo, motivo, fecha. File field name: 'file'
router.post('/justificante', upload.single('file'), generar_justificante);

export default router;