import express from 'express';
import { teacher_list } from '../DB/querySql.js';

const router = express.Router();

router.get('/teachers', async (req, res) => {
    try {
        const teachers = await teacher_list();
        res.json(teachers);
    } catch (error) {
        console.error('Error al obtener la lista de maestros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;