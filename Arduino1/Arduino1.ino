#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_PN532.h>

/* =========================
   PN532 (I2C)
   ========================= */
#define SDA_PIN 21
#define SCL_PIN 22
Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);

/* =========================
   Wi-Fi
   ========================= */
const char* ssid     = "2uosle";
const char* password = "cjrobijuan123";

/* =========================
   Backend base URL
   ========================= */
String baseUrl = "http://172.20.10.6:3000";   // <-- your server

/* =========================
   Poll timers (ms)
   ========================= */
unsigned long lastPollLink   = 0;
unsigned long lastPollReload = 0;
unsigned long lastPollSale   = 0;

/* =========================
   Pending states
   ========================= */
int   linkPendingId        = -1;   // NEW: RFID pairing
int   salePendingId        = -1;
float salePendingAmount    = 0.0;
int   reloadPendingId      = -1;

/* =========================
   Helpers
   ========================= */
String toHexUID(uint8_t *uid, uint8_t uidLength) {
  String s = "";
  for (uint8_t i = 0; i < uidLength; i++) {
    if (uid[i] < 0x10) s += "0";
    s += String(uid[i], HEX);
  }
  s.toUpperCase();
  return s;
}

/* =========================
   Wi-Fi connect (robust)
   ========================= */
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 45000UL) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠️  Not connected after 45s. Will keep trying in background.");
  }
}

/* =========================
   HTTP helpers
   ========================= */
bool httpGET(const String& url, String &resp, int &codeOut) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  http.begin(url);
  http.setTimeout(8000);
  int code = http.GET();
  codeOut = code;
  if (code > 0) resp = http.getString();
  http.end();
  return (code == 200);
}

bool httpPOST(const String& url, const String& jsonPayload, String &resp, int &codeOut) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  http.begin(url);
  http.setTimeout(8000);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(jsonPayload);
  codeOut = code;
  if (code > 0) resp = http.getString();
  http.end();
  return (code >= 200 && code < 300);
}

/* =========================================================
   RFID PAIRING (NEW)
   ========================================================= */

// Poll latest pending RFID link (fresh & unconfirmed)
void pollPendingLink() {
  if (linkPendingId != -1) return;   // already have one
  String resp; int code = 0;
  if (!httpGET(baseUrl + "/rfid/link/latest", resp, code)) {
    if (code != 0) { Serial.print("Link poll failed: "); Serial.println(code); }
    return;
  }

  // DEBUG
  Serial.println("Pending link: " + resp);

  // naive parse for `id`
  int idPos = resp.indexOf("\"id\":");
  if (idPos != -1) {
    int idStart = idPos + 5;
    // id might be followed by ',' or '}'
    int idEndComma = resp.indexOf(",", idStart);
    int idEndBrace = resp.indexOf("}", idStart);
    int idEnd = (idEndComma == -1) ? idEndBrace : (idEndBrace == -1 ? idEndComma : min(idEndComma, idEndBrace));
    if (idEnd != -1) {
      linkPendingId = resp.substring(idStart, idEnd).toInt();
      Serial.printf("➡ Pending RFID link: id=%d. Waiting for tap…\n", linkPendingId);
    }
  } else {
    linkPendingId = -1;
  }
}

// Confirm RFID link on tap
void confirmLink(const String& uidStr) {
  if (linkPendingId == -1) return;
  String payload = "{\"pending_id\":" + String(linkPendingId) + ",\"uid\":\"" + uidStr + "\",\"device_id\":\"enroll-station-1\"}";
  String resp; int code = 0;
  bool ok = httpPOST(baseUrl + "/rfid/link/confirm", payload, resp, code);
  Serial.printf("Link confirm HTTP %d\n", code);
  if (code > 0) Serial.println(resp);
  // clear only link state
  linkPendingId = -1;
}

/* =========================================================
   SALES
   ========================================================= */

// Poll latest pending SALE
void pollPendingSale() {
  String resp; int code = 0;
  if (!httpGET(baseUrl + "/pending-sale/latest", resp, code)) {
    if (code != 0) { Serial.print("Sale poll failed: "); Serial.println(code); }
    return;
  }

  Serial.println("Pending sale: " + resp);

  if (resp.indexOf("\"id\":") != -1) {
    int idStart = resp.indexOf("\"id\":") + 5;
    int idEnd   = resp.indexOf(",", idStart);
    if (idEnd == -1) idEnd = resp.indexOf("}", idStart);
    salePendingId = resp.substring(idStart, idEnd).toInt();

    // Try numeric first: "amount":123.45
    int amtPos = resp.indexOf("\"amount\":");
    salePendingAmount = 0.0;
    if (amtPos != -1) {
      int aStart = amtPos + 9;
      // If it's quoted, handle that too
      if (resp.charAt(aStart) == '\"') {
        aStart++;
        int aEnd = resp.indexOf("\"", aStart);
        salePendingAmount = resp.substring(aStart, aEnd).toFloat();
      } else {
        int aEndComma = resp.indexOf(",", aStart);
        int aEndBrace = resp.indexOf("}", aStart);
        int aEnd = (aEndComma == -1) ? aEndBrace : (aEndBrace == -1 ? aEndComma : min(aEndComma, aEndBrace));
        salePendingAmount = resp.substring(aStart, aEnd).toFloat();
      }
    }

    Serial.printf("➡ Sale waiting: ID=%d Amount=%.2f\n", salePendingId, salePendingAmount);
    Serial.println("Ask student to tap card...");
  } else {
    salePendingId = -1;
  }
}

