#include <Wire.h>
#include <Adafruit_PN532.h>

#define SDA_PIN A4
#define SCL_PIN A5

Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);

// Pines LEDs
const int LED_GREEN = 7;
const int LED_RED = 8;

void setup() {
  Serial.begin(9600);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
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

void loop() {
  // Lectura pasiva (ISO14443A)
  uint8_t uid[7];
  uint8_t uidLen;
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen)) {
    // Construir cadena UID hex separada por :
    String uidStr = "";
    for (uint8_t i = 0; i < uidLen; i++) {
      if (uid[i] < 0x10) uidStr += "0";
      uidStr += String(uid[i], HEX);
      if (i < uidLen - 1) uidStr += ":";
    }
    uidStr.toUpperCase();
    Serial.print("UID:");
    Serial.println(uidStr); // Ej: UID:04:1A:2B:3C

    // Esperar la respuesta del host por hasta 5 segundos
    unsigned long start = millis();
    String response = "";
    while (millis() - start < 5000) {
      if (Serial.available()) {
        char c = Serial.read();
        if (c == '\n' || c == '\r') {
          if (response.length() > 0) break;
        } else response += c;
      }
    }

    response.trim();
    if (response == "OK") {
      // Indicar OK
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(LED_RED, LOW);
      delay(2000);
      digitalWrite(LED_GREEN, LOW);
    } else if (response == "NO") {
      // Indicar NO
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_RED, HIGH);
      delay(2000);
      digitalWrite(LED_RED, LOW);
    } else {
      for (int i=0;i<4;i++){
        digitalWrite(LED_RED, HIGH); delay(100);
        digitalWrite(LED_RED, LOW);  delay(100);
      }
    }

    delay(500); // evitar lecturas repetidas inmediatas
  }
}