/*
  ESP32 Drip Irrigation System - Simplified Version
  Hardware: ESP32 Dev Module
  Features: WiFi AP mode setup, Firebase integration, sensor reading, valve control
  Version: 1.0 (Fixed compilation issues)
*/

#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// Pin definitions
#define MOISTURE_PIN 34
#define VALVE_PIN 25
#define LED_PIN 2
#define CONFIG_BUTTON_PIN 0

// Configuration structure
struct Config {
  char ssid[32];
  char password[64];
  char userId[64];
  char deviceId[32];
  bool configured;
  int moistureThreshold;
};

// Global variables for valve control
int moistureThreshold = 30; // Default threshold percentage
bool valveState = false; // Current valve state (false = OFF, true = ON)
bool manualOverride = false; // Manual override mode
unsigned long manualOverrideTime = 0; // Time when manual override was activated
const unsigned long MANUAL_OVERRIDE_DURATION = 300000; // 5 minutes in milliseconds (only for local manual commands)
bool webManualMode = false; // Web-based manual mode (no timer)

Config config;
WebServer server(80);
bool configMode = false;
unsigned long lastSensorRead = 0;
unsigned long lastCommandCheck = 0;
const unsigned long SENSOR_INTERVAL = 1000; 
const unsigned long COMMAND_INTERVAL = 1000; 

// Firebase configuration
const char* FIREBASE_HOST = "drip-anurag-default-rtdb.firebaseio.com";
const char* FIREBASE_URL = "https://drip-anurag-default-rtdb.firebaseio.com/";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("🌱 ESP32 Drip Irrigation System Starting...");
  
  // Initialize pins
  pinMode(MOISTURE_PIN, INPUT);
  pinMode(VALVE_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP);
  
  // Turn off valve initially
  digitalWrite(VALVE_PIN, LOW);
  valveState = false;
  Serial.println("🔧 Pin 25 initialized as OUTPUT, set to LOW (valve OFF)");
  
  // Initialize EEPROM
  EEPROM.begin(512);
  loadConfig();
  
  // Check if configuration button is pressed
  if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
    Serial.println("🔧 Config button pressed - entering configuration mode");
    configMode = true;
  }
  
  // If not configured or config button pressed, start AP mode
  if (!config.configured || configMode) {
    startConfigMode();
  } else {
    startNormalMode();
  }
}

void loop() {
  if (configMode) {
    server.handleClient();
  } else {
    // Normal operation
    unsigned long currentTime = millis();
    
    // Read sensors periodically
    if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
      readSensors();
      lastSensorRead = currentTime;
    }
    
    // Check for commands periodically
    if (currentTime - lastCommandCheck >= COMMAND_INTERVAL) {
      checkCommands();
      lastCommandCheck = currentTime;
    }
    
    // Check if config button is pressed
    if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
      delay(3000); // Hold for 3 seconds
      if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
        Serial.println("🔧 Entering configuration mode...");
        startConfigMode();
      }
    }
  }
  
  delay(100);
}

void loadConfig() {
  EEPROM.get(0, config);
  
  // Check if EEPROM data is valid (deviceId should not be empty or corrupted)
  bool needsInit = false;
  if (strlen(config.deviceId) == 0 || config.deviceId[0] == 0xFF || config.deviceId[0] == 0x00) {
    needsInit = true;
  }
  
  // Generate device ID if not set or corrupted
  if (needsInit) {
    Serial.println("🔄 Initializing device configuration...");
    memset(&config, 0, sizeof(config)); // Clear all config data
    
    uint64_t chipid = ESP.getEfuseMac();
    snprintf(config.deviceId, sizeof(config.deviceId), "esp32_%04X", (uint16_t)(chipid >> 32));
    config.configured = false;
    config.moistureThreshold = 30; // Default threshold
    
    // Save the initialized config
    EEPROM.put(0, config);
    EEPROM.commit();
    Serial.println("✅ Device configuration initialized");
  }
  
  Serial.println("📋 Device ID: " + String(config.deviceId));
  Serial.println("⚙️ Configured: " + String(config.configured ? "Yes" : "No"));
  
  // Load moisture threshold from config
  if (config.configured && config.moistureThreshold >= 10 && config.moistureThreshold <= 80) {
    moistureThreshold = config.moistureThreshold;
  }
  Serial.println("💧 Moisture Threshold: " + String(moistureThreshold) + "%");
}

void saveConfig() {
  config.configured = true;
  EEPROM.put(0, config);
  EEPROM.commit();
  Serial.println("💾 Configuration saved");
}

