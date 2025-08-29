import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CheckCircle as CheckCircleIcon,
  Router as RouterIcon
} from '@mui/icons-material';
import { ref, push, set, get } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import WiFiDeviceScanner from '../services/WiFiDeviceScanner';

const steps = ['Add Device', 'WiFi Configuration', 'Complete Setup'];

const DeviceSetupWizard = ({ open, onClose }) => {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [wifiNetworks, setWifiNetworks] = useState([]);
  const [selectedWifi, setSelectedWifi] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const scanner = new WiFiDeviceScanner();

  // Scan for ESP32 devices already sending data to Firebase
  const scanForDevices = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Scan deviceData for devices with current user's userId
      const deviceDataRef = ref(database, 'deviceData');
      const snapshot = await get(deviceDataRef);
      
      if (snapshot.exists()) {
        const deviceData = snapshot.val();
        const userDevices = [];
        
        // Find devices that belong to current user
        Object.entries(deviceData).forEach(([deviceId, data]) => {
          if (data && data.userId === currentUser.uid) {
            userDevices.push({
              deviceId: deviceId,
              ssid: `Active Device: ${deviceId}`,
              signal: 'Online',
              lastSeen: data.timestamp || 'Unknown',
              moisture: data.moisture || 0,
              temperature: data.temperature || 0,
              humidity: data.humidity || 0,
              valveStatus: data.valveStatus || 'OFF'
            });
          }
        });
        
        setAvailableDevices(userDevices);
        
        if (userDevices.length === 0) {
          setError('No ESP32 devices found sending data to your account. Make sure your ESP32 is running and configured with your User ID.');
        }
      } else {
        setAvailableDevices([]);
        setError('No device data found in Firebase. Make sure your ESP32 is sending data.');
      }
    } catch (err) {
      setError('Failed to scan for devices: ' + err.message);
      setAvailableDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Connect to selected ESP32 device
  const connectToDevice = async (device) => {
    setLoading(true);
    setError('');
    
    try {
      setSelectedDevice(device);
      
      // Connect to device and get its info
      const deviceInfo = await scanner.connectToDevice(device);
      
      setDeviceInfo(deviceInfo);
      setWifiNetworks(deviceInfo.wifiNetworks || []);
      setActiveStep(2);
    } catch (err) {
      setError('Failed to connect to device: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Configure WiFi on ESP32
  const configureWifi = async () => {
    if (!selectedWifi || !wifiPassword) {
      setError('Please select a WiFi network and enter password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Send WiFi configuration to ESP32
      const wifiConfig = {
        ssid: selectedWifi,
        password: wifiPassword
      };
      
      const userConfig = {
        userId: currentUser.uid,
        firebaseUrl: 'https://drip-anurag-default-rtdb.firebaseio.com/'
      };
      
      const result = await scanner.configureDevice(selectedDevice, wifiConfig, userConfig);
      
      if (result.success) {
        setActiveStep(3);
        setSuccess('Device configured successfully!');
      } else {
        setError('Device configuration failed');
      }
    } catch (err) {
      setError('Failed to configure WiFi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete setup and add device to user's account
  const completeSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const deviceData = {
        name: deviceName || `Drip Device ${selectedDevice.deviceId.substring(-4)}`,
        location: deviceLocation,
        macAddress: selectedDevice.macAddress || 'N/A',
        deviceId: selectedDevice.deviceId,
        wifiNetwork: selectedWifi || 'Already Connected',
        firmware: deviceInfo?.firmware || 'ESP32 Drip v1.0',
        features: deviceInfo?.features || ['irrigation', 'sensors'],
        status: 'online',
        addedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      };
      
      // Add device to user's device list
      const deviceRef = ref(database, `users/${currentUser.uid}/devices`);
      await push(deviceRef, deviceData);
      
      // For manually added devices, don't override existing data
      const deviceDataRef = ref(database, `deviceData/${selectedDevice.deviceId}`);
      await set(deviceDataRef, {
        userId: currentUser.uid,
        moisture: 0,
        temperature: 0,
        humidity: 0,
        valveStatus: 'OFF',
        lastUpdate: new Date().toISOString(),
        timestamp: Date.now()
      });
      
      setSuccess('Device added successfully!');
      
      // Close wizard after success
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err) {
      setError('Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setAvailableDevices([]);
    setSelectedDevice(null);
    setDeviceInfo(null);
    setWifiNetworks([]);
    setSelectedWifi('');
    setWifiPassword('');
    setDeviceName('');
    setDeviceLocation('');
    setError('');
    setSuccess('');
    onClose();
  };

  const handleNext = () => {
    if (activeStep === 1 && selectedDevice) {
      // Check if this is a Firebase-detected device (already active)
      if (selectedDevice.ssid.includes('Active Device:')) {
        // Skip connection step for Firebase devices, go directly to setup
        setActiveStep(3);
      } else {
        // Try to connect to physical device
        connectToDevice(selectedDevice);
      }
    } else if (activeStep === 2) {
      configureWifi();
    } else if (activeStep === 3) {
      completeSetup();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  useEffect(() => {
    // Don't auto-scan, let user trigger manually
  }, [open, activeStep]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add ESP32 Device
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Enter your ESP32 device ID manually or scan Firebase for active devices
            </Typography>
            
            <TextField
              fullWidth
              label="Device ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g., esp32_E058"
              sx={{ mb: 2 }}
              helperText="Check your ESP32 Serial Monitor for the Device ID"
            />
            
            <Button
              variant="contained"
              onClick={() => {
                if (deviceId.trim()) {
                  setSelectedDevice({
                    deviceId: deviceId.trim(),
                    ssid: `Manual Entry: ${deviceId.trim()}`,
                    signal: 'N/A'
                  });
                  setActiveStep(2); // Skip WiFi scan step
                }
              }}
              disabled={!deviceId.trim()}
              sx={{ mb: 3 }}
            >
              Add Device Manually
            </Button>
            
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
              OR
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Scan Firebase for devices already sending data:
            </Typography>
            
            <Button
              variant="outlined"
              onClick={scanForDevices}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Scanning...' : 'Scan for Active Devices'}
            </Button>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : availableDevices.length > 0 ? (
              <List>
                {availableDevices.map((device, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton
                      selected={selectedDevice?.deviceId === device.deviceId}
                      onClick={() => setSelectedDevice(device)}
                    >
                      <ListItemIcon>
                        <RouterIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={device.ssid}
                        secondary={`Status: ${device.signal} | Moisture: ${device.moisture}% | Temp: ${device.temperature}°C`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No active ESP32 devices found sending data to your account.
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            {selectedDevice && selectedDevice.ssid.includes('Active Device:') ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Device Ready
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Selected Device: {selectedDevice.ssid}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  This device is already active and sending data to Firebase.
                </Typography>
                <Box sx={{ p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Live Data:</Typography>
                  <Typography variant="body2">Moisture: {selectedDevice.moisture}%</Typography>
                  <Typography variant="body2">Temperature: {selectedDevice.temperature}°C</Typography>
                  <Typography variant="body2">Humidity: {selectedDevice.humidity}%</Typography>
                  <Typography variant="body2">Valve: {selectedDevice.valveStatus}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Click Next to proceed with device setup.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Connect to Device
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Selected Device: {selectedDevice?.ssid}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click Next to connect to this device and retrieve its configuration.
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure WiFi
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select your WiFi network and enter the password
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>WiFi Network</InputLabel>
              <Select
                value={selectedWifi}
                onChange={(e) => setSelectedWifi(e.target.value)}
                label="WiFi Network"
              >
                {wifiNetworks.map((network, index) => (
                  <MenuItem key={index} value={network.ssid}>
                    <Box display="flex" alignItems="center" width="100%">
                      <WifiIcon sx={{ mr: 1 }} />
                      <Box flexGrow={1}>
                        <Typography>{network.ssid}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {network.security} | Signal: {network.signal}dBm
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              type="password"
              label="WiFi Password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Complete Setup
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Add a name and location for your device
            </Typography>
            
            <TextField
              fullWidth
              label="Device Name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., Garden Drip System"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Location"
              value={deviceLocation}
              onChange={(e) => setDeviceLocation(e.target.value)}
              placeholder="e.g., Backyard, Zone A"
              sx={{ mb: 2 }}
            />
            
            {deviceInfo && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
                <Typography variant="subtitle2">Device Information:</Typography>
                <Typography variant="body2">Firmware: {deviceInfo.firmware}</Typography>
                <Typography variant="body2">Features: {deviceInfo.features.join(', ')}</Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '15px'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white' }}>
        Add New Device
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} sx={{ color: 'white' }}>
          Cancel
        </Button>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{ color: 'white' }}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            loading ||
            (activeStep === 0 && !selectedDevice) ||
            (activeStep === 2 && (!selectedWifi || !wifiPassword))
          }
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {loading ? <CircularProgress size={20} /> : 
           activeStep === steps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceSetupWizard;
