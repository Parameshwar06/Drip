# 🌱 ESP32 Drip Irrigation System - Hardware Setup Guide

## Overview
Your React dashboard is now ready for real hardware! Follow these steps to upload the Arduino code to your ESP32 and connect it to your irrigation system.

## 📋 What You Need
- ✅ ESP32 development board (connected via USB to COM5)
- ✅ Arduino IDE installed on your computer
- ✅ USB cable (data capable, not just power)
- ✅ Internet connection
- ✅ Your WiFi network credentials

## 🎯 Quick Start Checklist

### 1. Prepare Arduino IDE
- [ ] Download Arduino IDE 2.0+ from https://www.arduino.cc/en/software
- [ ] Install ESP32 board support (see detailed steps below)
- [ ] Install required libraries

### 2. Upload ESP32 Firmware
- [ ] Open the Arduino file: `esp32-drip-device-simple.ino`
- [ ] Select Board: ESP32 Dev Module
- [ ] Select Port: COM5 (CH9102)
- [ ] Click Upload (→) button
- [ ] Wait for "Done uploading" message

### 3. Test Device
- [ ] Open Serial Monitor (115200 baud)
- [ ] Reset ESP32 (press EN button)
- [ ] Verify startup messages with 🌱 emojis
- [ ] Check LED is ON (config mode)

### 4. Configure Device
- [ ] Look for WiFi network: ESP32_Drip_XXXXXX
- [ ] Connect with password: 12345678
- [ ] Open browser: http://192.168.4.1
- [ ] Follow setup wizard

## 📝 Detailed Instructions

### Step 1: Install Arduino IDE & Libraries

1. **Download Arduino IDE**
   ```
   https://www.arduino.cc/en/software
   ```

2. **Add ESP32 Board Support**
   - File → Preferences
   - Add to "Additional Boards Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   - Tools → Board → Boards Manager
   - Search "esp32" → Install "esp32 by Espressif Systems"

3. **Install Required Libraries** (Tools → Manage Libraries)
   - `ArduinoJson by Benoit Blanchon`
   - `Firebase ESP32 Client by Mobizt`
   - `WiFi by Arduino`
   - `EEPROM by Arduino`

### Step 2: Configure Board Settings

1. **Board Selection**
   - Tools → Board → esp32 → ESP32 Dev Module

2. **Port Selection**
   - Tools → Port → COM5 (CH9102)
   - ❗ If COM5 not visible, install CH340/CH341 drivers

3. **Upload Settings**
   - Upload Speed: 115200
   - Flash Mode: QIO
   - Flash Size: 4MB (32Mb)

### Step 3: Upload Firmware

1. **Copy Arduino Code**
   - Open file: `esp32-drip-device-simple.ino`
   - Copy all content (571 lines)
   - Paste into new Arduino sketch

2. **Upload Process**
   - Click Upload button (→)
   - If upload fails, hold BOOT button while clicking Upload
   - Wait for "Done uploading" message

3. **Expected Output**
   ```
   Sketch uses 1048576 bytes (80%) of program storage space
   esptool.py v4.2.1
   Serial port COM5
   Connecting........_____....._____
   Chip is ESP32-D0WDQ6 (revision 1)
   Hard resetting via RTS pin...
   Done uploading.
   ```

### Step 4: Test & Verify

1. **Open Serial Monitor**
   - Tools → Serial Monitor
   - Set baud rate: 115200
   - Press EN button on ESP32

2. **Expected Serial Output**
   ```
   🌱 ESP32 Drip Irrigation System Starting...
   📶 Creating WiFi Access Point: ESP32_Drip_A1B2C3
   🔑 Password: 12345678
   🌐 Server started at: 192.168.4.1
   💡 LED ON - Configuration mode active
   ⏰ Waiting for configuration...
   ```

3. **Visual Indicators**
   - ✅ LED should be ON (indicates config mode)
   - ✅ ESP32 creates WiFi network
   - ✅ Web server responds at 192.168.4.1

## 🔧 Hardware Connections

### Pin Assignments
```
A0  → Soil Moisture Sensor (analog)
GPIO2 → LED/Valve Control (digital)
GPIO0 → Configuration Button (optional)
GND → Ground for sensors
3.3V → Power for sensors
```

### Wiring Example
```
ESP32        Moisture Sensor
-----        ---------------
A0     ←---→ Signal
3.3V   ←---→ VCC
GND    ←---→ GND

ESP32        Valve/LED
-----        ---------
GPIO2  ←---→ Control Pin
GND    ←---→ Ground
```