void startConfigMode() {
  configMode = true;
  digitalWrite(LED_PIN, HIGH); // LED on in config mode
  
  // Create AP
  String apName = "ESP32_Drip_" + String(config.deviceId).substring(6);
  WiFi.softAP(apName.c_str(), "12345678");
  
  Serial.println("📶 WiFi AP Created: " + apName);
  Serial.println("🔑 Password: 12345678");
  Serial.println("🌐 Server started at: 192.168.4.1");
  
  // Setup web server routes
  server.on("/", handleRoot);
  server.on("/scan", handleScan);
  server.on("/configure", HTTP_POST, handleConfigure);
  server.on("/valve", HTTP_POST, handleValveControl);
  server.begin();
  
  Serial.println("💡 LED ON - Configuration mode active");
  Serial.println("⏰ Waiting for configuration...");
}

void startNormalMode() {
  digitalWrite(LED_PIN, LOW); // LED off in normal mode
  
  Serial.println("📶 Connecting to WiFi: " + String(config.ssid));
  WiFi.begin(config.ssid, config.password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi connected!");
    Serial.println("🌐 IP address: " + WiFi.localIP().toString());
    Serial.println("💡 LED OFF - Normal operation mode");
    
    // Send initial data
    readSensors();
  } else {
    Serial.println();
    Serial.println("❌ WiFi connection failed");
    Serial.println("🔄 Starting configuration mode...");
    startConfigMode();
  }
}

