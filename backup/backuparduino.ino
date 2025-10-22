#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_PN532.h>

#define SDA_PIN 21
#define SCL_PIN 22
Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);

const char* ssid = "2uo";
const char* password = "2uoHome0219!";
String baseUrl = "http://192.168.1.15:3000";  // backend

unsigned long lastPoll = 0;
int pendingId = -1;   // store pending sale ID
float pendingAmount = 0;

    void setup() {
      Serial.begin(115200);

      // --- WiFi: STA mode, no modem sleep, auto-reconnect ---
      WiFi.mode(WIFI_STA);
      WiFi.setSleep(false);
      WiFi.persistent(false);
      WiFi.setAutoReconnect(true);

      // Scan to verify your SSID is visible
      Serial.println("Scanning WiFi...");
      int n = WiFi.scanNetworks(/*async=*/false, /*hidden=*/true);
      if (n <= 0) {
        Serial.println("No networks found");
      } else {
        for (int i = 0; i < n && i < 10; i++) {
          Serial.print(i); Serial.print(": ");
          Serial.print(WiFi.SSID(i));
          Serial.print("  RSSI="); Serial.print(WiFi.RSSI(i));
          Serial.print("  ENC=");  Serial.println(WiFi.encryptionType(i));
        }
  }

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  // Give it up to 45s (some routers/DHCP are slow)
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt) < 45000UL) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠️  Not connected after 45s. Will keep trying in background.");
    // Keep trying in background without rebooting
  }

  // --- PN532 init ---
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("Didn't find PN532 board");
    while (1); // halt
  }
  nfc.SAMConfig();

  Serial.println("System ready. Polling for sales...");
}

void loop() {
  // If WiFi dropped, nudge it
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastRetry = 0;
    if (millis() - lastRetry > 5000) {
      lastRetry = millis();
      Serial.println("Reconnecting WiFi...");
      WiFi.reconnect();
    }
    // We can continue; your HTTP calls already check WiFi.status()
  }

  // Step 1: Poll backend for latest pending sale every 3 seconds
  if (millis() - lastPoll > 3000 && pendingId == -1) {
    lastPoll = millis();
    pollPendingSale();
  }

  // Step 2: If a pending sale exists, wait for RFID tap
  if (pendingId != -1) {
    uint8_t uid[7]; uint8_t uidLength;
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
      String uidStr = "";
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) uidStr += "0";
        uidStr += String(uid[i], HEX);
      }
      uidStr.toUpperCase();

      Serial.print("Card tapped UID: ");
      Serial.println(uidStr);

      confirmSale(uidStr);
      pendingId = -1;  // reset after attempt
    }
  }
}

void pollPendingSale() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(baseUrl + "/pending-sale/latest");
  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("Pending sale: " + response);

    // crude parsing (better: use ArduinoJSON)
    if (response.indexOf("id") != -1) {
      // parse id and amount manually
      int idStart = response.indexOf("\"id\":") + 5;
      int idEnd = response.indexOf(",", idStart);
      pendingId = response.substring(idStart, idEnd).toInt();

      int amtStart = response.indexOf("\"amount\":\"") + 10;
      int amtEnd = response.indexOf("\"", amtStart);
      String amtStr = response.substring(amtStart, amtEnd);
      pendingAmount = amtStr.toFloat();


      Serial.print("➡ Sale waiting: ID=");
      Serial.print(pendingId);
      Serial.print(" Amount=");
      Serial.println(pendingAmount);
      Serial.println("Ask student to tap card...");
    } else {
      // no sale pending
      pendingId = -1;
    }
  } else {
    Serial.print("Poll failed: ");
    Serial.println(httpCode);
  }
  http.end();
}

void confirmSale(String uidStr) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(baseUrl + "/pending-sale/confirm");
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"pending_id\":" + String(pendingId) + ",\"uid\":\"" + uidStr + "\"}";
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Confirm response: " + response);
  } else {
    Serial.print("Error on confirm: ");
    Serial.println(httpCode);
  }
  http.end();
}
