#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <EEPROM.h>

// Pin Definitions - Adjust these based on your wiring
#define MOISTURE_PIN A0    // Analog pin for moisture sensor
#define VALVE_PIN 2        // Digital pin for valve relay
#define LED_PIN 2          // Built-in LED pin
#define BUTTON_PIN 0       // Built-in button (BOOT button)

// Web server for configuration
WebServer server(80);

// Device configuration
struct DeviceConfig {
  char ssid[32];
  char password[64];
  char deviceId[32];
  char userId[64];
  char firebaseUrl[128];
  bool configured;
  int moistureThreshold;
  bool autoWatering;
  int wateringDuration;
  int checkInterval;
};

DeviceConfig config;
bool isConfigMode = false;
bool isConnected = false;
unsigned long lastSensorRead = 0;
unsigned long lastConfigCheck = 0;
unsigned long valveStartTime = 0;
bool valveActive = false;

// Generate unique device ID based on MAC address
String generateDeviceId() {
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  return "esp32_" + mac.substring(6);
}

// Setup Access Point for configuration
void setupAccessPoint() {
  String deviceId = generateDeviceId();
  String apName = "ESP32_Drip_" + deviceId.substring(6);
  
  WiFi.softAP(apName.c_str(), "12345678");
  Serial.println("Access Point Started");
  Serial.println("SSID: " + apName);
  Serial.println("Password: 12345678");
  Serial.println("IP: " + WiFi.softAPIP().toString());
  
  digitalWrite(LED_PIN, HIGH); // LED on during config mode
}

// Load configuration from EEPROM
void loadConfig() {
  EEPROM.begin(512);
  EEPROM.get(0, config);
  
  if (!config.configured) {
    // Set defaults
    strcpy(config.deviceId, generateDeviceId().c_str());
    config.moistureThreshold = 30;
    config.autoWatering = true;
    config.wateringDuration = 5;
    config.checkInterval = 60;
    config.configured = false;
  }
}

// Save configuration to EEPROM
void saveConfig() {
  config.configured = true;
  EEPROM.put(0, config);
  EEPROM.commit();
}

// HTML page for device setup
String getSetupPage() {
  return R"(
<!DOCTYPE html>
<html>
<head>
    <title>ESP32 Drip Setup</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
        button:hover { background: #0056b3; }
        .network { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px; cursor: pointer; }
        .network:hover { background: #f8f9fa; }
        .signal { float: right; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>ESP32 Drip Setup</h2>
        
        <div class="form-group">
            <label>Device ID:</label>
            <input type="text" id="deviceId" value=")" + String(config.deviceId) + R"(" readonly>
        </div>
        
        <div class="form-group">
            <label>Available Networks:</label>
            <div id="networks">Scanning...</div>
        </div>
        
        <div class="form-group">
            <label>WiFi Password:</label>
            <input type="password" id="password" placeholder="Enter WiFi password">
        </div>
        
        <div class="form-group">
            <label>User ID:</label>
            <input type="text" id="userId" placeholder="Firebase User ID">
        </div>
        
        <div class="form-group">
            <label>Firebase URL:</label>
            <input type="text" id="firebaseUrl" value="https://drip-anurag-default-rtdb.firebaseio.com/" placeholder="Firebase Database URL">
        </div>
        
        <button onclick="configure()">Configure Device</button>
        
        <div id="status" style="margin-top: 20px;"></div>
    </div>

    <script>
        let selectedSSID = '';
        
        function scanNetworks() {
            fetch('/scan')
                .then(response => response.json())
                .then(data => {
                    const networksDiv = document.getElementById('networks');
                    networksDiv.innerHTML = '';
                    
                    data.networks.forEach(network => {
                        const div = document.createElement('div');
                        div.className = 'network';
                        div.innerHTML = `${network.ssid} <span class="signal">${network.signal}dBm</span>`;
                        div.onclick = () => selectNetwork(network.ssid);
                        networksDiv.appendChild(div);
                    });
                })
                .catch(err => {
                    document.getElementById('networks').innerHTML = 'Scan failed';
                });
        }
        
        function selectNetwork(ssid) {
            selectedSSID = ssid;
            document.querySelectorAll('.network').forEach(el => el.style.background = '');
            event.target.style.background = '#e3f2fd';
        }
        
        function configure() {
            if (!selectedSSID) {
                alert('Please select a WiFi network');
                return;
            }
            
            const data = {
                ssid: selectedSSID,
                password: document.getElementById('password').value,
                userId: document.getElementById('userId').value,
                firebaseUrl: document.getElementById('firebaseUrl').value
            };
            
            document.getElementById('status').innerHTML = 'Configuring...';
            
            fetch('/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('status').innerHTML = 'Configuration successful! Device will restart.';
                } else {
                    document.getElementById('status').innerHTML = 'Configuration failed: ' + data.error;
                }
            })
            .catch(err => {
                document.getElementById('status').innerHTML = 'Configuration failed';
            });
        }
        
        // Scan networks on page load
        scanNetworks();
    </script>
</body>
</html>
  )";
}

