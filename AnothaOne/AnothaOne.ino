// === NEUTap Station (ESP32 + PN532 I2C + ILI9341) ===
// - Name-first robust parsing (case-insensitive)
// - Smaller success icon; split "Remaining Bal:" into two lines
// - Header shows "NEUTap: HH:MM" without ghost digits
// - Idle/reset + Wi-Fi recovery + UID→name cache

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_PN532.h>
#include <SPI.h>
#include <time.h>
#include <ArduinoJson.h>

// =========================
// TFT DISPLAY
// =========================
#define TFT_IS_ILI9341 1            // set to 0 if ST7789
#define TFT_SCLK 18
#define TFT_MOSI 23
#define TFT_MISO 19
#define TFT_CS   27
#define TFT_DC   26
#define TFT_RST  33

#define COL_BLACK   0x0000
#define COL_WHITE   0xFFFF
#define COL_RED     0xF800
#define COL_GREEN   0x07E0
#define COL_BLUE    0x001F
#define COL_CYAN    0x07FF
#define COL_YELLOW  0xFFE0
#define COL_DKGREY  0x7BEF
#define COL_ORANGE  0xFD20

#if TFT_IS_ILI9341
  #include <Adafruit_GFX.h>
  #include <Adafruit_ILI9341.h>
  Adafruit_ILI9341 tft(TFT_CS, TFT_DC, TFT_RST);
#else
  #include <Adafruit_GFX.h>
  #include <Adafruit_ST7789.h>
  Adafruit_ST7789 tft(TFT_CS, TFT_DC, TFT_RST);
#endif

// =========================
// PN532 (I2C with IRQ/RST)
// =========================
#define SDA_PIN 21
#define SCL_PIN 22
#define PN532_IRQ   4
#define PN532_RESET 5
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET, &Wire);

// =========================  
// Wi-Fi / Backend
// =========================
const char* ssid     = "2uosle";
const char* password = "cjrobijuan123";
String baseUrl = "http://172.20.10.6:3000";
// Use the server's stable profile endpoint
#define PROFILE_ENDPOINT "/balance/"

// JWT for device to authenticate staff-only endpoints.
// Option A: Leave staffJwt empty and set deviceUsername/password below to auto-login.
// Option B: Paste a pre-fetched token into staffJwt.
String staffJwt = ""; // if empty, device will try auto-login

// Device credentials for auto-login (recommended)
String deviceUsername = "staff1"; // e.g., "rfid-station-1" (staff or admin)
String devicePassword = "manager123"; // password for that account

// Schema columns per DB: users(name, balance, rfid_uid)
#define SCHEMA_NAME_KEY  "name"
#define SCHEMA_BAL_KEY   "balance"

// =========================
// Poll timers (ms)
// =========================
unsigned long lastPollLink   = 0;
unsigned long lastPollReload = 0;
unsigned long lastPollSale   = 0;

// =========================
// Pending states
// =========================
int   linkPendingId      = -1;
int   salePendingId      = -1;
float salePendingAmount  = 0.0f;
int   reloadPendingId    = -1;

// =========================
// Simple UI state machine
// =========================
enum UIState {
  IDLE, WAIT_PAIR, WAIT_RELOAD, WAIT_SALE,
  PROCESS_PAIR, PROCESS_RELOAD, PROCESS_SALE, RESULT_SHOW
};
UIState uiState = IDLE;
uint32_t resultShowUntil = 0;
bool g_serverOK = false;
uint32_t g_lastClockMs = 0;  // (unused now, safe to keep)
String g_pnVerStr = "";
bool g_prevWiFiConnected = false;

// =========================
// WAIT timeouts & helpers
// =========================
#define WAIT_TIMEOUT_MS 25000UL
uint32_t waitStateSince = 0;
void markWaitStart() { waitStateSince = millis(); }
bool waitTimedOut()  { return (int32_t)(millis() - waitStateSince) >= (int32_t)WAIT_TIMEOUT_MS; }

// =========================
// UID→Name cache
// =========================
struct CacheEntry { String uid; String name; float bal; uint32_t ts; };
#define CACHE_SIZE 16
CacheEntry g_cache[CACHE_SIZE];

int cacheFind(const String& uid){ for(int i=0;i<CACHE_SIZE;i++) if(g_cache[i].uid==uid) return i; return -1; }
void cachePut(const String& uid,const String& name,float bal){
  int idx=cacheFind(uid);
  if(idx<0){ uint32_t oldest=0xFFFFFFFFUL; idx=0; for(int i=0;i<CACHE_SIZE;i++){ if(g_cache[i].uid.length()==0){idx=i;break;} if(g_cache[i].ts<oldest){oldest=g_cache[i].ts;idx=i;} } }
  g_cache[idx].uid=uid; g_cache[idx].name=name; g_cache[idx].bal=bal; g_cache[idx].ts=millis();
}
bool cacheGet(const String& uid,String& name,float& bal){
  int idx=cacheFind(uid); if(idx<0) return false; name=g_cache[idx].name; bal=g_cache[idx].bal; g_cache[idx].ts=millis(); return true;
}