## 🌐 Device Configuration Process

### Step 1: Connect to ESP32
1. Look for WiFi network: `ESP32_Drip_XXXXXX`
2. Connect with password: `12345678`
3. Open browser: `http://192.168.4.1`

### Step 2: Device Setup Page
The ESP32 web interface will show:
```
🌱 ESP32 Drip Irrigation Setup

Device Information:
- Device ID: esp32_a1b2c3
- MAC Address: AA:BB:CC:DD:EE:FF
- Firmware: 1.0.0

WiFi Configuration:
[ Select Network ▼ ]
[ WiFi Password    ]

User Configuration:
[ User ID          ] ← Copy from dashboard
[ Device Name      ]
[ Location         ]

[Configure Device]
```

### Step 3: Get User ID
1. Open dashboard: https://drip-anurag.web.app
2. Go to Device Manager tab
3. Look for "User ID" in the interface
4. Copy the ID (starts with user ID from Firebase Auth)

### Step 4: Complete Configuration
1. Select your home WiFi network
2. Enter WiFi password
3. Paste your User ID
4. Enter device name and location
5. Click "Configure Device"

### Step 5: Device Restart
```
✅ Configuration saved successfully!
🔄 Restarting device...
📶 Connecting to your WiFi...
🌐 Connected! IP: 192.168.1.xxx
🔥 Firebase connected
📊 Sending sensor data...
💡 LED OFF - Normal operation mode
```

## 📱 Dashboard Integration

### Auto-Discovery
Once configured, your device will:
1. ✅ Connect to your home WiFi
2. ✅ Automatically appear in your dashboard
3. ✅ Start sending real sensor data
4. ✅ Accept remote valve control commands

### Dashboard Features
- **Real-time Monitoring**: Live sensor readings
- **Remote Control**: Valve on/off control
- **Historical Data**: Charts and trends
- **Alerts**: Low moisture notifications
- **Multi-device Support**: Add multiple ESP32s

## 🚨 Troubleshooting

### Upload Issues
**Problem**: COM port not found
- Install CH340/CH341 drivers
- Try different USB cables/ports
- Check Device Manager for unknown devices

**Problem**: Upload timeout
- Hold BOOT button while uploading
- Lower upload speed to 57600
- Press EN button to reset, then try again

### WiFi Issues
**Problem**: Can't see ESP32 network
- Press and hold BOOT button for 3 seconds
- Check if LED is ON
- Try restarting ESP32

**Problem**: Can't connect to 192.168.4.1
- Ensure connected to ESP32's WiFi
- Try http:// instead of https://
- Clear browser cache

### Device Not Appearing
**Problem**: Device not in dashboard
- Verify WiFi credentials are correct
- Check User ID is copied correctly
- Monitor serial output for errors
- Try reconfiguring device

## 📊 Expected Sensor Readings

### Normal Operation
```
🌡️ Temperature: 20-30°C
💧 Humidity: 40-80%
🌱 Moisture: 0-100% (0=dry, 100=wet)
💡 Light: 0-1000 lux
🚰 Valve: open/closed
```

### Data Flow
```
ESP32 → Firebase → Dashboard
  ↑         ↓         ↓
Sensors   Database   Display
```

## 🎉 Success Indicators

### ✅ Everything Working When:
1. ESP32 connects to your WiFi automatically
2. Device appears in dashboard within 30 seconds
3. Real sensor readings appear (not test data)
4. LED turns OFF (normal operation mode)
5. You can control valve remotely
6. Charts show live data updates

## 📞 Support

### Dashboard URL
https://drip-anurag.web.app

### Serial Monitor Debugging
Keep Serial Monitor open to see real-time logs:
```
🌱 System started
📶 WiFi connected: YourNetwork
🔥 Firebase connected
📊 Moisture: 65% | Temp: 23.5°C
🚰 Valve command received: OPEN
💧 Watering started...
```

### Files Included
- `esp32-drip-device-simple.ino` (571 lines) - Main firmware
- Arduino Upload Guide in dashboard
- React dashboard deployed at https://drip-anurag.web.app

## 🚀 Next Steps

1. **Upload the code** to your ESP32
2. **Follow the setup wizard** at 192.168.4.1
3. **Test device** appears in dashboard
4. **Connect sensors** to the ESP32 pins
5. **Enjoy automated irrigation**! 🌱💧

---

*Your smart irrigation system is ready! From test data to real hardware in one upload.* 🎯
