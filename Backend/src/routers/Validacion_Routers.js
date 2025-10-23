import express from 'express';
import { validar_Uid_nfc } from '../controller/Validacion_Controller.js';

const router = express.Router();
router.get('/validar/:uid_nfc', validar_Uid_nfc);

export default router;