// ---------- Header / UI ----------
void drawStatusDots(){
  int xWiFi=tft.width()-14, xSrv=tft.width()-32, y=15, rb=7;
  tft.fillCircle(xWiFi,y,rb,COL_DKGREY); tft.fillCircle(xSrv,y,rb,COL_DKGREY);
  uint16_t colWiFi=(WiFi.status()==WL_CONNECTED)?COL_GREEN:COL_RED;
  tft.fillCircle(xWiFi,y,6,colWiFi); tft.fillCircle(xSrv,y,6,g_serverOK?COL_GREEN:COL_RED);
}

// Robust time renderer: clears the header text region first and prints "NEUTap: HH:MM"
void drawClock() {
  static uint32_t lastMs = 0;
  if (millis() - lastMs < 500) return;   // refresh ~2×/sec
  lastMs = millis();

  struct tm tmnow;
  if (!getLocalTime(&tmnow)) return;

  char tbuf[6];                 // "HH:MM"
  strftime(tbuf, sizeof(tbuf), "%H:%M", &tmnow);

  // Clear a wide enough box to avoid leftover digits
  tft.setTextSize(2);
  tft.setTextColor(COL_WHITE);
  int16_t x1, y1; uint16_t w, h;
  tft.getTextBounds("NEUTap: 88:88", 0, 0, &x1, &y1, &w, &h);

  const int x = 8;
  const int y = 8;
  tft.fillRect(x-2, y-2, w+4, h+4, COL_DKGREY);

  tft.setCursor(x, y);
  tft.print("NEUTap: ");
  tft.print(tbuf);
}

// Draw the top bar; shows time on the left and status dots on the right
void tftHeader(const char* /*title_ignored*/) {
  tft.fillScreen(COL_BLACK);
  tft.fillRect(0, 0, tft.width(), 30, COL_DKGREY);
  tft.drawRect(0, 0, tft.width(), 30, COL_WHITE);
  drawClock();
  drawStatusDots();
}

void clearWorkArea(){ tft.fillRect(0,58,tft.width(),tft.height()-58,COL_BLACK); }

void tftLine(int y,const String& s,uint16_t color=COL_WHITE,uint8_t ts=2){
  int h=ts*8+8; tft.fillRect(0,y,tft.width(),h,COL_BLACK); tft.setCursor(8,y);
  tft.setTextColor(color); tft.setTextSize(ts); tft.print(s);
}

void showModeBanner(const char* label,uint16_t color){
  tft.fillRect(0,32,tft.width(),26,color); tft.setCursor(8,38);
  tft.setTextColor(COL_BLACK); tft.setTextSize(2); tft.print(label);
}
void clearModeBanner(){ tft.fillRect(0,32,tft.width(),26,COL_BLACK); }

void resetToIdleScreen(const char* note=nullptr){
  linkPendingId=reloadPendingId=salePendingId=-1; salePendingAmount=0.0f; clearModeBanner();
  uiState=IDLE; tftHeader("NEUTap Station"); clearWorkArea(); tftLine(110,"Waiting for tasks...",COL_WHITE,2);
  if(note) tftLine(90,note,COL_YELLOW,2);
  lastPollLink=lastPollReload=lastPollSale=0;
}

// ---------- Display helpers ----------
String sanitizeForGFX(const String& in){
  String out; out.reserve(in.length()); bool lastSpace=false;
  for(size_t i=0;i<in.length();){ uint8_t b=(uint8_t)in[i];
    if(b<128){ char c=(char)b; if(c=='\n'||c=='\r'||c=='\t') c=' ';
      if(c>=32&&c<=126){ if(c==' '){ if(!lastSpace) out+=c; lastSpace=true; } else { out+=c; lastSpace=false; } } i++;
    } else if(b==0xC3&&i+1<in.length()){ uint8_t b2=(uint8_t)in[i+1]; char m='?';
      switch(b2){case 0xA1:m='a';break;case 0x81:m='A';break;case 0xA9:m='e';break;case 0x89:m='E';break;case 0xAD:m='i';break;case 0x8D:m='I';break;case 0xB3:m='o';break;case 0x93:m='O';break;case 0xBA:m='u';break;case 0x9A:m='U';break;case 0xB1:m='n';break;case 0x91:m='N';break;default:m='?';}
      out+=m; lastSpace=false; i+=2;
    } else { out+='?'; lastSpace=false; i++; }
  }
  while(out.length()&&out[0]==' ') out.remove(0,1);
  while(out.length()&&out[out.length()-1]==' ') out.remove(out.length()-1);
  return out;
}

