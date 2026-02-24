/**
 * @file enhanced_main.cpp
 * @brief Enhanced Kiln Controller Firmware for ESP32-S3
 * @details Inspired by TAP II Controller. Handles MAX31855/MAX31856, PID, SSR control, WiFi, and API.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <PID_v1.h>
#include <PID_AutoTune_v0.h>
#include <Adafruit_MAX31855.h> // Or MAX31856
#include <ArduinoJson.h>

// --- Configuration ---
#define HAS_DISPLAY 1 // Set to 0 for headless mode

// Pins for ESP32-S3
#define MAXDO   12
#define MAXCS   13
#define MAXCLK  14
#define SSR_PIN 15
#define DOOR_SWITCH_PIN 16

// Safety Limits
#define MAX_TEMP 1300.0 // °C
#define WATCHDOG_TIMEOUT 30000 // 30s

// --- Globals ---
Adafruit_MAX31855 thermocouple(MAXCLK, MAXCS, MAXDO);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// PID Variables
double setpoint = 20.0, input = 20.0, output = 0.0;
double Kp = 2.0, Ki = 5.0, Kd = 1.0;
PID kilnPID(&input, &output, &setpoint, Kp, Ki, Kd, DIRECT);

// PID Autotune
PID_ATune aTune(&input, &output);
bool tuning = false;
double aTuneStep = 50, aTuneNoise = 1, aTuneStartValue = 100;
unsigned int aTuneLookBack = 20;

// State
enum KilnState { IDLE, HEATING, HOLDING, COOLING, ERROR_STATE, AUTOTUNE };
KilnState currentState = IDLE;
String errorMessage = "";

// Time tracking for SSR PWM
int windowSize = 5000; // 5 seconds
unsigned long windowStartTime;

// Function Prototypes
void setupWiFi();
void setupAPI();
void updatePID();
void handleSafety();
void notifyClients();
void startAutoTune();
void finishAutoTune();

#if HAS_DISPLAY
extern void setupDisplay();
extern void updateDisplay(double temp, double setpoint, KilnState state);
#endif

void setup() {
  Serial.begin(115200);
  
  // Init SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  // Init Hardware
  pinMode(SSR_PIN, OUTPUT);
  pinMode(DOOR_SWITCH_PIN, INPUT_PULLUP);
  
  if (!thermocouple.begin()) {
    currentState = ERROR_STATE;
    errorMessage = "Thermocouple Error";
  }

  // Init PID
  kilnPID.SetOutputLimits(0, windowSize);
  kilnPID.SetMode(AUTOMATIC);
  windowStartTime = millis();

  setupWiFi();
  setupAPI();
  
#if HAS_DISPLAY
  setupDisplay();
#endif

  Serial.println("Kiln Controller Initialized.");
}

void loop() {
  handleSafety();
  
  if (currentState != ERROR_STATE) {
    input = thermocouple.readCelsius();
    if (isnan(input)) {
      currentState = ERROR_STATE;
      errorMessage = "Thermocouple Read Error";
    } else {
      updatePID();
    }
  } else {
    digitalWrite(SSR_PIN, LOW); // Fail-safe
  }

#if HAS_DISPLAY
  updateDisplay(input, setpoint, currentState);
#endif

  // Broadcast state every 2 seconds
  static unsigned long lastNotify = 0;
  if (millis() - lastNotify > 2000) {
    notifyClients();
    lastNotify = millis();
  }
  
  ws.cleanupClients();
}

void handleSafety() {
  if (input > MAX_TEMP) {
    currentState = ERROR_STATE;
    errorMessage = "Over-temperature Limit Exceeded!";
  }
  if (digitalRead(DOOR_SWITCH_PIN) == LOW && currentState != IDLE) {
    // Door open, pause heating
    digitalWrite(SSR_PIN, LOW);
  }
}

void updatePID() {
  if (tuning) {
    byte val = (aTune.Runtime());
    if (val != 0) {
      tuning = false;
      finishAutoTune();
    }
  } else {
    kilnPID.Compute();
  }
  
  // Time Proportional Output for SSR
  unsigned long now = millis();
  if (now - windowStartTime > windowSize) {
    windowStartTime += windowSize;
  }
  if (output > now - windowStartTime) {
    digitalWrite(SSR_PIN, HIGH);
  } else {
    digitalWrite(SSR_PIN, LOW);
  }
}

void startAutoTune() {
  tuning = true;
  currentState = AUTOTUNE;
  aTune.SetNoiseBand(aTuneNoise);
  aTune.SetOutputStep(aTuneStep);
  aTune.SetLookbackSec((int)aTuneLookBack);
  Serial.println("Starting PID Autotune...");
}

void finishAutoTune() {
  Kp = aTune.GetKp();
  Ki = aTune.GetKi();
  Kd = aTune.GetKd();
  kilnPID.SetTunings(Kp, Ki, Kd);
  currentState = IDLE;
  Serial.printf("Autotune complete. Kp: %.2f, Ki: %.2f, Kd: %.2f\n", Kp, Ki, Kd);
  // Save to SPIFFS or EEPROM here
}

void setupWiFi() {
  // Try STA, fallback to AP
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin("YOUR_SSID", "YOUR_PASS");
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    retries++;
  }
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.softAP("Kiln_Controller", "12345678");
  }
}

void notifyClients() {
  StaticJsonDocument<256> doc;
  doc["currentTemp"] = input;
  doc["setpoint"] = setpoint;
  doc["state"] = currentState;
  doc["error"] = errorMessage;
  
  String output;
  serializeJson(doc, output);
  ws.textAll(output);
}

void setupAPI() {
  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
    if (type == WS_EVT_CONNECT) {
      Serial.println("WebSocket client connected");
    }
  });
  server.addHandler(&ws);
  
  // REST API Endpoints
  server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest *request){
    StaticJsonDocument<256> doc;
    doc["currentTemp"] = input;
    doc["setpoint"] = setpoint;
    doc["state"] = currentState;
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  server.on("/api/autotune", HTTP_POST, [](AsyncWebServerRequest *request){
    startAutoTune();
    request->send(200, "application/json", "{\"success\":true,\"message\":\"Autotune started\"}");
  });
  
  server.begin();
}
