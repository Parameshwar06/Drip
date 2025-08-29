# ESP32 Smart Drip Irrigation System - User Guide

## Overview

This system allows users to manage multiple ESP32-based irrigation devices through a centralized web dashboard. Each user can pair their own ESP32 devices and monitor them individually.

## System Architecture

```
User Account (Firebase Auth)
├── Device Manager (React Dashboard)
├── Multiple ESP32 Devices
│   ├── Device 1 (Garden Zone A)
│   ├── Device 2 (Garden Zone B)
│   └── Device N (Greenhouse)
└── Firebase Realtime Database
    ├── users/{userId}/devices/
    └── deviceData/{deviceId}/
```

## Getting Started

### 1. Web Dashboard Access
- Visit: https://drip-anurag.web.app
- Create an account or sign in
- Navigate to "Device Manager" tab

### 2. ESP32 Device Setup

#### Hardware Requirements:
- ESP32 Development Board
- Soil Moisture Sensor (Analog)
- DHT22 Temperature/Humidity Sensor
- Water Valve (5V/12V Relay)
- Button for configuration mode
- LED indicator

#### Pin Connections:
```
ESP32 Pin | Component
----------|----------
A0        | Moisture Sensor (Analog)
GPIO2     | DHT22 Data Pin
GPIO4     | Water Valve Relay
GPIO2     | Status LED
GPIO0     | Configuration Button
```

#### Firmware Installation:
1. Install Arduino IDE
2. Add ESP32 board support
3. Install required libraries:
   - WiFi
   - WebServer
   - ArduinoJson
   - HTTPClient
   - DHT sensor library
4. Upload the provided ESP32 code

### 3. Device Pairing Process

#### Step 1: Put ESP32 in Configuration Mode
- Hold the configuration button while powering on, OR
- Press and hold the configuration button for 3 seconds

The device will:
- Create a WiFi Access Point named "ESP32_Drip_XXXXXX"
- Turn on the status LED
- Start a web server on 192.168.4.1

#### Step 2: Scan for Devices
1. In the web dashboard, click "Add Device"
2. The system will scan for nearby ESP32 devices
3. Select your device from the list

#### Step 3: Connect to Device
1. Click "Next" to connect to the selected device
2. The system will retrieve device information and available WiFi networks

#### Step 4: Configure WiFi
1. Select your home WiFi network from the list
2. Enter your WiFi password
3. Click "Next" to configure the device

#### Step 5: Complete Setup
1. Add a name for your device (e.g., "Garden Zone A")
2. Set the location (e.g., "Backyard")
3. Click "Complete" to finish setup

The ESP32 will:
- Connect to your WiFi network
- Register with your Firebase account
- Start sending sensor data
- Be controllable from your dashboard

## Dashboard Features

### Device Overview
- Real-time sensor readings (moisture, temperature, humidity)
- Device online/offline status
- Last seen timestamp
- Signal strength indication

### Device Controls
- Manual valve control (Open/Close)
- Real-time command execution
- Status feedback

### Device Management
- Add new devices
- Configure device settings
- Remove devices
- Device health monitoring

### Automation Settings
Per device configuration:
- **Auto Watering**: Enable/disable automatic irrigation
- **Moisture Threshold**: Trigger level for auto watering (10-80%)
- **Watering Duration**: How long to water (1-30 minutes)
- **Check Interval**: How often to read sensors (5-240 minutes)

### Data Visualization
- Moisture level history charts
- Temperature trends
- Watering events timeline

## Firebase Database Structure

```json
{
  "users": {
    "{userId}": {
      "devices": {
        "{deviceKey}": {
          "name": "Garden Zone A",
          "location": "Backyard",
          "deviceId": "esp32_a1b2c3",
          "macAddress": "A1:B2:C3:D4:E5:F6",
          "wifiNetwork": "HomeNetwork_2.4G",
          "firmware": "1.0.0",
          "features": ["moisture_sensor", "valve_control", "temperature"],
          "status": "online",
          "lastSeen": "2025-01-01T12:00:00Z",
          "moistureThreshold": 30,
          "autoWatering": true,
          "wateringDuration": 5,
          "checkInterval": 60
        }
      }
    }
  },
  "deviceData": {
    "{deviceId}": {
      "userId": "{userId}",
      "moisture": 65,
      "temperature": 24,
      "humidity": 55,
      "valveStatus": "OFF",
      "lastUpdate": "2025-01-01T12:00:00Z",
      "timestamp": 1672574400,
      "settings": {
        "moistureThreshold": 30,
        "autoWatering": true,
        "wateringDuration": 5,
        "checkInterval": 60,
        "lastUpdate": "2025-01-01T12:00:00Z"
      },
      "commands": {
        "valve": {
          "command": "ON",
          "timestamp": "2025-01-01T12:00:00Z",
          "id": 1672574400000
        }
      },
      "history": {
        "{historyId}": {
          "moisture": 65,
          "timestamp": 1672574400
        }
      }
    }
  }
}
```