// Smaller success/fail indicator (no overlap with name) + result text
void drawBigIndicator(bool ok) {
  int cx = tft.width()/2, cy = 88, R = 20;
  tft.fillCircle(cx, cy, R, ok ? COL_GREEN : COL_RED);
  if (ok) {
    tft.drawLine(cx-10, cy,    cx-4,  cy+6,  COL_WHITE);
    tft.drawLine(cx-4,  cy+6,  cx+12, cy-8,  COL_WHITE);
    tft.drawLine(cx-10, cy+1,  cx-4,  cy+7,  COL_WHITE);
    tft.drawLine(cx-5,  cy+6,  cx+11, cy-8,  COL_WHITE);
  } else {
    tft.drawLine(cx-10, cy-10, cx+10, cy+10, COL_WHITE);
    tft.drawLine(cx+10, cy-10, cx-10, cy+10, COL_WHITE);
  }
  tftLine(116, ok ? "SUCCESSFUL" : "FAILED", ok ? COL_GREEN : COL_RED, 3);
}

// Show name + split balance into two lines
void showNameBalanceOnly(const String& name, float balance, bool ok) {
  clearWorkArea();
  clearModeBanner();
  drawBigIndicator(ok);

  String clean = sanitizeForGFX(name.length() ? name : "Unknown user");
  tft.setTextSize(2);
  tft.setTextColor(COL_WHITE);
  int16_t x1,y1; uint16_t w,h;
  tft.getTextBounds(clean, 0, 0, &x1, &y1, &w, &h);
  int xName = max(8, (int)((tft.width() - w) / 2));
  tft.setCursor(xName, 40);
  tft.print(clean);

  // Split balance label and amount
  tftLine(136, "Remaining Bal:", COL_CYAN, 2);

  String amt = isnan(balance) ? "PHP -" : ("PHP " + String(balance, 2));
  tft.setTextColor(COL_CYAN);
  tft.setTextSize(3);
  tft.getTextBounds(amt, 0, 0, &x1, &y1, &w, &h);
  int xAmt = max(8, (int)((tft.width() - w) / 2));
  tft.fillRect(0, 158, tft.width(), h + 6, COL_BLACK);
  tft.setCursor(xAmt, 160);
  tft.print(amt);
}

void showNoServerData(){ tftLine(90,"No polling data",COL_YELLOW,2); tftLine(110,"Server offline?",COL_YELLOW,2); }

// ---------- JSON helpers ----------
void stripBOM(String& s){ if(s.length()>=3&&(uint8_t)s[0]==0xEF&&(uint8_t)s[1]==0xBB&&(uint8_t)s[2]==0xBF) s.remove(0,3); }
float parseFlexibleNumber(const char* s){
  if(!s) return NAN; String acc; acc.reserve(16); bool seen=false;
  for(const char* p=s;*p;++p){ char c=*p; if((c>='0'&&c<='9')||c=='.'){ acc+=c; seen=true; }
                               else if(c==','||c==' '||c=='\t'){ } else if(seen){ break; } }
  if(!seen||acc.length()==0) return NAN; return acc.toFloat();
}
static inline String lower(const String& s){ String t=s; t.toLowerCase(); return t; }