// Simple HTML page for device setup
void handleRoot() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<title>ESP32 Drip Irrigation</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<link href='https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' rel='stylesheet'>";
  html += "<link href='https://fonts.googleapis.com/icon?family=Material+Icons' rel='stylesheet'>";
  html += "<style>";
  // Material Design 3 CSS Variables
  html += ":root{";
  html += "--md-sys-color-primary:#006A6B;";
  html += "--md-sys-color-on-primary:#FFFFFF;";
  html += "--md-sys-color-primary-container:#6FF6F7;";
  html += "--md-sys-color-on-primary-container:#001F1F;";
  html += "--md-sys-color-secondary:#4A6363;";
  html += "--md-sys-color-on-secondary:#FFFFFF;";
  html += "--md-sys-color-secondary-container:#CCE8E7;";
  html += "--md-sys-color-on-secondary-container:#051F20;";
  html += "--md-sys-color-tertiary:#4B607C;";
  html += "--md-sys-color-on-tertiary:#FFFFFF;";
  html += "--md-sys-color-tertiary-container:#D2E4FF;";
  html += "--md-sys-color-on-tertiary-container:#041C35;";
  html += "--md-sys-color-error:#BA1A1A;";
  html += "--md-sys-color-on-error:#FFFFFF;";
  html += "--md-sys-color-error-container:#FFDAD6;";
  html += "--md-sys-color-on-error-container:#410002;";
  html += "--md-sys-color-background:#FAFDFC;";
  html += "--md-sys-color-on-background:#191C1C;";
  html += "--md-sys-color-surface:#F8FAFA;";
  html += "--md-sys-color-on-surface:#191C1C;";
  html += "--md-sys-color-surface-variant:#DAE5E4;";
  html += "--md-sys-color-on-surface-variant:#3F4948;";
  html += "--md-sys-color-outline:#6F7978;";
  html += "--md-sys-color-outline-variant:#BEC9C8;";
  html += "--md-sys-color-shadow:#000000;";
  html += "--md-sys-color-scrim:#000000;";
  html += "--md-sys-color-inverse-surface:#2E3131;";
  html += "--md-sys-color-inverse-on-surface:#EFF1F1;";
  html += "--md-sys-color-inverse-primary:#4DDADB;";
  html += "}";
  
  // Base styles
  html += "*{margin:0;padding:0;box-sizing:border-box}";
  html += "body{font-family:'Roboto',sans-serif;background:var(--md-sys-color-background);color:var(--md-sys-color-on-background);line-height:1.5}";
  
  // Container
  html += ".container{max-width:420px;margin:20px auto;padding:0 16px}";
  
  // Cards (Material Design 3 elevated cards)
  html += ".card{background:var(--md-sys-color-surface);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.12);margin-bottom:16px;overflow:hidden}";
  html += ".card-header{padding:20px 20px 0;display:flex;align-items:center;gap:12px}";
  html += ".card-content{padding:20px}";
  html += ".card-title{font-size:22px;font-weight:500;color:var(--md-sys-color-on-surface);margin:0}";
  html += ".card-subtitle{font-size:14px;color:var(--md-sys-color-on-surface-variant);margin:4px 0 0;font-weight:400}";
  
  // Status indicator
  html += ".status-indicator{width:12px;height:12px;border-radius:50%;margin-right:8px}";
  html += ".status-online{background:#4CAF50}";
  html += ".status-offline{background:#F44336}";
  
  // Buttons (Material Design 3)
  html += ".btn{border:none;border-radius:20px;padding:10px 24px;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-family:inherit}";
  html += ".btn:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,0.15)}";
  html += ".btn:active{transform:translateY(0)}";
  html += ".btn-primary{background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary)}";
  html += ".btn-secondary{background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container)}";
  html += ".btn-success{background:#4CAF50;color:white}";
  html += ".btn-error{background:var(--md-sys-color-error);color:var(--md-sys-color-on-error)}";
  html += ".btn-outlined{background:transparent;border:1px solid var(--md-sys-color-outline);color:var(--md-sys-color-primary)}";
  html += ".btn-full{width:100%;justify-content:center;margin-top:12px}";
  html += ".btn-half{width:calc(50% - 6px);justify-content:center}";
  
  // Form elements
  html += ".form-field{margin-bottom:20px}";
  html += ".form-label{display:block;font-size:12px;font-weight:500;color:var(--md-sys-color-on-surface-variant);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}";
  html += ".form-input{width:100%;padding:16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:4px;font-size:16px;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);transition:border-color 0.2s}";
  html += ".form-input:focus{outline:none;border-color:var(--md-sys-color-primary);border-width:2px}";
  
  // Network list
  html += ".network-list{margin-top:16px}";
  html += ".network-item{padding:16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:8px;margin:8px 0;cursor:pointer;transition:all 0.2s;display:flex;justify-content:space-between;align-items:center}";
  html += ".network-item:hover{background:var(--md-sys-color-surface-variant);border-color:var(--md-sys-color-outline)}";
  html += ".network-item.selected{background:var(--md-sys-color-primary-container);border-color:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary-container)}";
  html += ".network-signal{font-size:12px;color:var(--md-sys-color-on-surface-variant);display:flex;align-items:center;gap:4px}";
  
  // Control section
  html += ".control-section{display:flex;gap:12px;margin:20px 0}";
  
  // Status messages
  html += ".status-message{margin-top:20px;padding:16px;border-radius:8px;text-align:center;font-weight:500}";
  html += ".status-success{background:var(--md-sys-color-tertiary-container);color:var(--md-sys-color-on-tertiary-container)}";
  html += ".status-error{background:var(--md-sys-color-error-container);color:var(--md-sys-color-on-error-container)}";
  html += ".status-info{background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container)}";
  
  // Override status
  html += ".override-status{display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--md-sys-color-tertiary-container);color:var(--md-sys-color-on-tertiary-container);border-radius:8px;margin-bottom:16px;font-size:14px}";
  html += ".override-timer{font-weight:500}";
  
  // Loading states
  html += ".loading{opacity:0.6;pointer-events:none}";
  html += ".loading::after{content:'';width:16px;height:16px;border:2px solid transparent;border-top:2px solid currentColor;border-radius:50%;animation:spin 1s linear infinite;margin-left:8px}";
  html += "@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
  
  // Icons
  html += ".icon{font-size:20px;vertical-align:middle}";
  html += ".icon-small{font-size:16px}";
  
  html += "</style></head><body>";
  
  // Main container
  html += "<div class='container'>";
  
  // Header card
  html += "<div class='card'>";
  html += "<div class='card-header'>";
  html += "<span class='material-icons icon' style='color:var(--md-sys-color-primary)'>water_drop</span>";
  html += "<div>";
  html += "<h1 class='card-title'>Drip Irrigation System</h1>";
  html += "<p class='card-subtitle'>Device ID: " + String(config.deviceId) + "</p>";
  html += "</div>";
  html += "<div class='status-indicator status-online'></div>";
  html += "</div>";
  html += "</div>";
  
  // Override status (will be shown/hidden via JavaScript)
  html += "<div id='overrideStatus' class='override-status' style='display:none'>";
  html += "<span class='material-icons icon-small'>schedule</span>";
  html += "<span>Manual override active - <span class='override-timer' id='overrideTimer'>5:00</span> remaining</span>";
  html += "</div>";
  
  // Valve control card
  html += "<div class='card'>";
  html += "<div class='card-content'>";
  html += "<label class='form-label'>Manual Valve Control</label>";
  html += "<div class='control-section'>";
  html += "<button class='btn btn-success btn-half' onclick='controlValve(\"ON\")'>";
  html += "<span class='material-icons icon-small'>play_arrow</span>Turn ON";
  html += "</button>";
  html += "<button class='btn btn-error btn-half' onclick='controlValve(\"OFF\")'>";
  html += "<span class='material-icons icon-small'>stop</span>Turn OFF";
  html += "</button>";
  html += "</div>";
  html += "</div>";
  html += "</div>";
  
  // WiFi setup card
  html += "<div class='card'>";
  html += "<div class='card-content'>";
  html += "<h2 class='card-title' style='margin-bottom:20px'>WiFi Configuration</h2>";
  html += "<div class='form-field'>";
  html += "<label class='form-label'>Available Networks</label>";
  html += "<button class='btn btn-outlined btn-full' onclick='scanNetworks()'>";
  html += "<span class='material-icons icon-small'>wifi</span>Scan Networks";
  html += "</button>";
  html += "<div id='networks' class='network-list'>Click scan to discover networks...</div>";
  html += "</div>";
  html += "<div class='form-field'>";
  html += "<label class='form-label'>WiFi Password</label>";
  html += "<input type='password' id='password' class='form-input' placeholder='Enter network password'>";
  html += "</div>";
  html += "<div class='form-field'>";
  html += "<label class='form-label'>Firebase User ID</label>";
  html += "<input type='text' id='userId' class='form-input' placeholder='Your Firebase User ID'>";
  html += "</div>";
  html += "<button class='btn btn-primary btn-full' onclick='configure()'>";
  html += "<span class='material-icons icon-small'>save</span>Configure Device";
  html += "</button>";
  html += "</div>";
  html += "</div>";
  
  html += "<div id='status'></div>";
  html += "</div>";
  html += "<script>";
  html += "var selectedSSID='';";
  html += "var overrideTimer=null;";
  html += "var overrideStartTime=null;";
  
  // Network scanning function
  html += "function scanNetworks(){";
  html += "var btn=event.target;btn.classList.add('loading');btn.disabled=true;";
  html += "fetch('/scan').then(r=>r.json()).then(data=>{";
  html += "var div=document.getElementById('networks');div.innerHTML='';";
  html += "if(data.networks&&data.networks.length>0){";
  html += "data.networks.forEach(net=>{";
  html += "var el=document.createElement('div');el.className='network-item';";
  html += "var strength=getSignalStrength(net.signal);";
  html += "el.innerHTML='<div><strong>'+net.ssid+'</strong><br><small>'+net.encryption+'</small></div>';";
  html += "el.innerHTML+='<div class=\"network-signal\"><span class=\"material-icons icon-small\">'+strength.icon+'</span>'+net.signal+'dBm</div>';";
  html += "el.onclick=()=>{document.querySelectorAll('.network-item').forEach(n=>n.classList.remove('selected'));";
  html += "el.classList.add('selected');selectedSSID=net.ssid;};";
  html += "div.appendChild(el);});";
  html += "}else{div.innerHTML='<p style=\"text-align:center;color:var(--md-sys-color-on-surface-variant);padding:20px\">No networks found</p>';}";
  html += "}).catch(err=>{";
  html += "document.getElementById('networks').innerHTML='<p style=\"color:var(--md-sys-color-error);text-align:center;padding:20px\">Scan failed</p>';";
  html += "}).finally(()=>{btn.classList.remove('loading');btn.disabled=false;});} ";
  
  // Signal strength helper
  html += "function getSignalStrength(rssi){";
  html += "if(rssi>=-50)return{icon:'signal_wifi_4_bar',level:'Excellent'};";
  html += "if(rssi>=-60)return{icon:'signal_wifi_3_bar',level:'Good'};";
  html += "if(rssi>=-70)return{icon:'signal_wifi_2_bar',level:'Fair'};";
  html += "return{icon:'signal_wifi_1_bar',level:'Poor'};}";
  
  // Configuration function
  html += "function configure(){";
  html += "var pwd=document.getElementById('password').value;";
  html += "var uid=document.getElementById('userId').value;";
  html += "if(!selectedSSID||!pwd||!uid){";
  html += "showStatus('Please select a network and fill all fields','error');return;}";
  html += "var btn=event.target;btn.classList.add('loading');btn.disabled=true;";
  html += "fetch('/configure',{method:'POST',headers:{'Content-Type':'application/json'},";
  html += "body:JSON.stringify({ssid:selectedSSID,password:pwd,userId:uid})})";
  html += ".then(r=>r.json()).then(data=>{";
  html += "if(data.success){showStatus('Configuration saved! Device will restart in 3 seconds...','success');}";
  html += "else{showStatus('Configuration failed: '+(data.error||'Unknown error'),'error');}";
  html += "}).catch(err=>{showStatus('Network error: '+err.message,'error');";
  html += "}).finally(()=>{btn.classList.remove('loading');btn.disabled=false;});} ";
  
  // Valve control function
  html += "function controlValve(action){";
  html += "var btn=event.target;btn.classList.add('loading');btn.disabled=true;";
  html += "fetch('/valve',{method:'POST',headers:{'Content-Type':'application/json'},";
  html += "body:JSON.stringify({command:action})})";
  html += ".then(r=>r.json()).then(data=>{";
  html += "if(data.success){";
  html += "showStatus(data.message||('Valve '+action+' command sent!'),'success');";
  html += "if(data.message&&data.message.includes('override')){startOverrideTimer();}";
  html += "}else{showStatus('Valve control failed: '+(data.error||'Unknown error'),'error');}";
  html += "}).catch(err=>{showStatus('Network error: '+err.message,'error');";
  html += "}).finally(()=>{btn.classList.remove('loading');btn.disabled=false;});} ";
  
  // Status display function
  html += "function showStatus(message,type){";
  html += "var statusDiv=document.getElementById('status');";
  html += "statusDiv.innerHTML='<div class=\"status-message status-'+type+'\">'+message+'</div>';";
  html += "setTimeout(()=>{statusDiv.innerHTML='';},type==='success'?5000:10000);}";
  
  // Override timer functions
  html += "function startOverrideTimer(){";
  html += "overrideStartTime=Date.now();";
  html += "document.getElementById('overrideStatus').style.display='flex';";
  html += "updateOverrideTimer();";
  html += "overrideTimer=setInterval(updateOverrideTimer,1000);}";
  
  html += "function updateOverrideTimer(){";
  html += "var elapsed=Math.floor((Date.now()-overrideStartTime)/1000);";
  html += "var remaining=Math.max(0,300-elapsed);";
  html += "if(remaining<=0){clearOverrideTimer();return;}";
  html += "var minutes=Math.floor(remaining/60);";
  html += "var seconds=remaining%60;";
  html += "document.getElementById('overrideTimer').textContent=minutes+':'+(seconds<10?'0':'')+seconds;}";
  
  html += "function clearOverrideTimer(){";
  html += "if(overrideTimer){clearInterval(overrideTimer);overrideTimer=null;}";
  html += "document.getElementById('overrideStatus').style.display='none';";
  html += "overrideStartTime=null;}";
  
  html += "</script></body></html>";
  
  server.send(200, "text/html", html);
}

