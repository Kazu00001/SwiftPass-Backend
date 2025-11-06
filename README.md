# SwiftPass - Backend

Este documento describe la arquitectura física y la estructura principal del backend del proyecto desde la carpeta madre. Incluye un diagrama, árbol de carpetas, flujo de datos y notas operativas.

## Diagrama de alto nivel

```mermaid
flowchart LR
  Client[Cliente (Web/Móvil/NFC reader)] -->|HTTP JSON| API[Express API<br/>(src/app.js / src/server.js)]
  API --> Routers[Routers<br/>(src/routers/*)]
  Routers --> Controllers[Controllers<br/>(src/controller/*)]
  Controllers --> Services[DB helpers / Queries<br/>(src/DB/querySql.js)]
  Services -->|mysql2| MySQL[(Base de datos MySQL)]
  Cron((node-cron o job externo)) --> Services
  subgraph BackendFiles
    API
    Routers
    Controllers
    Services
  end
```

Si no puedes renderizar Mermaid, la idea es: Cliente → API (Express) → Router → Controller → DB helpers → MySQL. Un cron (o job externo) llama a las funciones de DB para tareas periódicas.

## Árbol de carpetas (desde la carpeta madre)

```text
.
├─ Backend/
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ db/
│  │  └─ SwiftPass_v1.sql
│  ├─ scripts/
│  │  └─ hash_passwords.js
│  └─ src/
│     ├─ app.js
│     ├─ server.js
│     ├─ DB/
│     │  ├─ config.js
│     │  ├─ connection.js
│     │  └─ querySql.js
│     ├─ controller/
│     │  ├─ LoginController.js
│     │  ├─ Teacher_list_Controller.js
│     │  ├─ Permisos_Controller.js
│     │  ├─ Justificante_Controller.js
│     │  └─ Validacion_Controller.js
│     └─ routers/
│        ├─ LoginRouters.js
│        ├─ Teacher_list_Routers.js
│        ├─ Permisos_Routers.js
│        ├─ Justificante_Routers.js
│        └─ Validacion_Routers.js
├─ README.md
├─ arduino/
│  └─ configuracion.ino
└─ python/
  └─ verificacion.py
```

## Archivos clave y responsabilidades

- `src/app.js` — configura middlewares (JSON body parser, CORS si aplica) y registra routers.
- `src/server.js` — arranca el servidor y realiza comprobaciones de conexión; punto para ejecutar backfills o jobs al iniciar.
- `src/DB/connection.js` — crea un pool con `mysql2/promise` y lo exporta para ser usado por los helpers.
- `src/DB/querySql.js` — implementa las funciones que acceden a la base de datos: login/getUser, verificación NFC, lista de maestros, inserción idempotente diaria de asistencias, manejo de permisos, etc.
- `src/controller/*` — controladores que reciben `req`, usan las funciones de `querySql.js` y devuelven respuestas HTTP.
- `src/routers/*` — define rutas y las asocia a controladores (por ejemplo `/api/login`, `/api/validar/:uid_nfc`).
- `scripts/hash_passwords.js` — script de utilidad para migrar contraseñas en texto plano a bcrypt.

## Flujo de datos (ejemplo: validación NFC)

1. El lector NFC envía `POST /api/validar/:uid_nfc` al servidor.
2. El router dirige la petición al `Validacion_Controller`.
3. El controlador llama a `verificacion_Uid_nfc(uid)` en `querySql.js`.
4. `querySql.js` consulta `NFC_Maestros` y actualiza o inserta en `Registro_Asistencias` según reglas (acceso, permisos).
5. Respuesta HTTP retorna estado y datos mínimos al cliente.

## Tareas operativas / Cómo ejecutar

1. Instalar dependencias:
```bash
cd Backend
npm install
```
2. Variables de entorno: crear `.env` con `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `PORT`.
3. Arrancar en desarrollo:
```bash
npm start
```
4. Ejecutar migración de contraseñas (si aplica):
```bash
node ./scripts/hash_passwords.js
```

<!-- Fin del README -->