## ESP32 Operation Modes

### Normal Operation Mode
- Reads sensors every `checkInterval` minutes
- Sends data to Firebase
- Checks for commands from dashboard
- Automatically waters if moisture < threshold
- Updates device status

### Configuration Mode
- Creates WiFi Access Point
- Hosts configuration web page
- Scans for available WiFi networks
- Accepts configuration from user
- Restarts in normal mode after configuration

### Command Processing
The ESP32 checks for commands every 30 seconds:
- **Valve Commands**: ON/OFF valve control
- **Settings Updates**: Configuration changes from dashboard
- **Test Commands**: Connection testing

## Troubleshooting

### Device Not Found During Scan
1. Ensure ESP32 is in configuration mode (LED should be ON)
2. Check that the device is powered and nearby
3. Verify the ESP32 firmware is uploaded correctly
4. Try manually connecting to "ESP32_Drip_XXXXXX" WiFi network

### Device Won't Connect to WiFi
1. Check WiFi password is correct
2. Ensure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
3. Check signal strength at device location
4. Verify network allows new device connections

### Device Goes Offline
1. Check power supply to ESP32
2. Verify WiFi network stability
3. Check Firebase connectivity
4. Reset device to configuration mode and reconfigure

### Sensor Readings Incorrect
1. Check sensor connections and wiring
2. Calibrate moisture sensor for your soil type
3. Verify DHT22 sensor is not damaged
4. Check analog reference voltage

### Valve Not Working
1. Check relay connections and power supply
2. Verify valve voltage requirements
3. Test relay manually
4. Check valve for blockages

## Advanced Configuration

### Custom Firebase Setup
To use your own Firebase project:
1. Create a new Firebase project
2. Enable Realtime Database
3. Update Firebase configuration in React app
4. Update ESP32 code with new Firebase URL

### Multiple Users
Each user account can manage their own devices independently:
- User A: Can only see and control their devices
- User B: Can only see and control their devices
- Data isolation at the Firebase level

### Scaling
The system supports:
- Unlimited users
- Multiple devices per user
- Real-time updates across all devices
- Historical data storage

## Security Features

### Device Authentication
- Each device has a unique ID based on MAC address
- Devices are associated with specific user accounts
- Commands are user-specific

### Data Privacy
- User data is isolated in Firebase
- Devices only access their own data paths
- No cross-user data sharing

### Network Security
- WiFi credentials stored securely on device
- HTTPS communication with Firebase
- Configuration mode timeout for security

## API Reference

### Firebase Realtime Database Paths

#### User Device List
```
GET /users/{userId}/devices
```

#### Device Data
```
GET /deviceData/{deviceId}
PUT /deviceData/{deviceId}
```

#### Send Commands
```
PUT /deviceData/{deviceId}/commands
```

#### Device Settings
```
PUT /deviceData/{deviceId}/settings
```

### ESP32 Configuration API

#### Get Device Info
```
GET http://192.168.4.1/
```

#### Scan WiFi Networks
```
GET http://192.168.4.1/scan
```

#### Configure Device
```
POST http://192.168.4.1/configure
Content-Type: application/json

{
  "ssid": "WiFiNetwork",
  "password": "password123",
  "userId": "firebase-user-id",
  "firebaseUrl": "https://your-project.firebaseio.com/"
}
```

## Contributing

### Adding New Sensor Types
1. Update ESP32 code to read new sensor
2. Add sensor data to Firebase structure
3. Update React dashboard to display new data
4. Add configuration options if needed

### Extending Automation
1. Add new automation rules in ESP32 code
2. Create UI controls in React dashboard
3. Update Firebase database structure
4. Test with multiple scenarios

## Support

For technical support or questions:
1. Check this documentation first
2. Verify hardware connections
3. Check Firebase console for data
4. Review ESP32 serial monitor output
5. Test with minimal configuration

## Version History

- **v1.0.0**: Initial release with basic irrigation control
- **v1.1.0**: Added multi-device support and user accounts
- **v1.2.0**: Enhanced automation and device management