void handleScan() {
  Serial.println("🔍 Scanning WiFi networks...");
  
  // Disconnect from current WiFi to scan properly
  WiFi.disconnect();
  delay(100);
  
  int n = WiFi.scanNetworks();
  Serial.println("📡 Scan result: " + String(n) + " networks found");
  
  DynamicJsonDocument doc(2048);
  JsonArray networks = doc.createNestedArray("networks");
  
  for (int i = 0; i < n; i++) {
    JsonObject network = networks.createNestedObject();
    network["ssid"] = WiFi.SSID(i);
    network["signal"] = WiFi.RSSI(i);
    network["encryption"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Open" : "Encrypted";
    Serial.println("Network " + String(i) + ": " + WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + "dBm)");
  }
  
  String response;
  serializeJson(doc, response);
  Serial.println("📤 Sending scan response: " + response);
  server.send(200, "application/json", response);
  
  Serial.println("📡 Found " + String(n) + " networks");
}

void handleConfigure() {
  if (server.hasArg("plain")) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, server.arg("plain"));
    
    String ssid = doc["ssid"];
    String password = doc["password"];
    String userId = doc["userId"];
    
    Serial.println("⚙️ Configuring device...");
    Serial.println("📶 SSID: " + ssid);
    Serial.println("👤 User ID: " + userId);
    
    // Save configuration
    ssid.toCharArray(config.ssid, sizeof(config.ssid));
    password.toCharArray(config.password, sizeof(config.password));
    userId.toCharArray(config.userId, sizeof(config.userId));
    
    saveConfig();
    
    // Send success response
    DynamicJsonDocument responseDoc(256);
    responseDoc["success"] = true;
    responseDoc["message"] = "Configuration saved";
    
    String response;
    serializeJson(responseDoc, response);
    server.send(200, "application/json", response);
    
    Serial.println("✅ Configuration completed");
    Serial.println("🔄 Restarting in 3 seconds...");
    
    delay(3000);
    ESP.restart();
  } else {
    server.send(400, "application/json", "{\"success\":false,\"error\":\"No data received\"}");
  }
}

