import connection from '../src/DB/connection.js';
import bcrypt from 'bcryptjs';


async function main() {
  try {
    const [users] = await connection.execute('SELECT id_usuario, password FROM Usuarios');
    console.log(`Usuarios encontrados: ${users.length}`);

    const saltRounds = 10;
    for (const u of users) {
      const plain = u.password || '';
      // si ya parece bcrypt (empieza con $2a$ $2b$ o $2y$), omitir
      if (/^\$2[aby]\$/.test(plain)) {
        console.log(`User ${u.id_usuario} ya tiene password hasheada, omitiendo.`);
        continue;
      }

      // No intentar hashear valores vacíos
      if (!plain.trim()) {
        console.log(`User ${u.id_usuario} tiene password vacía, omitiendo.`);
        continue;
      }

      const hash = await bcrypt.hash(plain, saltRounds);
      await connection.execute('UPDATE Usuarios SET password = ? WHERE id_usuario = ?', [hash, u.id_usuario]);
      console.log(`User ${u.id_usuario} actualizado (hash aplicado).`);
    }

    console.log('Migración completada.');
    process.exit(0);
  } catch (err) {
    console.error('Error en migración de contraseñas:', err);
    process.exit(1);
  }
}

main();