// Handle WiFi scan request
void handleScan() {
  WiFi.scanNetworks(true); // Async scan
  delay(3000); // Wait for scan to complete
  
  int n = WiFi.scanComplete();
  DynamicJsonDocument doc(1024);
  JsonArray networks = doc.createNestedArray("networks");
  
  for (int i = 0; i < n; i++) {
    JsonObject network = networks.createNestedObject();
    network["ssid"] = WiFi.SSID(i);
    network["signal"] = WiFi.RSSI(i);
    network["security"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Open" : "Secured";
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

// Handle device configuration
void handleConfigure() {
  if (server.hasArg("plain")) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, server.arg("plain"));
    
    strcpy(config.ssid, doc["ssid"]);
    strcpy(config.password, doc["password"]);
    strcpy(config.userId, doc["userId"]);
    strcpy(config.firebaseUrl, doc["firebaseUrl"]);
    
    saveConfig();
    
    DynamicJsonDocument response(256);
    response["success"] = true;
    response["message"] = "Configuration saved";
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
    
    delay(1000);
    ESP.restart();
  } else {
    server.send(400, "application/json", "{\"success\":false,\"error\":\"No data received\"}");
  }
}

// Setup web server routes
void setupWebServer() {
  server.on("/", []() {
    server.send(200, "text/html", getSetupPage());
  });
  
  server.on("/scan", handleScan);
  server.on("/configure", HTTP_POST, handleConfigure);
  
  server.begin();
}

// Connect to WiFi
bool connectToWiFi() {
  if (strlen(config.ssid) == 0) return false;
  
  WiFi.begin(config.ssid, config.password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.println("IP: " + WiFi.localIP().toString());
    return true;
  }
  
  return false;
}

// Read sensor data
void readSensors() {
  // Read moisture sensor (0-4095 raw, convert to percentage)
  int moistureRaw = analogRead(MOISTURE_PIN);
  int moisturePercent = map(moistureRaw, 0, 4095, 100, 0); // Invert scale - lower reading = more moisture
  
  // For testing without DHT22, use simulated temperature and humidity
  float temperature = 25.0 + (random(-50, 50) / 10.0); // Random temp around 25°C
  float humidity = 60.0 + (random(-100, 100) / 10.0);   // Random humidity around 60%
  
  // Ensure reasonable values
  if (temperature < 0) temperature = 0;
  if (temperature > 50) temperature = 50;
  if (humidity < 0) humidity = 0;
  if (humidity > 100) humidity = 100;
  
  Serial.println("Sensor Readings:");
  Serial.println("Moisture Raw: " + String(moistureRaw));
  Serial.println("Moisture %: " + String(moisturePercent));
  Serial.println("Temperature: " + String(temperature) + "°C");
  Serial.println("Humidity: " + String(humidity) + "%");
  
  // Send data to Firebase
  sendSensorData(moisturePercent, temperature, humidity);
  
  // Check auto watering
  if (config.autoWatering && moisturePercent < config.moistureThreshold && !valveActive) {
    Serial.println("Auto watering triggered - moisture below threshold");
    startWatering();
  }
}

// Send sensor data to Firebase
void sendSensorData(int moisture, float temperature, float humidity) {
  if (!isConnected) return;
  
  HTTPClient http;
  String url = String(config.firebaseUrl) + "/deviceData/" + config.deviceId + ".json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["moisture"] = moisture;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["valveStatus"] = valveActive ? "ON" : "OFF";
  doc["userId"] = config.userId;
  doc["lastUpdate"] = millis();
  doc["timestamp"] = millis() / 1000;
  
  String payload;
  serializeJson(doc, payload);
  
  int httpResponseCode = http.PUT(payload);
  
  if (httpResponseCode > 0) {
    Serial.println("Data sent successfully");
    
    // Add to history
    String historyUrl = String(config.firebaseUrl) + "/deviceData/" + config.deviceId + "/history.json";
    http.begin(historyUrl);
    http.addHeader("Content-Type", "application/json");
    
    DynamicJsonDocument historyDoc(256);
    historyDoc["moisture"] = moisture;
    historyDoc["timestamp"] = millis() / 1000;
    
    String historyPayload;
    serializeJson(historyDoc, historyPayload);
    http.POST(historyPayload);
  } else {
    Serial.println("Error sending data: " + String(httpResponseCode));
  }
  
  http.end();
}

// Check for commands from Firebase
void checkCommands() {
  if (!isConnected) return;
  
  HTTPClient http;
  String url = String(config.firebaseUrl) + "/deviceData/" + config.deviceId + "/commands.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    
    DynamicJsonDocument doc(512);
    deserializeJson(doc, payload);
    
    // Check for valve command
    if (doc.containsKey("valve")) {
      String command = doc["valve"]["command"];
      if (command == "ON") {
        startWatering();
      } else if (command == "OFF") {
        stopWatering();
      }
      
      // Clear command after processing
      HTTPClient httpClear;
      httpClear.begin(url);
      httpClear.addHeader("Content-Type", "application/json");
      httpClear.PUT("{}");
      httpClear.end();
    }
    
    // Check for configuration updates
    String settingsUrl = String(config.firebaseUrl) + "/deviceData/" + config.deviceId + "/settings.json";
    HTTPClient httpSettings;
    httpSettings.begin(settingsUrl);
    int settingsResponse = httpSettings.GET();
    
    if (settingsResponse == 200) {
      String settingsPayload = httpSettings.getString();
      DynamicJsonDocument settingsDoc(512);
      deserializeJson(settingsDoc, settingsPayload);
      
      if (settingsDoc.containsKey("moistureThreshold")) {
        config.moistureThreshold = settingsDoc["moistureThreshold"];
      }
      if (settingsDoc.containsKey("autoWatering")) {
        config.autoWatering = settingsDoc["autoWatering"];
      }
      if (settingsDoc.containsKey("wateringDuration")) {
        config.wateringDuration = settingsDoc["wateringDuration"];
      }
      if (settingsDoc.containsKey("checkInterval")) {
        config.checkInterval = settingsDoc["checkInterval"];
      }
      
      saveConfig();
    }
    
    httpSettings.end();
  }
  
  http.end();
}

