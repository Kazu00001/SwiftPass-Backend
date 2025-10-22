import serial
import time
import requests
import re

API_URL = "http://localhost:3000/verificar"
SERIAL_PORT = '/dev/tty.usbmodem1301'
BAUDRATE = 9600

ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=0.1)
time.sleep(2)
print("Conectado al Arduino.")

uid_pattern = re.compile(r'^UID:([0-9A-Fa-f:]+)')

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
        print("Arduino →", line)
        m = uid_pattern.match(line)
        if m:
            uid = normalizar_uid(m.group(1))
            print("UID detectado:", uid)
            try:
                # Llamada al backend Node
                response = requests.post(API_URL, json={"uid": uid}, timeout=5)
                data = response.json()
                status = data.get("status", "error")

                if status == "ok":
                    ser.write(b"OK\n")
                    print("Usuario autorizado")
                else:
                    ser.write(b"NO\n")
                    print("Usuario NO autorizado")

            except Exception as e:
                print("Error al consultar la API:", e)
                ser.write(b"NO\n")