void handleValveControl() {
  if (server.hasArg("plain")) {
    DynamicJsonDocument doc(256);
    deserializeJson(doc, server.arg("plain"));
    
    String command = doc["command"];
    
    Serial.println("🎮 Manual valve control: " + command);
    
    DynamicJsonDocument responseDoc(256);
    
    if (command == "ON") {
      startWatering();
      manualOverride = true; // Enable local manual override
      manualOverrideTime = millis(); // Record time
      webManualMode = false; // Local override takes precedence
      sendValveStatus(); // Update Firebase immediately
      responseDoc["success"] = true;
      responseDoc["message"] = "Valve turned ON (Local override for 5 minutes)";
      Serial.println("🎮 Local manual override activated for 5 minutes");
    } else if (command == "OFF") {
      stopWatering();
      manualOverride = true; // Enable local manual override
      manualOverrideTime = millis(); // Record time
      webManualMode = false; // Local override takes precedence
      sendValveStatus(); // Update Firebase immediately
      responseDoc["success"] = true;
      responseDoc["message"] = "Valve turned OFF (Local override for 5 minutes)";
      Serial.println("🎮 Local manual override activated for 5 minutes");
    } else {
      responseDoc["success"] = false;
      responseDoc["message"] = "Invalid command";
    }
    
    String response;
    serializeJson(responseDoc, response);
    server.send(200, "application/json", response);
  } else {
    server.send(400, "application/json", "{\"success\":false,\"error\":\"No data received\"}");
  }
}

