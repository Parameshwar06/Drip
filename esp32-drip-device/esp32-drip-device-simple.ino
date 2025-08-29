#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <EEPROM.h>

// Pin Definitions - Adjust these based on your wiring
#define MOISTURE_PIN A0    // Analog pin for moisture sensor (GPIO36 on most ESP32)
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
  Serial.println("=== ESP32 Drip System Started ===");
  Serial.println("Access Point Started");
  Serial.println("SSID: " + apName);
  Serial.println("Password: 12345678");
  Serial.println("IP: " + WiFi.softAPIP().toString());
  Serial.println("Device ID: " + deviceId);
  Serial.println("================================");
  
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
    strcpy(config.firebaseUrl, "https://drip-anurag-default-rtdb.firebaseio.com/");
  }
}

// Save configuration to EEPROM
void saveConfig() {
  config.configured = true;
  EEPROM.put(0, config);
  EEPROM.commit();
  Serial.println("Configuration saved to EEPROM");
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
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
        button { background: #007bff; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-size: 16px; margin-top: 10px; }
        button:hover { background: #0056b3; }
        .network { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 5px; cursor: pointer; background: #f9f9f9; }
        .network:hover { background: #e9ecef; }
        .network.selected { background: #d4edda; border-color: #28a745; }
        .signal { float: right; color: #666; font-size: 12px; }
        .status { margin-top: 15px; padding: 10px; border-radius: 5px; text-align: center; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.info { background: #d1ecf1; color: #0c5460; }
        .device-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .refresh-btn { background: #28a745; margin-bottom: 10px; }
        .refresh-btn:hover { background: #218838; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🌱 ESP32 Drip Setup</h2>
            <p>Configure your irrigation device</p>
        </div>
        
        <div class="device-info">
            <strong>Device ID:</strong> <span id="deviceId">)" + String(config.deviceId) + R"(</span><br>
            <strong>Status:</strong> <span style="color: orange;">Configuration Mode</span>
        </div>
        
        <div class="form-group">
            <label>🌐 Available WiFi Networks:</label>
            <button type="button" class="refresh-btn" onclick="scanNetworks()">🔄 Refresh Networks</button>
            <div id="networks">Click refresh to scan...</div>
        </div>
        
        <div class="form-group">
            <label>🔐 WiFi Password:</label>
            <input type="password" id="password" placeholder="Enter WiFi password">
        </div>
        
        <div class="form-group">
            <label>👤 User ID (from Firebase Dashboard):</label>
            <input type="text" id="userId" placeholder="Your Firebase User ID">
            <small style="color: #666;">You can find this in your web dashboard profile</small>
        </div>
        
        <button onclick="configure()">🚀 Configure Device</button>
        
        <div id="status"></div>
    </div>

    <script>
        let selectedSSID = '';
        
        function scanNetworks() {
            document.getElementById('status').innerHTML = '<div class="status info">📡 Scanning networks...</div>';
            
            fetch('/scan')
                .then(response => response.json())
                .then(data => {
                    const networksDiv = document.getElementById('networks');
                    networksDiv.innerHTML = '';
                    
                    if (data.networks && data.networks.length > 0) {
                        data.networks.forEach(network => {
                            const div = document.createElement('div');
                            div.className = 'network';
                            div.innerHTML = `${network.ssid} <span class="signal">${network.signal}dBm</span>`;
                            div.onclick = () => selectNetwork(network.ssid, div);
                            networksDiv.appendChild(div);
                        });
                        document.getElementById('status').innerHTML = '<div class="status success">✅ Found ' + data.networks.length + ' networks</div>';
                    } else {
                        networksDiv.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No networks found</div>';
                        document.getElementById('status').innerHTML = '<div class="status error">❌ No networks found</div>';
                    }
                })
                .catch(err => {
                    document.getElementById('networks').innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Scan failed</div>';
                    document.getElementById('status').innerHTML = '<div class="status error">❌ Scan failed</div>';
                });
        }
        
        function selectNetwork(ssid, element) {
            selectedSSID = ssid;
            // Remove previous selection
            document.querySelectorAll('.network').forEach(el => el.classList.remove('selected'));
            // Add selection to clicked element
            element.classList.add('selected');
            document.getElementById('status').innerHTML = '<div class="status info">📍 Selected: ' + ssid + '</div>';
        }
        
        function configure() {
            if (!selectedSSID) {
                document.getElementById('status').innerHTML = '<div class="status error">❌ Please select a WiFi network</div>';
                return;
            }
            
            const password = document.getElementById('password').value;
            const userId = document.getElementById('userId').value;
            
            if (!password) {
                document.getElementById('status').innerHTML = '<div class="status error">❌ Please enter WiFi password</div>';
                return;
            }
            
            if (!userId) {
                document.getElementById('status').innerHTML = '<div class="status error">❌ Please enter your User ID</div>';
                return;
            }
            
            const data = {
                ssid: selectedSSID,
                password: password,
                userId: userId,
                firebaseUrl: "https://drip-anurag-default-rtdb.firebaseio.com/"
            };
            
            document.getElementById('status').innerHTML = '<div class="status info">⚙️ Configuring device...</div>';
            
            fetch('/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('status').innerHTML = '<div class="status success">✅ Configuration successful!<br>Device will restart and connect to your network.</div>';
                    setTimeout(() => {
                        document.getElementById('status').innerHTML += '<br><small>You can now close this page and check your dashboard.</small>';
                    }, 3000);
                } else {
                    document.getElementById('status').innerHTML = '<div class="status error">❌ Configuration failed: ' + (data.error || 'Unknown error') + '</div>';
                }
            })
            .catch(err => {
                document.getElementById('status').innerHTML = '<div class="status error">❌ Configuration failed: Network error</div>';
            });
        }
        
        // Auto-scan on page load
        window.onload = function() {
            scanNetworks();
        };
    </script>
</body>
</html>
  )";
}

// Handle WiFi scan request
void handleScan() {
  Serial.println("Scanning WiFi networks...");
  WiFi.scanNetworks(true); // Async scan
  delay(3000); // Wait for scan to complete
  
  int n = WiFi.scanComplete();
  Serial.println("Found " + String(n) + " networks");
  
  DynamicJsonDocument doc(2048);
  JsonArray networks = doc.createNestedArray("networks");
  
  for (int i = 0; i < n && i < 20; i++) { // Limit to 20 networks
    JsonObject network = networks.createNestedObject();
    network["ssid"] = WiFi.SSID(i);
    network["signal"] = WiFi.RSSI(i);
    network["security"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Open" : "Secured";
    Serial.println("  " + WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + "dBm)");
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
  WiFi.scanDelete(); // Clean up
}

// Handle device configuration
void handleConfigure() {
  Serial.println("Configuration request received");
  
  if (server.hasArg("plain")) {
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    
    if (error) {
      Serial.println("JSON parsing failed");
      server.send(400, "application/json", "{\"success\":false,\"error\":\"Invalid JSON\"}");
      return;
    }
    
    // Extract configuration
    strcpy(config.ssid, doc["ssid"]);
    strcpy(config.password, doc["password"]);
    strcpy(config.userId, doc["userId"]);
    strcpy(config.firebaseUrl, doc["firebaseUrl"]);
    
    Serial.println("Configuration received:");
    Serial.println("  SSID: " + String(config.ssid));
    Serial.println("  User ID: " + String(config.userId));
    Serial.println("  Firebase URL: " + String(config.firebaseUrl));
    
    saveConfig();
    
    DynamicJsonDocument response(256);
    response["success"] = true;
    response["message"] = "Configuration saved. Device will restart.";
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
    
    Serial.println("Configuration saved. Restarting in 2 seconds...");
    delay(2000);
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
  
  // Enable CORS
  server.enableCORS(true);
  
  server.begin();
  Serial.println("Web server started on http://" + WiFi.softAPIP().toString());
}

// Connect to WiFi
bool connectToWiFi() {
  if (strlen(config.ssid) == 0) {
    Serial.println("No WiFi credentials stored");
    return false;
  }
  
  Serial.println("Connecting to WiFi: " + String(config.ssid));
  WiFi.begin(config.ssid, config.password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi connected!");
    Serial.println("IP: " + WiFi.localIP().toString());
    Serial.println("Signal: " + String(WiFi.RSSI()) + "dBm");
    return true;
  } else {
    Serial.println();
    Serial.println("❌ WiFi connection failed");
    return false;
  }
}

// Read sensor data
void readSensors() {
  // Read moisture sensor (0-4095 raw, convert to percentage)
  int moistureRaw = analogRead(MOISTURE_PIN);
  int moisturePercent = map(moistureRaw, 0, 4095, 100, 0); // Invert scale (wet = high %)
  
  // Read built-in temperature sensor (rough approximation)
  float temperature = 25.0; // Placeholder - use actual sensor if available
  float humidity = 50.0;    // Placeholder - use actual sensor if available
  
  Serial.println("📊 Sensor readings:");
  Serial.println("  Moisture: " + String(moisturePercent) + "% (raw: " + String(moistureRaw) + ")");
  Serial.println("  Temperature: " + String(temperature) + "°C");
  Serial.println("  Humidity: " + String(humidity) + "%");
  
  // Send data to Firebase
  sendSensorData(moisturePercent, temperature, humidity);
  
  // Check auto watering
  if (config.autoWatering && moisturePercent < config.moistureThreshold && !valveActive) {
    Serial.println("🚰 Auto watering triggered (moisture " + String(moisturePercent) + "% < " + String(config.moistureThreshold) + "%)");
    startWatering();
  }
}

// Send sensor data to Firebase
void sendSensorData(int moisture, float temperature, float humidity) {
  if (!isConnected) {
    Serial.println("❌ Not connected to WiFi, skipping data upload");
    return;
  }
  
  HTTPClient http;
  String url = String(config.firebaseUrl) + "/deviceData/" + config.deviceId + ".json";
  
  Serial.println("📤 Sending data to: " + url);
  
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
    Serial.println("✅ Data sent successfully (Code: " + String(httpResponseCode) + ")");
    
    // Add to history
    String historyUrl = String(config.firebaseUrl) + "/deviceData/" + config.deviceId + "/history.json";
    HTTPClient httpHistory;
    httpHistory.begin(historyUrl);
    httpHistory.addHeader("Content-Type", "application/json");
    
    DynamicJsonDocument historyDoc(256);
    historyDoc["moisture"] = moisture;
    historyDoc["timestamp"] = millis() / 1000;
    
    String historyPayload;
    serializeJson(historyDoc, historyPayload);
    httpHistory.POST(historyPayload);
    httpHistory.end();
  } else {
    Serial.println("❌ Error sending data (Code: " + String(httpResponseCode) + ")");
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
    
    if (payload != "null" && payload.length() > 2) {
      Serial.println("📨 Command received: " + payload);
      
      DynamicJsonDocument doc(512);
      deserializeJson(doc, payload);
      
      // Check for valve command
      if (doc.containsKey("valve")) {
        String command = doc["valve"]["command"];
        Serial.println("🔧 Valve command: " + command);
        
        if (command == "ON") {
          startWatering();
        } else if (command == "OFF") {
          stopWatering();
        }
        
        // Clear command after processing
        HTTPClient httpClear;
        httpClear.begin(url);
        httpClear.addHeader("Content-Type", "application/json");
        httpClear.PUT("null");
        httpClear.end();
      }
    }
  }
  
  http.end();
}

// Start watering
void startWatering() {
  digitalWrite(VALVE_PIN, HIGH);
  valveActive = true;
  valveStartTime = millis();
  Serial.println("💧 Watering started");
}

// Stop watering
void stopWatering() {
  digitalWrite(VALVE_PIN, LOW);
  valveActive = false;
  Serial.println("🛑 Watering stopped");
}

// Update device status in Firebase
void updateDeviceStatus() {
  if (!isConnected) return;
  
  // Update device last seen timestamp
  HTTPClient http;
  String url = String(config.firebaseUrl) + "/users/" + config.userId + "/devices.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String payload = http.getString();
    
    if (payload != "null" && payload.length() > 2) {
      DynamicJsonDocument doc(2048);
      deserializeJson(doc, payload);
      
      // Find this device and update its status
      for (JsonPair kv : doc.as<JsonObject>()) {
        if (kv.value()["deviceId"] == config.deviceId) {
          String deviceKey = kv.key().c_str();
          String deviceUrl = String(config.firebaseUrl) + "/users/" + config.userId + "/devices/" + deviceKey + "/lastSeen.json";
          
          HTTPClient httpUpdate;
          httpUpdate.begin(deviceUrl);
          httpUpdate.addHeader("Content-Type", "application/json");
          
          String timestamp = "\"" + String(millis()) + "\"";
          httpUpdate.PUT(timestamp);
          httpUpdate.end();
          
          Serial.println("📍 Device status updated");
          break;
        }
      }
    }
  }
  
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println();
  Serial.println("🌱 ESP32 Smart Drip Irrigation System");
  Serial.println("=====================================");
  
  // Initialize pins
  pinMode(VALVE_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  digitalWrite(VALVE_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // Load configuration
  loadConfig();
  
  Serial.println("Device ID: " + String(config.deviceId));
  Serial.println("Configured: " + String(config.configured ? "Yes" : "No"));
  
  // Check if button is pressed for config mode or not configured
  if (digitalRead(BUTTON_PIN) == LOW || !config.configured) {
    isConfigMode = true;
    Serial.println("🔧 Entering configuration mode...");
    setupAccessPoint();
    setupWebServer();
  } else {
    // Try to connect to WiFi
    Serial.println("🌐 Attempting to connect to WiFi...");
    isConnected = connectToWiFi();
    
    if (!isConnected) {
      Serial.println("⚠️  WiFi connection failed, entering configuration mode");
      isConfigMode = true;
      setupAccessPoint();
      setupWebServer();
    } else {
      Serial.println("🎉 System ready for operation!");
      digitalWrite(LED_PIN, LOW); // LED off when connected
    }
  }
  
  Serial.println("=====================================");
}

void loop() {
  if (isConfigMode) {
    server.handleClient();
    delay(10);
  } else if (isConnected) {
    unsigned long currentTime = millis();
    
    // Read sensors every checkInterval minutes
    if (currentTime - lastSensorRead >= (config.checkInterval * 60 * 1000UL)) {
      Serial.println("⏰ Time to read sensors...");
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
    if (valveActive && currentTime - valveStartTime >= (config.wateringDuration * 60 * 1000UL)) {
      Serial.println("⏲️  Watering time finished");
      stopWatering();
    }
    
    // Check button for config mode (hold for 3 seconds)
    if (digitalRead(BUTTON_PIN) == LOW) {
      delay(3000); // Wait 3 seconds
      if (digitalRead(BUTTON_PIN) == LOW) {
        Serial.println("🔧 Button held - entering configuration mode");
        config.configured = false;
        saveConfig();
        ESP.restart();
      }
    }
    
    delay(1000);
  }
}
