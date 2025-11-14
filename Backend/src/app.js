import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import connection from './DB/connection.js';
import validacionRouters from './routers/Validacion_Routers.js';
import teacherListRouters from './routers/Teacher_list_Routers.js';
import loginRouters from './routers/LoginRouters.js';
import reportsRouters from './routers/Reports_Routers.js';
dotenv.config({quiet: true});
const app = express();
app.use(cors());
app.use(express.json());
// Serve static images from Backend/public/images at /images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));
app.use('/api', validacionRouters);
app.use('/api', teacherListRouters);
app.use('/api', loginRouters);
app.use('/api/reports', reportsRouters);
































const PORT = process.env.PORT || 3000;
// Inicio de servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connection.getConnection(err => {
        if (err) {
            console.error('Error de conecxion en la base de datos:', err);
        } else {
            console.log('Base de datos conectada correctamente.');
        }
    });
});