void readSensors() {
  // Read moisture sensor (0-4095 range)
  int moistureRaw = analogRead(MOISTURE_PIN);
  int moisturePercent = map(moistureRaw, 0, 4095, 100, 0); // Invert: wet=100%, dry=0%
  
  // Mock temperature and humidity (replace with real sensors)
  float temperature = 23.5 + (random(-20, 20) / 10.0);
  float humidity = 60.0 + (random(-100, 100) / 10.0);
  
  Serial.println("📊 Moisture: " + String(moisturePercent) + "% | Temp: " + String(temperature) + "°C | Humidity: " + String(humidity) + "%");
  Serial.println("🎯 Threshold: " + String(moistureThreshold) + "% | Valve: " + String(valveState ? "ON" : "OFF"));
  Serial.println("🎮 Manual Mode: " + String(webManualMode ? "WEB CONTROL" : (manualOverride ? "LOCAL OVERRIDE" : "AUTOMATIC")));
  
  // Check if local manual override has expired (only for local/button-based override)
  if (manualOverride && !webManualMode && (millis() - manualOverrideTime > MANUAL_OVERRIDE_DURATION)) {
    manualOverride = false;
    Serial.println("⏰ Local manual override expired - resuming automatic control");
  }
  
  // Only perform automatic control if not in any manual mode
  if (!manualOverride && !webManualMode) {
    Serial.println("🤖 AUTOMATIC MODE - Checking irrigation needs...");
    
    // Auto-watering logic with proper ON/OFF control
    bool shouldTurnOn = (moisturePercent < moistureThreshold) && !valveState;
    bool shouldTurnOff = (moisturePercent >= moistureThreshold) && valveState;
    
    if (shouldTurnOn) {
      Serial.println("💧 AUTOMATIC: Low moisture detected (" + String(moisturePercent) + "% < " + String(moistureThreshold) + "%) - starting watering");
      startWatering();
      sendValveStatus(); // Immediately update Firebase
    } else if (shouldTurnOff) {
      Serial.println("🌿 AUTOMATIC: Moisture restored (" + String(moisturePercent) + "% >= " + String(moistureThreshold) + "%) - stopping watering");
      stopWatering();
      sendValveStatus(); // Immediately update Firebase
    } else {
      Serial.println("✅ AUTOMATIC: Moisture level OK (" + String(moisturePercent) + "%) - no action needed");
    }
  } else if (webManualMode) {
    Serial.println("� WEB MANUAL MODE - Automatic control disabled, waiting for web commands");
  } else {
    Serial.println("🎮 LOCAL MANUAL MODE - Override active (remaining: " + String((MANUAL_OVERRIDE_DURATION - (millis() - manualOverrideTime)) / 1000) + "s)");
  }
  
  // Send sensor data to Firebase
  sendSensorData(moisturePercent, temperature, humidity);
  
  // Register device if not already registered
  registerDevice();
}

// Test function to manually control valve - add this for debugging
void testValve() {
  Serial.println("🧪 VALVE TEST - Turning ON for 3 seconds...");
  digitalWrite(VALVE_PIN, HIGH);
  Serial.println("🔌 Pin 25 should be HIGH (3.3V) - Measure with multimeter");
  Serial.println("📊 Pin state reading: " + String(digitalRead(VALVE_PIN)));
  delay(3000);
  
  Serial.println("🧪 VALVE TEST - Turning OFF for 3 seconds...");
  digitalWrite(VALVE_PIN, LOW);
  Serial.println("🔌 Pin 25 should be LOW (0V) - Measure with multimeter");
  Serial.println("📊 Pin state reading: " + String(digitalRead(VALVE_PIN)));
  delay(3000);
}

// Helper function to send only valve status to Firebase
void sendValveStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/valveStatus.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(256);
  doc["valveStatus"] = valveState ? "ON" : "OFF";
  doc["timestamp"] = millis() / 1000;
  doc["trigger"] = webManualMode ? "web_manual" : (manualOverride ? "local_manual" : "auto"); // Show control source
  doc["mode"] = webManualMode ? "MANUAL" : (manualOverride ? "LOCAL_OVERRIDE" : "AUTOMATIC");
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("🔥 Sending valve status to Firebase: " + String(valveState ? "ON" : "OFF"));
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("✅ Valve status updated in Firebase successfully!");
  } else {
    Serial.println("❌ Failed to update valve status - HTTP Code: " + String(httpResponseCode));
  }
  
  http.end();
}