// Start watering
void startWatering() {
  digitalWrite(VALVE_PIN, HIGH);
  valveActive = true;
  valveStartTime = millis();
  Serial.println("Watering started");
}

// Stop watering
void stopWatering() {
  digitalWrite(VALVE_PIN, LOW);
  valveActive = false;
  Serial.println("Watering stopped");
}

// Update device status in Firebase
void updateDeviceStatus() {
  if (!isConnected) return;
  
  HTTPClient http;
  String url = String(config.firebaseUrl) + "/users/" + config.userId + "/devices.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    // Find this device and update its status
    for (JsonPair kv : doc.as<JsonObject>()) {
      if (kv.value()["deviceId"] == config.deviceId) {
        // Update device status
        String deviceUrl = String(config.firebaseUrl) + "/users/" + config.userId + "/devices/" + kv.key().c_str() + "/lastSeen.json";
        HTTPClient httpUpdate;
        httpUpdate.begin(deviceUrl);
        httpUpdate.addHeader("Content-Type", "application/json");
        
        unsigned long currentTime = millis();
        String timestamp = "\"" + String(currentTime) + "\"";
        httpUpdate.PUT(timestamp);
        httpUpdate.end();
        break;
      }
    }
  }
  
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== ESP32 Drip Irrigation System Starting ===");
  
  // Initialize pins
  pinMode(VALVE_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  digitalWrite(VALVE_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize random seed
  randomSeed(analogRead(A0));
  
  // Load configuration
  loadConfig();
  
  Serial.println("Device ID: " + String(config.deviceId));
  Serial.println("MAC Address: " + WiFi.macAddress());
  
  // Check if button is pressed for config mode
  if (digitalRead(BUTTON_PIN) == LOW || !config.configured) {
    Serial.println("Entering configuration mode...");
    isConfigMode = true;
    setupAccessPoint();
    setupWebServer();
  } else {
    Serial.println("Attempting to connect to WiFi...");
    // Try to connect to WiFi
    isConnected = connectToWiFi();
    
    if (!isConnected) {
      Serial.println("WiFi connection failed, entering configuration mode");
      isConfigMode = true;
      setupAccessPoint();
      setupWebServer();
    } else {
      Serial.println("Connected to WiFi successfully!");
      Serial.println("Ready to send data to Firebase");
      digitalWrite(LED_PIN, LOW); // LED off when connected
    }
  }
}

void loop() {
  if (isConfigMode) {
    server.handleClient();
    delay(10);
  } else if (isConnected) {
    unsigned long currentTime = millis();
    
    // Read sensors every checkInterval minutes
    if (currentTime - lastSensorRead >= (config.checkInterval * 60 * 1000)) {
      readSensors();
      updateDeviceStatus();
      lastSensorRead = currentTime;
    }
    
    // Check for commands every 30 seconds
    if (currentTime - lastConfigCheck >= 30000) {
      checkCommands();
      lastConfigCheck = currentTime;
    }
    
    // Check watering duration
    if (valveActive && currentTime - valveStartTime >= (config.wateringDuration * 60 * 1000)) {
      stopWatering();
    }
    
    // Check button for config mode
    if (digitalRead(BUTTON_PIN) == LOW) {
      delay(50); // Debounce
      if (digitalRead(BUTTON_PIN) == LOW) {
        Serial.println("Entering configuration mode");
        config.configured = false;
        saveConfig();
        ESP.restart();
      }
    }
    
    delay(1000);
  }
}
