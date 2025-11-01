import express from 'express';
import {generar_permisos} from '../controller/Permisos_Controller.js';
const router = express.Router();
router.post('/permisos', generar_permisos);

export default router;