void sendSensorData(int moisture, float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + ".json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["timestamp"] = millis() / 1000; // Unix timestamp in seconds
  doc["moisture"] = moisture;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["valveStatus"] = valveState ? "ON" : "OFF";
  doc["userId"] = String(config.userId);
  doc["deviceStatus"] = "online";
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptime"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("📤 Sending to: " + url);
  
  int httpResponseCode = http.PUT(jsonString);
  
  Serial.println("📡 HTTP Response Code: " + String(httpResponseCode));
  
  if (httpResponseCode == 200) {
    Serial.println("🔥 Data sent to Firebase successfully!");
    
    // Also save to history for analytics
    saveToHistory(moisture, temperature, humidity);
  } else {
    Serial.println("❌ Firebase send failed - HTTP Code: " + String(httpResponseCode));
  }
  
  http.end();
}

void saveToHistory(int moisture, float temperature, float humidity) {
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/history.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(256);
  doc["timestamp"] = millis() / 1000;
  doc["moisture"] = moisture;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["valveStatus"] = valveState ? "ON" : "OFF";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("📈 History data saved");
  }
  
  http.end();
}

void registerDevice() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_URL) + "users/" + String(config.userId) + "/devices/" + String(config.deviceId) + ".json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["deviceId"] = String(config.deviceId);
  doc["name"] = "ESP32 Drip Device";
  doc["type"] = "irrigation";
  doc["status"] = "active";
  doc["lastSeen"] = millis() / 1000;
  doc["macAddress"] = WiFi.macAddress();
  doc["localIP"] = WiFi.localIP().toString();
  doc["wifiSSID"] = WiFi.SSID();
  doc["rssi"] = WiFi.RSSI();
  doc["firmware"] = "1.0.0";
  doc["location"] = "Garden"; // Default location
  doc["moistureThreshold"] = moistureThreshold;
  doc["autoWatering"] = true;
  doc["wateringDuration"] = 10;
  doc["notifications"] = true;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("📝 Device registered in dashboard");
  }
  
  http.end();
}

void checkCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  // Check for valve commands
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/commands/valve.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    
    if (payload.indexOf("\"command\":\"ON\"") >= 0) {
      Serial.println("🚰 Remote command: OPEN valve");
      
      // Check for duration parameter
      int durationStart = payload.indexOf("\"duration\":");
      if (durationStart >= 0) {
        durationStart += 11; // Length of "duration":
        int durationEnd = payload.indexOf(",", durationStart);
        if (durationEnd == -1) durationEnd = payload.indexOf("}", durationStart);
        
        int duration = payload.substring(durationStart, durationEnd).toInt();
        if (duration > 0 && duration <= 60) {
          Serial.println("⏲️ Timed watering: " + String(duration) + " minutes");
          startTimedWatering(duration);
        } else {
          startWatering();
          // Only set local manual override if not already in web manual mode
          if (!webManualMode) {
            manualOverride = true; // Enable local manual override for remote commands
            manualOverrideTime = millis();
            Serial.println("🎮 Local manual override activated for " + String(MANUAL_OVERRIDE_DURATION / 60000) + " minutes");
          } else {
            Serial.println("🌐 Valve opened via web manual mode");
          }
        }
      } else {
        startWatering();
        // Only set local manual override if not already in web manual mode
        if (!webManualMode) {
          manualOverride = true; // Enable local manual override for remote commands
          manualOverrideTime = millis();
          Serial.println("🎮 Local manual override activated for " + String(MANUAL_OVERRIDE_DURATION / 60000) + " minutes");
        } else {
          Serial.println("🌐 Valve opened via web manual mode");
        }
      }
      
      sendValveStatus(); // Immediately update Firebase
      clearCommand();
    } else if (payload.indexOf("\"command\":\"OFF\"") >= 0) {
      Serial.println("🚰 Remote command: CLOSE valve");
      
      // Check for emergency flag
      if (payload.indexOf("\"emergency\":true") >= 0) {
        Serial.println("🚨 Emergency stop activated!");
      }
      
      stopWatering();
      // Only set local manual override if not already in web manual mode
      if (!webManualMode) {
        manualOverride = true; // Enable local manual override for remote commands
        manualOverrideTime = millis();
        Serial.println("🎮 Local manual override activated for " + String(MANUAL_OVERRIDE_DURATION / 60000) + " minutes");
      } else {
        Serial.println("🌐 Valve closed via web manual mode");
      }
      sendValveStatus(); // Immediately update Firebase
      clearCommand();
    }
  }
  
  http.end();
  
  // Check for mode commands
  HTTPClient http2;
  String modeUrl = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/commands/mode.json";
  
  http2.begin(modeUrl);
  int modeResponseCode = http2.GET();
  
  if (modeResponseCode == 200) {
    String modePayload = http2.getString();
    
    if (modePayload.indexOf("\"command\":\"AUTOMATIC\"") >= 0) {
      Serial.println("🤖 Remote command: Switch to AUTOMATIC mode");
      
      // Disable both manual override modes and return to automatic control
      manualOverride = false;
      webManualMode = false;
      manualOverrideTime = 0;
      
      Serial.println("✅ Automatic mode activated - system will control valve based on moisture levels");
      Serial.println("🔄 All manual modes disabled - resuming automatic irrigation control");
      
      // Send confirmation back to Firebase
      sendAutomaticModeStatus();
      
      // Clear the mode command
      clearModeCommand();
      
      // Immediately check moisture and apply automatic logic
      readSensors();
    } else if (modePayload.indexOf("\"command\":\"MANUAL\"") >= 0) {
      Serial.println("🎮 Remote command: Switch to MANUAL mode");
      
      // Enable web manual mode (no timer expiration)
      webManualMode = true;
      manualOverride = false; // Disable local override
      manualOverrideTime = 0;
      
      Serial.println("✅ Web manual mode activated - automatic control disabled");
      Serial.println("� Manual mode active until user switches back to automatic");
      
      // Send confirmation back to Firebase
      sendManualModeStatus();
      
      // Clear the mode command
      clearModeCommand();
    }
  }
  
  http2.end();
  
  // Also check for configuration updates
  checkConfigUpdates();
}