// --- schema-first parsing (case-insensitive) ---
bool schema_pickNameFromNameObject(JsonObjectConst nobj, String& nm){
  const char* keys1[]={"full","full_name","fullname","display","display_name","displayname","displayName"};
  for(auto k:keys1) if(nobj.containsKey(k)&&nobj[k].is<const char*>()){ nm=String(nobj[k].as<const char*>()); nm.trim(); if(nm.length()) return true; }
  String first="",middle="",last=""; const char* kF[]={"first","first_name","firstname","given","given_name","givenname"};
  const char* kM[]={"middle","middle_name","middlename","middleName"};
  const char* kL[]={"last","last_name","lastname","family","family_name","familyname","surname"};
  for(auto k:kF) if(nobj.containsKey(k)&&nobj[k].is<const char*>()) first=String(nobj[k].as<const char*>());
  for(auto k:kM) if(nobj.containsKey(k)&&nobj[k].is<const char*>()) middle=String(nobj[k].as<const char*>());
  for(auto k:kL) if(nobj.containsKey(k)&&nobj[k].is<const char*>()) last=String(nobj[k].as<const char*>());
  String full=first; if(full.length()&&middle.length()) full+=" "+middle; if(full.length()&&last.length()) full+=" "; full+=last; full.trim();
  if(full.length()){ nm=full; return true; } return false;
}
bool schema_pickFromObj(JsonObjectConst obj, String& nm,float& bal){
  bool got=false;
  for(JsonPairConst kv:obj){
    String key=lower(String(kv.key().c_str()));
    JsonVariantConst v=kv.value();
    if(key.indexOf("name")>=0 && key.indexOf("username")==-1){
      if(v.is<const char*>()){ String s=String(v.as<const char*>()); s.trim(); if(s.length()){ nm=s; got=true; } }
      else if(v.is<JsonObjectConst>()){ got = schema_pickNameFromNameObject(v.as<JsonObjectConst>(), nm) || got; }
    }
    if(key.indexOf("balance")>=0 || key=="credit" || key=="credits" || key.indexOf("wallet")>=0){
      if(v.is<float>()||v.is<double>()){ bal=v.as<float>(); got=true; }
      else if(v.is<long>()||v.is<int>()){ bal=(float)v.as<long>(); got=true; }
      else if(v.is<const char*>()){ float f=parseFlexibleNumber(v.as<const char*>()); if(!isnan(f)){ bal=f; got=true; } }
    }
  }
  return got;
}
bool schema_tryContainers(JsonObjectConst o,String& nm,float& bal){
  const char* keys[]={"user","profile","student","account","person","customer","data","result","payload","record","transaction"};
  for(auto k:keys){
    if(!o.containsKey(k)) continue;
    JsonVariantConst v=o[k];
    if(v.is<JsonObjectConst>()){
      if(schema_pickFromObj(v.as<JsonObjectConst>(),nm,bal)) return true;
      if(schema_tryContainers(v.as<JsonObjectConst>(),nm,bal)) return true;
    }else if(v.is<JsonArrayConst>()){
      for(JsonVariantConst x:v.as<JsonArrayConst>()){
        if(x.is<JsonObjectConst>()&&(schema_pickFromObj(x.as<JsonObjectConst>(),nm,bal)||schema_tryContainers(x.as<JsonObjectConst>(),nm,bal))) return true;
      }
    }
  }
  return false;
}
bool parseNameBalanceJSON_SCHEMA(const String& resp,String& nameOut,float& balOut){
  DynamicJsonDocument doc(8192); DeserializationError err=deserializeJson(doc,resp);
  if(err){ Serial.print("JSON parse error: "); Serial.println(err.c_str()); return false; }
  JsonVariantConst root=doc.as<JsonVariantConst>();
  if(root.is<JsonObjectConst>()){
    JsonObjectConst o=root.as<JsonObjectConst>(); String n=""; float b=NAN;
    bool got=schema_pickFromObj(o,n,b); if(!got) got=schema_tryContainers(o,n,b);
    if(n.length()) nameOut=n; if(!isnan(b)) balOut=b; return (nameOut.length()||!isnan(balOut));
  }else if(root.is<JsonArrayConst>()){
    for(JsonVariantConst x:root.as<JsonArrayConst>()){
      if(!x.is<JsonObjectConst>()) continue; String n=""; float b=NAN;
      if(schema_pickFromObj(x.as<JsonObjectConst>(),n,b)){ if(n.length()) nameOut=n; if(!isnan(b)) balOut=b; return (nameOut.length()||!isnan(balOut)); }
    }
  }
  return false;
}

// flexible fallback
bool jFindBalanceFlexible(JsonVariantConst v,float& out){
  JsonObjectConst obj=v.as<JsonObjectConst>(); if(!obj.isNull()){
    for(JsonPairConst kv:obj){ String key=lower(String(kv.key().c_str())); JsonVariantConst val=kv.value();
      if(key.indexOf("balance")>=0 || key=="credit" || key=="credits" || key.indexOf("wallet")>=0){
        if(val.is<float>()||val.is<double>()){ out=val.as<float>(); return true; }
        if(val.is<long>()||val.is<int>()){ out=(float)val.as<long>(); return true; }
        if(val.is<const char*>()){ float f=parseFlexibleNumber(val.as<const char*>()); if(!isnan(f)){ out=f; return true; } }
      }
      if(val.is<JsonObjectConst>()||val.is<JsonArrayConst>()) if(jFindBalanceFlexible(val,out)) return true;
    } return false;
  }
  JsonArrayConst arr=v.as<JsonArrayConst>(); if(!arr.isNull()){ for(JsonVariantConst x:arr) if(jFindBalanceFlexible(x,out)) return true; }
  return false;
}
bool jFindNameFlexible(JsonVariantConst v,String& out){
  if(v.is<const char*>()){ String s=String(v.as<const char*>()); s.trim(); if(s.length()){ out=s; return true; } }
  JsonObjectConst obj=v.as<JsonObjectConst>(); if(!obj.isNull()){
    for(JsonPairConst kv:obj){ String keyLC=lower(String(kv.key().c_str())); JsonVariantConst val=kv.value();
      if(keyLC.indexOf("name")>=0){
        if(val.is<const char*>()){ String s=String(val.as<const char*>()); s.trim(); if(s.length()){ out=s; return true; } }
        else if(val.is<JsonObjectConst>()){ if(schema_pickNameFromNameObject(val.as<JsonObjectConst>(), out)) return true; }
      }
      if(keyLC=="user"||keyLC=="profile"||keyLC=="student"||keyLC=="person"||keyLC=="account"||keyLC=="customer"||keyLC=="data"||keyLC=="result"||keyLC=="payload"||keyLC=="record"||keyLC=="transaction"){
        if(val.is<JsonObjectConst>()){ if(jFindNameFlexible(val.as<JsonObjectConst>(),out)) return true; }
        else if(val.is<JsonArrayConst>()){ for(JsonVariantConst x:val.as<JsonArrayConst>()) if(jFindNameFlexible(x,out)) return true; }
      }
    }
    return false;
  }
  JsonArrayConst arr=v.as<JsonArrayConst>(); if(!arr.isNull()){ for(JsonVariantConst x:arr) if(jFindNameFlexible(x,out)) return true; }
  return false;
}
bool parseNameBalanceJSON_FLEX(String resp,String& nameOut,float& balOut){
  stripBOM(resp); DynamicJsonDocument doc(8192); DeserializationError err=deserializeJson(doc,resp);
  if(err){ Serial.print("JSON parse error: "); Serial.println(err.c_str()); return false; }
  JsonVariantConst root=doc.as<JsonVariantConst>(); bool gotName=jFindNameFlexible(root,nameOut); bool gotBal=jFindBalanceFlexible(root,balOut); return (gotName||gotBal);
}
bool parseNameBalanceFromAnyJSON(const String& json,String& nameOut,float& balOut){
  String name=""; float bal=NAN; bool ok=parseNameBalanceJSON_SCHEMA(json,name,bal); if(!ok) ok=parseNameBalanceJSON_FLEX(json,name,bal);
  if(ok){ nameOut=name; balOut=bal; } return ok;
}

