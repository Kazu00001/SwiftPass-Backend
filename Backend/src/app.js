import dotenv from 'dotenv';
import express from 'express';
import connection from './DB/connection.js';
import validacionRouters from './routers/Validacion_Routers.js';

dotenv.config({quiet: true});
const app = express();


app.use('/api', validacionRouters);


































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