import mysql from 'mysql2/promise';
import  config  from './config.js';
const connection = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default connection;