// ---------- HTTP ----------
bool autoLoginIfNeeded(){
  if(staffJwt.length()>0) return true;
  if(deviceUsername.length()==0 || devicePassword.length()==0) return false;
  if(WiFi.status()!=WL_CONNECTED) return false;
  HTTPClient http; http.begin(baseUrl+"/login"); http.setTimeout(8000); http.setReuse(true); http.addHeader("Content-Type","application/json");
  String payload = String("{\"username\":\"")+deviceUsername+"\",\"password\":\""+devicePassword+"\"}";
  int code = http.POST(payload);
  String resp = (code>0)?http.getString():""; http.end(); delay(30);
  if(code==200){
    // Parse token using simple search to avoid extra JSON doc if small
    int pos = resp.indexOf("\"token\"");
    if(pos>=0){
      int colon = resp.indexOf(':', pos);
      int quote1 = resp.indexOf('\"', colon+1);
      int quote2 = resp.indexOf('\"', quote1+1);
      if(quote1>=0 && quote2>quote1){ staffJwt = resp.substring(quote1+1, quote2); Serial.println("[auto-login] Token acquired"); return true; }
    }
    Serial.println("[auto-login] 200 but token parse failed");
  } else {
    Serial.printf("[auto-login] Login failed HTTP %d\n", code);
  }
  return false;
}

bool httpGET(const String& url,String& resp,int& codeOut){
  if(WiFi.status()!=WL_CONNECTED) return false;
  if(url.indexOf("/pending-reload/")>=0 && staffJwt.length()==0){ autoLoginIfNeeded(); }
  HTTPClient http; http.begin(url); http.setTimeout(8000); http.setReuse(true);
  if(url.indexOf("/pending-reload/")>=0 && staffJwt.length()>0){ http.addHeader("Authorization","Bearer "+staffJwt); }
  int code=http.GET(); codeOut=code; if(code>0) resp=http.getString(); http.end(); delay(30);
  if(code==401 && url.indexOf("/pending-reload/")>=0){ // try refresh once
    if(autoLoginIfNeeded()){
      HTTPClient http2; http2.begin(url); http2.setTimeout(8000); http2.setReuse(true); http2.addHeader("Authorization","Bearer "+staffJwt);
      code=http2.GET(); codeOut=code; if(code>0) resp=http2.getString(); http2.end(); delay(30);
    }
  }
  g_serverOK=(code>=200&&code<300); drawStatusDots(); return (code==200);
}
bool httpPOST(const String& url,const String& jsonPayload,String& resp,int& codeOut){
  if(WiFi.status()!=WL_CONNECTED) return false;
  if(url.indexOf("/pending-reload/")>=0 && staffJwt.length()==0){ autoLoginIfNeeded(); }
  HTTPClient http; http.begin(url); http.setTimeout(8000); http.setReuse(true); http.addHeader("Content-Type","application/json");
  if(url.indexOf("/pending-reload/")>=0 && staffJwt.length()>0){ http.addHeader("Authorization","Bearer "+staffJwt); }
  int code=http.POST(jsonPayload); codeOut=code; if(code>0) resp=http.getString(); http.end(); delay(30);
  if(code==401 && url.indexOf("/pending-reload/")>=0){
    if(autoLoginIfNeeded()){
      HTTPClient h2; h2.begin(url); h2.setTimeout(8000); h2.setReuse(true); h2.addHeader("Content-Type","application/json"); h2.addHeader("Authorization","Bearer "+staffJwt);
      code=h2.POST(jsonPayload); codeOut=code; if(code>0) resp=h2.getString(); h2.end(); delay(30);
    }
  }
  g_serverOK=(code>=200&&code<300); drawStatusDots(); return (code>=200&&code<300);
}

