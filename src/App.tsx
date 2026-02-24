import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, FileCode2, BookOpen, Flame, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EnhancedDashboard from './components/EnhancedDashboard';
import ScheduleEditor from './components/ScheduleEditor';
import CodeViewer from './components/CodeViewer';
import Documentation from './components/Documentation';
import { KilnStatus, Schedule } from './types';

// Mock Data for UI
const mockSchedules: Schedule[] = [
  {
    id: '1',
    name: 'Bisque Firing (Cone 04)',
    steps: [
      { id: 's1', type: 'ramp', targetTemp: 100, rate: 50 },
      { id: 's2', type: 'hold', targetTemp: 100, duration: 60 },
      { id: 's3', type: 'ramp', targetTemp: 1060, rate: 150 },
      { id: 's4', type: 'hold', targetTemp: 1060, duration: 15 },
    ]
  },
  {
    id: '2',
    name: 'Glaze Firing (Cone 6)',
    steps: [
      { id: 's1', type: 'ramp', targetTemp: 1222, rate: 150 },
      { id: 's2', type: 'hold', targetTemp: 1222, duration: 15 },
      { id: 's3', type: 'cool', targetTemp: 1000, rate: 100 },
    ]
  }
];

// Load raw files for CodeViewer (mocked here for the demo)
const sourceFiles = [
  {
    name: 'enhanced_main.cpp',
    language: 'cpp',
    icon: <FileCode2 size={16} className="text-blue-400" />,
    content: `/**
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

// State
enum KilnState { IDLE, HEATING, HOLDING, COOLING, ERROR_STATE };
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
  kilnPID.Compute();
  
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
  
  server.begin();
}`
  },
  {
    name: 'display_gui.cpp',
    language: 'cpp',
    icon: <FileCode2 size={16} className="text-blue-400" />,
    content: `/**
 * @file display_gui.cpp
 * @brief TFT Touchscreen GUI for Kiln Controller
 * @details Uses TFT_eSPI and LVGL for a TAP II-like interface.
 */

#include <TFT_eSPI.h>
#include <lvgl.h>

TFT_eSPI tft = TFT_eSPI();

/* LVGL Display Buffer */
static lv_disp_draw_buf_t draw_buf;
static lv_color_t buf[320 * 10]; // Adjust for 4.3" resolution e.g., 480x272

/* Touchpad read function */
void my_touchpad_read(lv_indev_drv_t * indev_driver, lv_indev_data_t * data) {
    uint16_t touchX, touchY;
    bool touched = tft.getTouch(&touchX, &touchY);
    if (!touched) {
        data->state = LV_INDEV_STATE_REL;
    } else {
        data->state = LV_INDEV_STATE_PR;
        data->point.x = touchX;
        data->point.y = touchY;
    }
}

/* Display flush function */
void my_disp_flush(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);
    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t *)&color_p->full, w * h, true);
    tft.endWrite();
    lv_disp_flush_ready(disp);
}

// UI Elements
lv_obj_t * temp_label;
lv_obj_t * state_label;
lv_obj_t * start_btn;

void btn_event_cb(lv_event_t * e) {
    lv_event_code_t code = lv_event_get_code(e);
    if(code == LV_EVENT_CLICKED) {
        // Toggle Start/Stop Firing
    }
}

void setupDisplay() {
    lv_init();
    tft.begin();
    tft.setRotation(1); // Landscape
    uint16_t calData[5] = { 275, 3620, 264, 3532, 1 };
    tft.setTouch(calData);

    lv_disp_draw_buf_init(&draw_buf, buf, NULL, 320 * 10);
    
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = 480;
    disp_drv.ver_res = 272;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;
    lv_indev_drv_register(&indev_drv);

    // Build UI (Home Screen)
    lv_obj_t * scr = lv_scr_act();
    lv_obj_set_style_bg_color(scr, lv_color_hex(0x1a1a1a), LV_PART_MAIN); // Dark theme

    temp_label = lv_label_create(scr);
    lv_label_set_text(temp_label, "20°C");
    lv_obj_set_style_text_font(temp_label, &lv_font_montserrat_48, 0);
    lv_obj_set_style_text_color(temp_label, lv_color_hex(0xffffff), 0);
    lv_obj_align(temp_label, LV_ALIGN_CENTER, 0, -40);

    state_label = lv_label_create(scr);
    lv_label_set_text(state_label, "IDLE");
    lv_obj_set_style_text_color(state_label, lv_color_hex(0x888888), 0);
    lv_obj_align(state_label, LV_ALIGN_CENTER, 0, 20);

    start_btn = lv_btn_create(scr);
    lv_obj_add_event_cb(start_btn, btn_event_cb, LV_EVENT_ALL, NULL);
    lv_obj_align(start_btn, LV_ALIGN_BOTTOM_MID, 0, -20);
    lv_obj_t * btn_label = lv_label_create(start_btn);
    lv_label_set_text(btn_label, "START FIRING");
}

void updateDisplay(double temp, double setpoint, int state) {
    char tempStr[16];
    sprintf(tempStr, "%.1f°C", temp);
    lv_label_set_text(temp_label, tempStr);
    
    switch(state) {
        case 0: lv_label_set_text(state_label, "IDLE"); break;
        case 1: lv_label_set_text(state_label, "HEATING"); break;
        case 2: lv_label_set_text(state_label, "HOLDING"); break;
        case 3: lv_label_set_text(state_label, "COOLING"); break;
        case 4: lv_label_set_text(state_label, "ERROR"); break;
    }
    lv_timer_handler();
}`
  },
  {
    name: 'server.ts',
    language: 'typescript',
    icon: <FileCode2 size={16} className="text-yellow-400" />,
    content: `import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupEnhancedApi } from './enhanced_api';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Setup API Routes
setupEnhancedApi(app, io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(\`Kiln Backend running on port \${PORT}\`);
});`
  },
  {
    name: 'enhanced_api.ts',
    language: 'typescript',
    icon: <FileCode2 size={16} className="text-yellow-400" />,
    content: `import { Express, Request, Response } from 'express';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';

// Mock State
let kilnState = {
  currentTemp: 22.5,
  setpoint: 0,
  state: 'idle',
  currentScheduleId: null,
  currentStepIndex: 0,
  timeRemaining: 0,
  error: null
};

// Schedules Storage
const SCHEDULES_FILE = path.join(__dirname, 'schedules.json');

const loadSchedules = () => {
  if (fs.existsSync(SCHEDULES_FILE)) {
    return JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));
  }
  return [];
};

const saveSchedules = (schedules: any) => {
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
};

export const setupEnhancedApi = (app: Express, io: Server) => {
  // --- REST Endpoints ---
  
  // Get Status
  app.get('/api/status', (req: Request, res: Response) => {
    res.json(kilnState);
  });

  // Control Kiln
  app.post('/api/control', (req: Request, res: Response) => {
    const { action, scheduleId } = req.body;
    if (action === 'start') {
      kilnState.state = 'heating';
      kilnState.currentScheduleId = scheduleId;
      kilnState.currentStepIndex = 0;
      io.emit('status', kilnState);
      res.json({ success: true, message: 'Firing started' });
    } else if (action === 'stop') {
      kilnState.state = 'idle';
      kilnState.currentScheduleId = null;
      io.emit('status', kilnState);
      res.json({ success: true, message: 'Firing stopped' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  });

  // Schedule CRUD
  app.get('/api/schedules', (req: Request, res: Response) => {
    res.json(loadSchedules());
  });

  app.post('/api/schedules', (req: Request, res: Response) => {
    const newSchedule = req.body;
    const schedules = loadSchedules();
    schedules.push(newSchedule);
    saveSchedules(schedules);
    res.json({ success: true, schedule: newSchedule });
  });

  app.put('/api/schedules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedSchedule = req.body;
    let schedules = loadSchedules();
    schedules = schedules.map((s: any) => s.id === id ? updatedSchedule : s);
    saveSchedules(schedules);
    res.json({ success: true });
  });

  app.delete('/api/schedules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    let schedules = loadSchedules();
    schedules = schedules.filter((s: any) => s.id !== id);
    saveSchedules(schedules);
    res.json({ success: true });
  });

  // --- WebSocket Real-time Updates ---
  io.on('connection', (socket) => {
    console.log('Client connected to WebSocket');
    socket.emit('status', kilnState);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Simulation loop for demo purposes
  setInterval(() => {
    if (kilnState.state === 'heating') {
      kilnState.currentTemp += 2.5; // Simulate heating
      if (kilnState.currentTemp > 1000) kilnState.state = 'holding';
      io.emit('status', kilnState);
    }
  }, 2000);
};`
  }
];

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedules' | 'code' | 'docs'>('dashboard');
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  
  // Mock Kiln Status State
  const [status, setStatus] = useState<KilnStatus>({
    currentTemp: 22.5,
    setpoint: 0,
    state: 'idle',
    timeRemaining: 0,
  });

  // Simulation effect for the dashboard graph
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status.state === 'heating') {
      interval = setInterval(() => {
        setStatus(prev => {
          const newTemp = prev.currentTemp + (Math.random() * 2 + 1);
          if (newTemp >= prev.setpoint) {
            return { ...prev, currentTemp: prev.setpoint, state: 'holding' };
          }
          return { ...prev, currentTemp: newTemp };
        });
      }, 1000);
    } else if (status.state === 'holding') {
      interval = setInterval(() => {
        setStatus(prev => ({
          ...prev,
          currentTemp: prev.setpoint + (Math.random() * 2 - 1) // fluctuate around setpoint
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status.state, status.setpoint]);

  const handleStart = () => {
    setStatus({
      ...status,
      state: 'heating',
      setpoint: 1060, // Mock target
      currentStepIndex: 0,
      timeRemaining: 360,
    });
  };

  const handleStop = () => {
    setStatus({
      ...status,
      state: 'idle',
      setpoint: 0,
      currentStepIndex: undefined,
      timeRemaining: 0,
    });
  };

  const handleAutotune = () => {
    setStatus({
      ...status,
      state: 'autotune',
      setpoint: 100, // Mock target for autotune
      timeRemaining: 0,
    });
    
    // Simulate autotune completion
    setTimeout(() => {
      setStatus(prev => prev.state === 'autotune' ? { ...prev, state: 'idle' } : prev);
    }, 10000);
  };

  const handleSkip = () => {
    if (status.currentStepIndex !== undefined) {
      setStatus({
        ...status,
        currentStepIndex: status.currentStepIndex + 1
      });
    }
  };

  const handleSaveSchedule = (schedule: Schedule) => {
    setSchedules(prev => {
      const exists = prev.find(s => s.id === schedule.id);
      if (exists) return prev.map(s => s.id === schedule.id ? schedule : s);
      return [...prev, schedule];
    });
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Top Navigation */}
      <nav className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Flame size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">{t('kilnPro')}</span>
            </div>
            
            <div className="flex space-x-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">{t('dashboard')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('schedules')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === 'schedules' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                <CalendarDays size={16} /> <span className="hidden sm:inline">{t('schedules')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                <FileCode2 size={16} /> <span className="hidden sm:inline">{t('sourceCode')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === 'docs' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                <BookOpen size={16} /> <span className="hidden sm:inline">{t('docs')}</span>
              </button>
              
              <div className="pl-4 ml-2 border-l border-zinc-800 flex items-center">
                <button 
                  onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ua' : 'en')}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors flex items-center space-x-2"
                  title="Toggle Language"
                >
                  <Globe size={16} />
                  <span className="text-xs font-bold uppercase">{i18n.language}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <EnhancedDashboard status={status} onStart={handleStart} onStop={handleStop} onSkip={handleSkip} onAutotune={handleAutotune} />
        )}
        {activeTab === 'schedules' && (
          <ScheduleEditor schedules={schedules} onSave={handleSaveSchedule} onDelete={handleDeleteSchedule} />
        )}
        {activeTab === 'code' && (
          <CodeViewer files={sourceFiles} />
        )}
        {activeTab === 'docs' && (
          <Documentation />
        )}
      </main>
    </div>
  );
}
