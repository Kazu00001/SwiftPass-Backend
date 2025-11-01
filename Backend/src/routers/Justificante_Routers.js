import express from 'express';
import { generar_justificante } from '../controller/Justificante_Controller.js';
const router = express.Router();

router.post('/justificante', generar_justificante);

export default router;  