// Prefer schema endpoint if present; otherwise we rely on POST only
bool fetchProfileSchema(const String& uid,String& nameOut,float& balOut){
  String resp; int code=0;
  if(httpGET(baseUrl+PROFILE_ENDPOINT+uid,resp,code)){
    // Serial.println("[schema GET] "+resp);
    return parseNameBalanceJSON_SCHEMA(resp,nameOut,balOut);
  }
  return false;
}
bool tryProfileLookupByUID(const String& uid,String& nameOut,float& balOut){
  // Prefer the stable balance endpoint; fallback list trimmed
  const char* paths[]={"/balance/"};
  for(size_t i=0;i<sizeof(paths)/sizeof(paths[0]);++i){
    String resp; int code=0;
    if(httpGET(baseUrl+String(paths[i])+uid,resp,code)){
      if(parseNameBalanceJSON_SCHEMA(resp,nameOut,balOut)) return true;
      if(parseNameBalanceFromAnyJSON(resp,nameOut,balOut)) return true;
    }else{
      if(code==204) continue;
      Serial.printf("Lookup try %s -> HTTP %d\n",paths[i],code);
    }
  }
  return false;
}

// ---------- RESULT (name-first fix) ----------
void showResultFromPostOrLookup(const String& postJSON,const String& uid,bool ok){
  String name=""; float bal=NAN;
  bool haveName=false, haveBal=false;

  if(fetchProfileSchema(uid,name,bal)){ haveName = name.length()>0; haveBal = !isnan(bal); }

  if((!haveName || !haveBal) && postJSON.length()){
    String n2=""; float b2=NAN;
    if(parseNameBalanceFromAnyJSON(postJSON,n2,b2)){
      if(!haveName && n2.length()){ name=n2; haveName=true; }
      if(!haveBal  && !isnan(b2)){ bal=b2; haveBal=true; }
    }
  }

  if(!haveName && WiFi.status()==WL_CONNECTED){
    String n3=""; float b3=NAN;
    if(tryProfileLookupByUID(uid,n3,b3)){
      if(n3.length()){ name=n3; haveName=true; }
      if(!haveBal && !isnan(b3)){ bal=b3; haveBal=true; }
    }
  }

  if(!haveName){ String nc=""; float bc=NAN; if(cacheGet(uid,nc,bc)){ if(nc.length()){ name=nc; haveName=true; } if(!haveBal && !isnan(bc)){ bal=bc; haveBal=true; } } }
  if(!haveName) name = "UID " + uid;

  if(!name.startsWith("UID ")) cachePut(uid,name,bal);

  showNameBalanceOnly(name, bal, ok);
  uiState = RESULT_SHOW;
  resultShowUntil = millis() + 2500UL;
}

// (legacy helper kept)
void showResultAndResetWithProfile(const String& uid,bool ok){
  delay(180);
  String name=""; float bal=NAN; bool got=false;
  if(WiFi.status()==WL_CONNECTED){
    got=fetchProfileSchema(uid,name,bal);
    if(!got){ String resp; int code=0; if(httpGET(baseUrl+PROFILE_ENDPOINT+uid,resp,code)){ got=parseNameBalanceFromAnyJSON(resp,name,bal);} }
  }
  if(!got){ if(!cacheGet(uid,name,bal)) name="UID "+uid; } else { cachePut(uid,name,bal); }
  showNameBalanceOnly(name,bal,ok); uiState=RESULT_SHOW; resultShowUntil=millis()+2500UL;
}

// =========================
// INIT / common
// =========================
String toHexUID(uint8_t* uid,uint8_t len){ String s=""; for(uint8_t i=0;i<len;i++){ if(uid[i]<0x10)s+="0"; s+=String(uid[i],HEX);} s.toUpperCase(); return s; }

void tftInit(){
  SPI.begin(TFT_SCLK,TFT_MISO,TFT_MOSI,TFT_CS);
#if TFT_IS_ILI9341
  tft.begin(); tft.setRotation(1);
#else
  tft.init(240,320); tft.setRotation(1);
#endif
  tftHeader("NEUTap Station"); tftLine(48,"Display ready",COL_GREEN,2);
}

