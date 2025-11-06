#include <Wire.h>
#include <Adafruit_PN532.h>

// Pines NFC
#define SDA_PIN A4
#define SCL_PIN A5
Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);

// Pines LEDs
const int LED_GREEN = 7;
const int LED_RED = 8;

// Pines del sensor ultrasónico
const int TRIG_PIN = 12;
const int ECHO_PIN = 11;

// Distancia mínima para bloqueo (en cm)
const int DISTANCIA_MIN = 100;

void setup() {
  Serial.begin(9600);

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);

  nfc.begin();
  uint32_t ver = nfc.getFirmwareVersion();
  if (!ver) {
    Serial.println("ERROR: PN532 no detectado");
    while (1);
  }
  nfc.SAMConfig();
  Serial.println("LISTO: lector NFC iniciado");
}

// --- Función para medir distancia ---
float medirDistancia() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duracion = pulseIn(ECHO_PIN, HIGH);
  float distancia = duracion * 0.034 / 2;
  return distancia;
}

void loop() {
  // Medir distancia actual
  float distancia = medirDistancia();
  Serial.print("Distancia: ");
  Serial.print(distancia);
  Serial.println(" cm");

  uint8_t uid[7];
  uint8_t uidLen;

  // --- Lectura NFC ---
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen)) {
    String uidStr = "";
    for (uint8_t i = 0; i < uidLen; i++) {
      if (uid[i] < 0x10) uidStr += "0";
      uidStr += String(uid[i], HEX);
      if (i < uidLen - 1) uidStr += ":";
    }
    uidStr.toUpperCase();

    Serial.print("UID detectado: ");
    Serial.println(uidStr);

    // --- Esperar respuesta del host por hasta 5 segundos ---
    unsigned long start = millis();
    String response = "";
    while (millis() - start < 1000) {
      if (Serial.available()) {
        char c = Serial.read();
        if (c == '\n' || c == '\r') {
          if (response.length() > 0) break;
        } else response += c;
      }
    }

    response.trim();
    Serial.print("Respuesta recibida: ");
    Serial.println(response);

    // --- LED según respuesta ---
    if (response == "OK") {
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(LED_RED, LOW);
      delay(2000);
      digitalWrite(LED_GREEN, LOW);
    } else if (response == "NO") {
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_RED, HIGH);
      delay(2000);
      digitalWrite(LED_RED, LOW);
    } else {
      for (int i = 0; i < 4; i++) {
        digitalWrite(LED_RED, HIGH); delay(100);
        digitalWrite(LED_RED, LOW);  delay(100);
      }
    }

    distancia = medirDistancia();
    if (distancia < DISTANCIA_MIN) {
      Serial.println("Bloqueado: persona demasiado cerca, esperando que se aleje...");
      digitalWrite(LED_RED, HIGH);

      // Esperar sin bloquear: revisar distancia cada 300 ms
      while (medirDistancia() < DISTANCIA_MIN) {
        Serial.print(".");
        delay(300);
      }

      Serial.println("\nPersona lejos. Desbloqueado.");
      digitalWrite(LED_RED, LOW);
    }

    delay(500); 
  }

  delay(200); 
}