// Confirm SALE
void confirmSale(const String& uidStr) {
  if (salePendingId == -1) return;
  String payload = "{\"pending_id\":" + String(salePendingId) + ",\"uid\":\"" + uidStr + "\"}";
  String resp; int code = 0;
  bool ok = httpPOST(baseUrl + "/pending-sale/confirm", payload, resp, code);
  Serial.printf("Sale confirm HTTP %d\n", code);
  if (code > 0) Serial.println(resp);
  // clear only sale
  salePendingId = -1;
}

/* =========================================================
   RELOADS
   ========================================================= */

// Poll latest pending RELOAD
void pollPendingReload() {
  if (reloadPendingId != -1) return;   // already have one
  String resp; int code = 0;
  if (!httpGET(baseUrl + "/pending-reload/latest", resp, code)) {
    if (code != 0) { Serial.print("Reload poll failed: "); Serial.println(code); }
    return;
  }

  Serial.println("Pending reload: " + resp);

  if (resp.indexOf("\"id\":") != -1) {
    int idStart = resp.indexOf("\"id\":") + 5;
    int idEnd   = resp.indexOf(",", idStart);
    if (idEnd == -1) idEnd = resp.indexOf("}", idStart);
    reloadPendingId = resp.substring(idStart, idEnd).toInt();
    Serial.printf("➡ Pending reload: id=%d. Waiting for tap…\n", reloadPendingId);
  } else {
    reloadPendingId = -1;
  }
}

// Confirm RELOAD
void confirmReload(const String& uidStr) {
  if (reloadPendingId == -1) return;
  String payload = "{\"pending_id\":" + String(reloadPendingId) + ",\"uid\":\"" + uidStr + "\"}";
  String resp; int code = 0;
  bool ok = httpPOST(baseUrl + "/pending-reload/confirm", payload, resp, code);
  Serial.printf("Reload confirm HTTP %d\n", code);
  if (code > 0) Serial.println(resp);
  // clear only reload
  reloadPendingId = -1;
}

/* =========================================================
   SETUP / LOOP
   ========================================================= */
void setup() {
  Serial.begin(115200);
  delay(100);

  connectWiFi();

  // PN532
  nfc.begin();
  uint32_t ver = nfc.getFirmwareVersion();
  if (!ver) {
    Serial.println("❌ Didn't find PN532 board");
    while (1) delay(1000);
  }
  nfc.SAMConfig();   // enable readPassiveTargetID

  Serial.println("System ready. Polling link, reloads & sales…");
}

void loop() {
  // keep Wi-Fi alive
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastRetry = 0;
    if (millis() - lastRetry > 5000) {
      lastRetry = millis();
      Serial.println("Reconnecting WiFi…");
      WiFi.reconnect();
    }
  }

  unsigned long now = millis();

  /* ---------------------------
     1) Poll in priority order:
        Pairing > Reload > Sale
     --------------------------- */
  if (linkPendingId == -1 && (now - lastPollLink) > 1200) {
    lastPollLink = now;
    pollPendingLink();
  }

  // Only check reload/sale if no pairing is active
  if (linkPendingId == -1) {
    if (reloadPendingId == -1 && (now - lastPollReload) > 1800) {
      lastPollReload = now;
      pollPendingReload();
    }
    if (reloadPendingId == -1 && salePendingId == -1 && (now - lastPollSale) > 2200) {
      lastPollSale = now;
      pollPendingSale();
    }
  }

  /* ---------------------------
     2) If anything is pending,
        wait for card tap
     --------------------------- */
  if (linkPendingId != -1 || reloadPendingId != -1 || salePendingId != -1) {
    uint8_t uid[7]; uint8_t uidLength;
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
      String uidStr = toHexUID(uid, uidLength);
      Serial.print("Card tapped UID: "); Serial.println(uidStr);

      // Priority on confirm: Pairing > Reload > Sale
      if (linkPendingId != -1) {
        confirmLink(uidStr);
      } else if (reloadPendingId != -1) {
        confirmReload(uidStr);
      } else if (salePendingId != -1) {
        confirmSale(uidStr);
      }
    }
  }
}