void initClock(){ const long gmtOffset=8*3600; const int dst=0; configTime(gmtOffset,dst,"pool.ntp.org","time.nist.gov"); }

// =========================
// Pollers
// =========================
void pollPendingLink(){
  if(linkPendingId!=-1) return;
  String resp; int code=0;
  if(!httpGET(baseUrl+"/rfid/link/latest",resp,code)){
    if(code==204){linkPendingId=-1;return;}
    if(code) Serial.printf("Link poll failed: %d\n",code);
    if(!g_serverOK) showNoServerData();
    return;
  }
  int id=-1; StaticJsonDocument<256> doc; if(!deserializeJson(doc,resp)){ if(doc["id"].is<int>()) id=doc["id"].as<int>(); }
  if(id!=-1){
    linkPendingId=id; uiState=WAIT_PAIR; showModeBanner("PAIR",COL_YELLOW); clearWorkArea(); tftLine(120,"Tap a card...",COL_WHITE,2); markWaitStart();
  } else linkPendingId=-1;
}
void pollPendingReload(){
  if(reloadPendingId!=-1) return;
  String resp; int code=0;
  if(!httpGET(baseUrl+"/pending-reload/latest",resp,code)){
    if(code==204){reloadPendingId=-1;return;}
    if(code==401){
      // Staff auth now required for reload endpoints
      if(deviceUsername.length()==0 || devicePassword.length()==0){
        tftLine(90,"Auth needed for reloads",COL_YELLOW,2);
        tftLine(110,"Set staffJwt or device login",COL_YELLOW,2);
      }
      return;
    }
    if(code) Serial.printf("Reload poll failed: %d\n",code);
    if(!g_serverOK) showNoServerData();
    return;
  }
  int id=-1; StaticJsonDocument<256> doc; if(!deserializeJson(doc,resp)){ if(doc["id"].is<int>()) id=doc["id"].as<int>(); }
  if(id!=-1){
    reloadPendingId=id; uiState=WAIT_RELOAD; showModeBanner("RELOAD",COL_YELLOW); clearWorkArea(); tftLine(120,"Tap a card...",COL_WHITE,2); markWaitStart();
  } else reloadPendingId=-1;
}
void pollPendingSale(){
  String resp; int code=0;
  if(!httpGET(baseUrl+"/pending-sale/latest",resp,code)){
    if(code==204){salePendingId=-1;return;}
    if(code) Serial.printf("Sale poll failed: %d\n",code);
    if(!g_serverOK) showNoServerData();
    return;
  }
  int id=-1; float amt=0.0f; StaticJsonDocument<512> doc;
  if(!deserializeJson(doc,resp)){
    if(doc["id"].is<int>()) id=doc["id"].as<int>();
    if(doc["amount"].is<float>()||doc["amount"].is<double>()) amt=doc["amount"].as<float>();
    else if(doc["amount"].is<long>()||doc["amount"].is<int>()) amt=(float)doc["amount"].as<long>();
    else if(doc["amount"].is<const char*>()){ float f=parseFlexibleNumber(doc["amount"].as<const char*>()); if(!isnan(f)) amt=f; }
  }
  if(id!=-1){
    salePendingId=id; salePendingAmount=amt; uiState=WAIT_SALE; showModeBanner("SALE",COL_ORANGE); clearWorkArea();
    char buf[48]; snprintf(buf,sizeof(buf),"Charge: PHP %.2f",salePendingAmount);
    tftLine(100,buf,COL_CYAN,2); tftLine(130,"Tap a card...",COL_WHITE,2); markWaitStart();
  } else salePendingId=-1;
}

// =========================
// Confirm handlers
// =========================
void showResultFromPostOrLookup(const String& postJSON,const String& uid,bool ok); // fwd

void confirmLink(const String& uidStr){
  if(linkPendingId==-1) return; uiState=PROCESS_PAIR;
  String payload="{\"pending_id\":"+String(linkPendingId)+",\"uid\":\""+uidStr+"\",\"device_id\":\"enroll-station-1\"}";
  String resp; int code=0; bool ok=httpPOST(baseUrl+"/rfid/link/confirm",payload,resp,code);
  Serial.printf("Link confirm HTTP %d\n",code); if(code>0) Serial.println(resp);
  linkPendingId=-1; clearModeBanner(); showResultFromPostOrLookup(resp,uidStr,ok);
}
void confirmReload(const String& uidStr){
  if(reloadPendingId==-1) return; uiState=PROCESS_RELOAD;
  String payload="{\"pending_id\":"+String(reloadPendingId)+",\"uid\":\""+uidStr+"\"}";
  String resp; int code=0; bool ok=httpPOST(baseUrl+"/pending-reload/confirm",payload,resp,code);
  Serial.printf("Reload confirm HTTP %d\n",code); if(code>0) Serial.println(resp);
  reloadPendingId=-1; clearModeBanner(); showResultFromPostOrLookup(resp,uidStr,ok);
}
void confirmSale(const String& uidStr){
  if(salePendingId==-1) return; uiState=PROCESS_SALE;
  String payload="{\"pending_id\":"+String(salePendingId)+",\"uid\":\""+uidStr+"\"}";
  String resp; int code=0; bool ok=httpPOST(baseUrl+"/pending-sale/confirm",payload,resp,code);
  Serial.printf("Sale confirm HTTP %d\n",code); if(code>0) Serial.println(resp);
  salePendingId=-1; clearModeBanner(); showResultFromPostOrLookup(resp,uidStr,ok);
}

