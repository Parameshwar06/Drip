import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Wifi as WifiIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  DeviceHub as DeviceIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { ref, push, remove, onValue, off, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import DeviceSetupWizard from './DeviceSetupWizard';
import DeviceConfigDialog from './DeviceConfigDialog';
import ArduinoUploadGuide from './ArduinoUploadGuide';

const DeviceManager = () => {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [uploadGuideOpen, setUploadGuideOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const devicesRef = ref(database, `users/${currentUser.uid}/devices`);
    
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const deviceList = Object.entries(data).map(([id, device]) => ({
          id,
          ...device
        }));
        setDevices(deviceList);
      } else {
        setDevices([]);
      }
      setLoading(false);
    });

    return () => off(devicesRef, 'value', unsubscribe);
  }, [currentUser]);

  const handleAddDevice = () => {
    setSetupWizardOpen(true);
  };

  const handleConfigureDevice = (device) => {
    setSelectedDevice(device);
    setConfigDialogOpen(true);
  };

  const handleDeleteDevice = async (device) => {
    if (window.confirm(`Are you sure you want to remove "${device.name || device.deviceId}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        
        // Remove from user's device list
        await remove(ref(database, `users/${currentUser.uid}/devices/${device.id}`));
        
        // Optionally keep device data for historical purposes, just mark as inactive
        const deviceDataRef = ref(database, `deviceData/${device.deviceId}`);
        await update(deviceDataRef, {
          status: 'removed',
          removedAt: new Date().toISOString(),
          removedBy: currentUser.uid
        });
        
        console.log('Device removed successfully');
        
      } catch (error) {
        console.error('Error removing device:', error);
        alert('Error removing device: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getDeviceStatus = (device) => {
    const lastSeen = device.lastSeen ? new Date(device.lastSeen) : null;
    const now = new Date();
    const timeDiff = lastSeen ? (now - lastSeen) / 1000 / 60 : null; // minutes

    if (!lastSeen || timeDiff > 10) {
      return { status: 'offline', color: 'error' };
    } else if (timeDiff > 5) {
      return { status: 'warning', color: 'warning' };
    } else {
      return { status: 'online', color: 'success' };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          My Devices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddDevice}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          Add Device
        </Button>
      </Box>

      {devices.length === 0 ? (
        <Card
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            textAlign: 'center',
            py: 6
          }}
        >
          <CardContent>
            <DeviceIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              No Devices Found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Upload firmware to your ESP32 device first, then add it to your dashboard
            </Typography>
            
            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setUploadGuideOpen(true)}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Upload Arduino Code
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddDevice}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                Add Device
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <List>
          {devices.map((device) => {
            const deviceStatus = getDeviceStatus(device);
            return (
              <Card
                key={device.id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '15px',
                  mb: 2
                }}
              >
                <ListItem>
                  <WifiIcon sx={{ color: 'white', mr: 2 }} />
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {device.name || `Device ${device.id.substring(0, 8)}`}
                        </Typography>
                        <Chip
                          label={deviceStatus.status}
                          color={deviceStatus.color}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          MAC: {device.macAddress}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Location: {device.location || 'Not set'}
                        </Typography>
                        {device.lastSeen && (
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Last seen: {new Date(device.lastSeen).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleConfigureDevice(device)}
                      sx={{ color: 'white', mr: 1 }}
                    >
                      <SettingsIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteDevice(device)}
                      sx={{ color: 'rgba(255, 100, 100, 0.8)' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Card>
            );
          })}
        </List>
      )}

      <DeviceSetupWizard
        open={setupWizardOpen}
        onClose={() => setSetupWizardOpen(false)}
      />

      <DeviceConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        device={selectedDevice}
      />

      <ArduinoUploadGuide
        open={uploadGuideOpen}
        onClose={() => setUploadGuideOpen(false)}
      />
    </Box>
  );
};

export default DeviceManager;
