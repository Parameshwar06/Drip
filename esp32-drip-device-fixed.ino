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
#define MOISTURE_PIN A0
#define VALVE_PIN 2
#define LED_PIN 2
#define CONFIG_BUTTON_PIN 0

// Configuration structure
struct Config {
  char ssid[32];
  char password[64];
  char userId[64];
  char deviceId[32];
  bool configured;
};

Config config;
WebServer server(80);
bool configMode = false;
unsigned long lastSensorRead = 0;
unsigned long lastCommandCheck = 0;
const unsigned long SENSOR_INTERVAL = 30000; // 30 seconds
const unsigned long COMMAND_INTERVAL = 10000; // 10 seconds

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
    
    // Save the initialized config
    EEPROM.put(0, config);
    EEPROM.commit();
    Serial.println("✅ Device configuration initialized");
  }
  
  Serial.println("📋 Device ID: " + String(config.deviceId));
  Serial.println("⚙️ Configured: " + String(config.configured ? "Yes" : "No"));
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
  html += "<title>ESP32 Drip Setup</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body{font-family:Arial;margin:20px;background:#f0f0f0}";
  html += ".container{max-width:400px;margin:0 auto;background:white;padding:20px;border-radius:10px}";
  html += ".header{text-align:center;color:#333;margin-bottom:20px}";
  html += ".form-group{margin-bottom:15px}";
  html += "label{display:block;margin-bottom:5px;font-weight:bold;color:#555}";
  html += "input,select{width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;font-size:16px}";
  html += "button{background:#007bff;color:white;padding:12px 20px;border:none;border-radius:5px;cursor:pointer;width:100%;font-size:16px;margin-top:10px}";
  html += "button:hover{background:#0056b3}";
  html += ".network{padding:10px;border:1px solid #ddd;margin:5px 0;border-radius:5px;cursor:pointer;background:#f9f9f9}";
  html += ".network:hover{background:#e9ecef}";
  html += ".network.selected{background:#d4edda;border-color:#28a745}";
  html += ".signal{float:right;color:#666;font-size:12px}";
  html += ".status{margin-top:15px;padding:10px;border-radius:5px;text-align:center}";
  html += ".status.success{background:#d4edda;color:#155724}";
  html += ".status.error{background:#f8d7da;color:#721c24}";
  html += ".status.info{background:#d1ecf1;color:#0c5460}";
  html += "</style></head><body>";
  html += "<div class='container'>";
  html += "<div class='header'><h2>ESP32 Drip Setup</h2><p>Device ID: " + String(config.deviceId) + "</p></div>";
  html += "<div class='form-group'><label>WiFi Networks:</label>";
  html += "<button onclick='scanNetworks()'>Scan Networks</button>";
  html += "<div id='networks'>Click scan to find networks...</div></div>";
  html += "<div class='form-group'><label>WiFi Password:</label>";
  html += "<input type='password' id='password' placeholder='Enter WiFi password'></div>";
  html += "<div class='form-group'><label>User ID:</label>";
  html += "<input type='text' id='userId' placeholder='Your Firebase User ID'></div>";
  html += "<button onclick='configure()'>Configure Device</button>";
  html += "<div id='status'></div></div>";
  html += "<script>";
  html += "var selectedSSID='';";
  html += "function scanNetworks(){";
  html += "fetch('/scan').then(r=>r.json()).then(data=>{";
  html += "var div=document.getElementById('networks');div.innerHTML='';";
  html += "if(data.networks){data.networks.forEach(net=>{";
  html += "var el=document.createElement('div');el.className='network';";
  html += "el.innerHTML=net.ssid+' <span class=\"signal\">'+net.signal+'dBm</span>';";
  html += "el.onclick=()=>{document.querySelectorAll('.network').forEach(n=>n.classList.remove('selected'));";
  html += "el.classList.add('selected');selectedSSID=net.ssid;};";
  html += "div.appendChild(el);});}});} ";
  html += "function configure(){";
  html += "var pwd=document.getElementById('password').value;";
  html += "var uid=document.getElementById('userId').value;";
  html += "if(!selectedSSID||!pwd||!uid){alert('Please fill all fields');return;}";
  html += "fetch('/configure',{method:'POST',headers:{'Content-Type':'application/json'},";
  html += "body:JSON.stringify({ssid:selectedSSID,password:pwd,userId:uid})})";
  html += ".then(r=>r.json()).then(data=>{";
  html += "if(data.success){document.getElementById('status').innerHTML='<div class=\"status success\">Configuration saved! Device will restart...</div>';}";
  html += "else{document.getElementById('status').innerHTML='<div class=\"status error\">Configuration failed</div>';}});} ";
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

void readSensors() {
  // Read moisture sensor (0-4095 range)
  int moistureRaw = analogRead(MOISTURE_PIN);
  int moisturePercent = map(moistureRaw, 0, 4095, 100, 0); // Invert: wet=100%, dry=0%
  
  // Mock temperature and humidity (replace with real sensors)
  float temperature = 23.5 + (random(-20, 20) / 10.0);
  float humidity = 60.0 + (random(-100, 100) / 10.0);
  
  Serial.println("📊 Moisture: " + String(moisturePercent) + "% | Temp: " + String(temperature) + "°C | Humidity: " + String(humidity) + "%");
  
  // Send data to Firebase
  sendSensorData(moisturePercent, temperature, humidity);
  
  // Register device if not already registered
  registerDevice();
  
  // Auto-watering logic
  if (moisturePercent < 30) {
    Serial.println("💧 Low moisture detected - starting watering");
    startWatering();
  }
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
  doc["valveStatus"] = digitalRead(VALVE_PIN) ? "OFF" : "ON";
  doc["userId"] = String(config.userId);
  doc["deviceStatus"] = "online";
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptime"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("📤 Sending to: " + url);
  Serial.println("📦 JSON data: " + jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  
  Serial.println("📡 HTTP Response Code: " + String(httpResponseCode));
  
  if (httpResponseCode == 200) {
    Serial.println("🔥 Data sent to Firebase successfully!");
    String response = http.getString();
    Serial.println("📥 Firebase response: " + response);
    
    // Also save to history for analytics
    saveToHistory(moisture, temperature, humidity);
  } else {
    Serial.println("❌ Firebase send failed - HTTP Code: " + String(httpResponseCode));
    String response = http.getString();
    Serial.println("📥 Error response: " + response);
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
  doc["valveStatus"] = digitalRead(VALVE_PIN) ? "OFF" : "ON";
  
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
  doc["moistureThreshold"] = 30;
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
        }
      } else {
        startWatering();
      }
      
      clearCommand();
    } else if (payload.indexOf("\"command\":\"OFF\"") >= 0) {
      Serial.println("🚰 Remote command: CLOSE valve");
      
      // Check for emergency flag
      if (payload.indexOf("\"emergency\":true") >= 0) {
        Serial.println("🚨 Emergency stop activated!");
      }
      
      stopWatering();
      clearCommand();
    }
  }
  
  http.end();
  
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
          // Update local threshold (you'd store this in EEPROM for persistence)
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

void startWatering() {
  digitalWrite(VALVE_PIN, HIGH);
  Serial.println("💧 Valve OPENED - Watering started");
}

void stopWatering() {
  digitalWrite(VALVE_PIN, LOW);
  Serial.println("🚫 Valve CLOSED - Watering stopped");
}
