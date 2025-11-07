import serial
import time
import requests
import re

# URL del enpoint
API_URL = "http://localhost:3000/api/validar/"

# Puerto de serie
SERIAL_PORT = '/dev/tty.usbmodem11301'  # cambia si tu Arduino usa otro
BAUDRATE = 9600

# Conexión Serial
ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=0.1)
time.sleep(2)
print("Conectado al Arduino.")

# Forma de la expresion del uuid
uid_pattern = re.compile(r'([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){2,})')

def normalizar_uid(s):
    s = s.strip().upper()
    parts = s.split(':')
    parts = [p.zfill(2) for p in parts]
    return ':'.join(parts)

while True:
    if ser.in_waiting:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if not line:
            continue

        print("Arduino →", repr(line))

        # Busca el UID dentro del texto leído
        m = uid_pattern.search(line)
        if m:
            uid = normalizar_uid(m.group(1))
            print(f"UID detectado: {uid}")

            try:
                #  Request al backend
                response = requests.get(f"{API_URL}{uid}", timeout=5)
                data = response.json()

                # Lee el estado de la respuesta
                status = data.get("status", "error")
                print("Respuesta del servidor:", data)

                #  Enviar señal al Arduino según resultado
                if status.lower() == "ok":
                    ser.write(b"OK\n")
                    print("Usuario autorizado")
                else:
                    ser.write(b"NO\n")
                    print("Usuario NO autorizado")

            except Exception as e:
                print("Error al consultar la API:", e)
                ser.write(b"NO\n")

        time.sleep(0.05)