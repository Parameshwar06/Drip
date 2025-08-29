import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { ref, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const DeviceConfigDialog = ({ open, onClose, device }) => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState({
    name: '',
    location: '',
    moistureThreshold: 30,
    autoWatering: true,
    wateringDuration: 5,
    checkInterval: 60
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (device) {
      setConfig({
        name: device.name || '',
        location: device.location || '',
        moistureThreshold: device.moistureThreshold || 30,
        autoWatering: device.autoWatering !== undefined ? device.autoWatering : true,
        wateringDuration: device.wateringDuration || 5,
        checkInterval: device.checkInterval || 60
      });
    }
  }, [device]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update device configuration in Firebase
      const deviceRef = ref(database, `users/${currentUser.uid}/devices/${device.id}`);
      await update(deviceRef, {
        name: config.name,
        location: config.location,
        moistureThreshold: config.moistureThreshold,
        autoWatering: config.autoWatering,
        wateringDuration: config.wateringDuration,
        checkInterval: config.checkInterval,
        lastConfigUpdate: new Date().toISOString()
      });

      // Update device settings in device data for ESP32 to read
      const deviceDataRef = ref(database, `deviceData/${device.deviceId}/settings`);
      await update(deviceDataRef, {
        moistureThreshold: config.moistureThreshold,
        autoWatering: config.autoWatering,
        wateringDuration: config.wateringDuration,
        checkInterval: config.checkInterval,
        lastUpdate: new Date().toISOString()
      });

      setSuccess('Device configuration updated successfully!');
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError('Failed to update device configuration');
      console.error('Config update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Send a test command to the device
      const testRef = ref(database, `deviceData/${device.deviceId}/commands`);
      await update(testRef, {
        test: {
          command: 'ping',
          timestamp: new Date().toISOString(),
          id: Date.now()
        }
      });
      
      setSuccess('Test command sent to device');
    } catch (err) {
      setError('Failed to send test command');
    } finally {
      setLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        Configure Device: {device.name || 'Unnamed Device'}
      </DialogTitle>

      <DialogContent>
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

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Basic Information
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Device Name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                    InputProps={{ style: { color: 'white' } }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Location"
                    value={config.location}
                    onChange={(e) => setConfig(prev => ({ ...prev, location: e.target.value }))}
                    InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                    InputProps={{ style: { color: 'white' } }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Watering Settings */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Watering Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoWatering}
                      onChange={(e) => setConfig(prev => ({ ...prev, autoWatering: e.target.checked }))}
                    />
                  }
                  label="Enable Auto Watering"
                  sx={{ color: 'white', mb: 2 }}
                />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                    Moisture Threshold: {config.moistureThreshold}%
                  </Typography>
                  <Slider
                    value={config.moistureThreshold}
                    onChange={(e, value) => setConfig(prev => ({ ...prev, moistureThreshold: value }))}
                    min={10}
                    max={80}
                    step={5}
                    marks={[
                      { value: 20, label: '20%' },
                      { value: 40, label: '40%' },
                      { value: 60, label: '60%' }
                    ]}
                    sx={{ color: 'white' }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Water when moisture drops below this level
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                    Watering Duration: {config.wateringDuration} minutes
                  </Typography>
                  <Slider
                    value={config.wateringDuration}
                    onChange={(e, value) => setConfig(prev => ({ ...prev, wateringDuration: value }))}
                    min={1}
                    max={30}
                    step={1}
                    marks={[
                      { value: 5, label: '5min' },
                      { value: 15, label: '15min' },
                      { value: 30, label: '30min' }
                    ]}
                    sx={{ color: 'white' }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                    Check Interval: {config.checkInterval} minutes
                  </Typography>
                  <Slider
                    value={config.checkInterval}
                    onChange={(e, value) => setConfig(prev => ({ ...prev, checkInterval: value }))}
                    min={5}
                    max={240}
                    step={5}
                    marks={[
                      { value: 30, label: '30min' },
                      { value: 60, label: '1hr' },
                      { value: 120, label: '2hr' }
                    ]}
                    sx={{ color: 'white' }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    How often to check moisture levels
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Device Status */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Device Status
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      MAC Address
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {device.macAddress}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Firmware
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {device.firmware || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Last Seen
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      WiFi Network
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {device.wifiNetwork || 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleTestConnection}
                    disabled={loading}
                    sx={{ 
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      }
                    }}
                  >
                    Test Connection
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ color: 'white' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceConfigDialog;