// =========================
void connectWiFi(){
  tftLine(64,"WiFi: connecting...",COL_YELLOW,2);
  WiFi.mode(WIFI_STA); WiFi.setSleep(false); WiFi.persistent(false); WiFi.setAutoReconnect(true); WiFi.begin(ssid,password);
  unsigned long start=millis(); while(WiFi.status()!=WL_CONNECTED&&(millis()-start)<45000UL){ delay(250); drawClock(); }
  if(WiFi.status()==WL_CONNECTED){ tftLine(64,"WiFi: connected",COL_GREEN,2); drawStatusDots(); initClock(); }
  else                           { tftLine(64,"WiFi: offline (retry)",COL_RED,2); }
}

void setup(){
  Serial.begin(115200); delay(100);
  tftInit(); connectWiFi();

  // Attempt auto-login to obtain staff JWT
  if(deviceUsername.length()>0 && devicePassword.length()>0){
    bool ok=autoLoginIfNeeded();
    tftLine(74, ok?"Device login: OK":"Device login: failed", ok?COL_GREEN:COL_YELLOW, 2);
  }

  tftLine(84,"PN532: init...",COL_WHITE,2);
  Wire.begin(SDA_PIN,SCL_PIN,400000);
  nfc.begin();
  uint32_t ver=nfc.getFirmwareVersion();
  if(!ver){ Serial.println("❌ Didn't find PN532 over I2C"); tftLine(84,"PN532: NOT FOUND",COL_RED,2); tftLine(104,"Check 21/22 + IRQ=4 RST=5",COL_YELLOW,2); while(1){ drawClock(); delay(250);} }
  g_pnVerStr="PN532 v"+String((ver>>16)&0xFF)+"."+String((ver>>8)&0xFF);
  tftLine(84,g_pnVerStr,COL_GREEN,2);
  nfc.SAMConfig();

  tftHeader("NEUTap Station"); tftLine(110,"Waiting for tasks...",COL_WHITE,2); uiState=IDLE;
  g_prevWiFiConnected=(WiFi.status()==WL_CONNECTED);
}

void loop(){
  drawClock();
  bool nowWiFi=(WiFi.status()==WL_CONNECTED);

  if(!nowWiFi && g_prevWiFiConnected){ g_prevWiFiConnected=false; resetToIdleScreen("WiFi lost. Reconnecting..."); return; }
  if(nowWiFi && !g_prevWiFiConnected){ g_prevWiFiConnected=true; initClock(); resetToIdleScreen(); }

  if(!nowWiFi){
    static unsigned long lastRetry=0; static int retry=0;
    if(millis()-lastRetry>10000UL){ lastRetry=millis(); retry++; if(retry>=3){ WiFi.disconnect(true); delay(800); connectWiFi(); retry=0; } else { WiFi.reconnect(); } drawStatusDots(); }
    return;
  }

  if(uiState==RESULT_SHOW && (int32_t)(millis()-resultShowUntil)>=0){ resetToIdleScreen(); }
  if((uiState==WAIT_PAIR||uiState==WAIT_RELOAD||uiState==WAIT_SALE) && waitTimedOut()){ resetToIdleScreen("Timed out. Returning to queue."); }

  unsigned long now=millis();
  if(uiState==IDLE){
    if(now-lastPollLink>3000UL){ lastPollLink=now; pollPendingLink(); }
    if(uiState==IDLE && now-lastPollReload>3500UL){ lastPollReload=now; pollPendingReload(); }
    if(uiState==IDLE && now-lastPollSale>4000UL){ lastPollSale=now; pollPendingSale(); }
  }

  if(uiState==WAIT_PAIR||uiState==WAIT_RELOAD||uiState==WAIT_SALE){
    uint8_t uid[7]; uint8_t uidLen;
    if(nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A,uid,&uidLen)){
      String uidStr=toHexUID(uid,uidLen); Serial.print("Card tapped UID: "); Serial.println(uidStr);
      if(uiState==WAIT_PAIR)      confirmLink(uidStr);
      else if(uiState==WAIT_RELOAD) confirmReload(uidStr);
      else if(uiState==WAIT_SALE)   confirmSale(uidStr);
    }
  }
}
