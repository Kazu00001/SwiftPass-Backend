import express from 'express';
import ReportsController from '../controller/ReportsController.js';

const router = express.Router();

// GET /api/reports/attendance?start=YYYY-MM-DD&end=YYYY-MM-DD[&id_maestro=123]
router.get('/attendance', ReportsController.generateAttendanceReport);

export default router;