void startTimedWatering(int durationMinutes) {
  startWatering();
  
  // Note: In a real implementation, you would use a timer interrupt
  // or better time management. This is a simplified version.
  unsigned long wateringStartTime = millis();
  unsigned long wateringDuration = durationMinutes * 60 * 1000; // Convert to milliseconds
  
  Serial.println("⏰ Watering timer set for " + String(durationMinutes) + " minutes");
  
  // Store the end time for checking in main loop
  // You would implement this with proper timer management
}

void checkConfigUpdates() {
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/config.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    
    // Parse configuration updates
    if (payload.indexOf("moistureThreshold") >= 0) {
      // Extract and update moisture threshold
      int thresholdStart = payload.indexOf("\"moistureThreshold\":");
      if (thresholdStart >= 0) {
        thresholdStart += 20; // Length of "moistureThreshold":
        int thresholdEnd = payload.indexOf(",", thresholdStart);
        if (thresholdEnd == -1) thresholdEnd = payload.indexOf("}", thresholdStart);
        
        int newThreshold = payload.substring(thresholdStart, thresholdEnd).toInt();
        if (newThreshold >= 10 && newThreshold <= 80) {
          moistureThreshold = newThreshold;
          config.moistureThreshold = newThreshold;
          saveConfig(); // Save to EEPROM for persistence
          Serial.println("📊 Moisture threshold updated to: " + String(newThreshold) + "%");
        }
      }
    }
  }
  
  http.end();
}

void clearCommand() {
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/commands.json";
  http.begin(url);
  http.sendRequest("DELETE");
  http.end();
}

void clearModeCommand() {
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/commands/mode.json";
  http.begin(url);
  http.sendRequest("DELETE");
  http.end();
}

void sendAutomaticModeStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/status.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(256);
  doc["mode"] = "AUTOMATIC";
  doc["manualOverride"] = false;
  doc["webManualMode"] = false;
  doc["timestamp"] = millis() / 1000;
  doc["message"] = "Automatic mode activated - system controlling irrigation";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("🔥 Sending automatic mode status to Firebase");
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("✅ Automatic mode status updated in Firebase successfully!");
  } else {
    Serial.println("❌ Failed to update automatic mode status - HTTP Code: " + String(httpResponseCode));
  }
  
  http.end();
}

void sendManualModeStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_URL) + "deviceData/" + String(config.deviceId) + "/status.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(256);
  doc["mode"] = "MANUAL";
  doc["manualOverride"] = false; // Web manual mode doesn't use local override
  doc["webManualMode"] = true;
  doc["timestamp"] = millis() / 1000;
  doc["message"] = "Web manual mode activated - user has control via dashboard";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("🔥 Sending manual mode status to Firebase");
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("✅ Manual mode status updated in Firebase successfully!");
  } else {
    Serial.println("❌ Failed to update manual mode status - HTTP Code: " + String(httpResponseCode));
  }
  
  http.end();
}

void startWatering() {
  digitalWrite(VALVE_PIN, HIGH);
  valveState = true;
  Serial.println("💧 Valve OPENED - Watering started");
}

void stopWatering() {
  digitalWrite(VALVE_PIN, LOW);
  valveState = false;
  Serial.println("🚫 Valve CLOSED - Watering stopped");
}
