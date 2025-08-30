import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue, set, query, limitToLast, get, orderByChild } from 'firebase/database';
import { database } from '../config/firebase';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  IconButton,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Tab,
  Tabs
} from '@mui/material';
import { styled, keyframes } from '@mui/system';
import { 
  Logout, 
  Opacity, 
  Thermostat, 
  Water, 
  PowerSettingsNew,
  Refresh,
  TrendingUp,
  Dashboard as DashboardIcon,
  DeviceHub as DeviceIcon,
  Analytics as AnalyticsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import MoistureChart from './MoistureChart';
import DeviceManager from './DeviceManager';
import AnalyticsDashboard from './AnalyticsDashboard';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
`;

// Material Design 3 Styled Components
const DashboardContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

const MD3AppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.md3?.surface || theme.palette.background.paper,
  color: theme.palette.md3?.onSurface || theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.md3?.outlineVariant || theme.palette.divider}`,
  boxShadow: theme.palette.mode === 'light' 
    ? '0px 1px 3px rgba(0,0,0,0.12)'
    : '0px 1px 3px rgba(255,255,255,0.12)',
}));

const MD3Card = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.md3?.surface || theme.palette.background.paper,
  border: `1px solid ${theme.palette.md3?.outlineVariant || theme.palette.divider}`,
  borderRadius: '12px',
  boxShadow: theme.palette.mode === 'light' 
    ? '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)'
    : '0px 1px 3px rgba(255,255,255,0.12), 0px 1px 2px rgba(255,255,255,0.24)',
  animation: `${fadeIn} 0.6s ease-out`,
  transition: 'all 0.3s ease',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'light' 
      ? '0px 4px 8px rgba(0,0,0,0.16), 0px 2px 4px rgba(0,0,0,0.32)'
      : '0px 4px 8px rgba(255,255,255,0.16), 0px 2px 4px rgba(255,255,255,0.32)',
  },
}));

const SensorValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5em',
  fontWeight: 400,
  color: theme.palette.md3?.primary || theme.palette.primary.main,
  fontFamily: theme.typography.displaySmall?.fontFamily || theme.typography.fontFamily,
  animation: `${pulse} 2s ease-in-out infinite`,
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: status === 'ON' 
    ? theme.palette.success?.main || '#4CAF50'
    : theme.palette.error?.main || '#F44336',
  color: status === 'ON' 
    ? theme.palette.success?.contrastText || '#FFFFFF'
    : theme.palette.error?.contrastText || '#FFFFFF',
  fontWeight: 500,
  fontSize: '0.75rem',
  borderRadius: '8px',
  animation: `${float} 3s ease-in-out infinite`,
}));

const ControlButton = styled(Button)(({ theme, variant: buttonVariant }) => ({
  backgroundColor: buttonVariant === 'on' 
    ? theme.palette.success?.main || '#4CAF50'
    : theme.palette.error?.main || '#F44336',
  color: '#FFFFFF',
  borderRadius: '20px',
  textTransform: 'none',
  fontWeight: 500,
  padding: '10px 24px',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
}));

const MD3RefreshButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: `${theme.palette.md3?.primary || theme.palette.primary.main}0F`,
  color: theme.palette.md3?.primary || theme.palette.primary.main,
  border: `1px solid ${theme.palette.md3?.outline || theme.palette.divider}`,
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    backgroundColor: `${theme.palette.md3?.primary || theme.palette.primary.main}1F`,
    transform: 'rotate(180deg)',
  },
}));

function Dashboard({ darkMode, onToggleDarkMode }) {
  const [sensorData, setSensorData] = useState({});
  const [moistureHistory, setMoistureHistory] = useState({});
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [controlMode, setControlMode] = useState('automatic'); // 'automatic' or 'manual'
  const [deviceOnlineStatus, setDeviceOnlineStatus] = useState({}); // Track online status per device

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up Firebase listeners for user:', currentUser.uid);

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, setting loading to false');
        setLoading(false);
        setCurrentTab(1); // Switch to Device Manager if stuck loading
      }
    }, 10000); // 10 second timeout

    // Listen to user's devices
    const devicesRef = ref(database, `users/${currentUser.uid}/devices`);
    const devicesUnsubscribe = onValue(devicesRef, (snapshot) => {
      clearTimeout(loadingTimeout); // Clear timeout on successful load
      
      const data = snapshot.val();
      if (data) {
        const deviceList = Object.entries(data).map(([id, device]) => ({
          id,
          ...device
        }));
        setDevices(deviceList);
        
        // Select first device by default
        if (deviceList.length > 0 && !selectedDevice) {
          setSelectedDevice(deviceList[0]);
        }
        
        // If we have devices, stay on dashboard tab
        if (deviceList.length > 0 && currentTab === 1) {
          setCurrentTab(0);
        }
      } else {
        setDevices([]);
        setSelectedDevice(null);
        
        // If no devices found, automatically switch to Device Manager tab
        if (currentTab === 0) {
          setCurrentTab(1);
        }
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(loadingTimeout); // Clear timeout on error
      console.error('Firebase error loading devices:', error);
      setDevices([]);
      setSelectedDevice(null);
      setLoading(false);
      
      // On error, also switch to Device Manager tab
      if (currentTab === 0) {
        setCurrentTab(1);
      }
    });

    return () => {
      devicesUnsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [currentUser, currentTab, selectedDevice, loading]);

  // Listen to selected device data
  useEffect(() => {
    if (!selectedDevice) return;

    console.log('Listening to device data:', selectedDevice.deviceId);

    // Listen to live sensor data from specific device
    const deviceDataRef = ref(database, `deviceData/${selectedDevice.deviceId}`);
    const dataUnsubscribe = onValue(deviceDataRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Device data received:', data);
      
      if (data) {
        setSensorData({
          moisture: data.moisture || 0,
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          valveStatus: data.valveStatus || 'OFF'
        });
        setLastUpdate(new Date());
        setFirebaseConnected(true);
        
        // Update device online status based on last update
        const now = Date.now();
        const lastSeen = data.timestamp || now;
        setDeviceOnlineStatus(prev => ({
          ...prev,
          [selectedDevice.deviceId]: (now - lastSeen) < 120000 // Online if last update < 2 minutes
        }));
      } else {
        console.log('No data found for device:', selectedDevice.deviceId);
        // Set demo data for testing when no real data exists
        setSensorData({
          moisture: 65,
          temperature: 24,
          humidity: 55,
          valveStatus: 'OFF'
        });
        setLastUpdate(new Date());
      }
    }, (error) => {
      console.error('Firebase error:', error);
      setFirebaseConnected(false);
      // Set demo data when Firebase fails
      setSensorData({
        moisture: 65,
        temperature: 24,
        humidity: 55,
        valveStatus: 'OFF'
      });
      setLastUpdate(new Date());
    });

    // Load moisture history for selected device
    const loadHistory = async () => {
      try {
        const historyRef = query(
          ref(database, `deviceData/${selectedDevice.deviceId}/history`),
          orderByChild('timestamp'),
          limitToLast(20)
        );
        
        const snapshot = await get(historyRef);
        const dataArr = [];
        
        snapshot.forEach(child => {
          const data = child.val();
          if (data && data.moisture !== undefined && data.timestamp) {
            dataArr.push(data);
          }
        });
        
        // Sort by timestamp ascending
        dataArr.sort((a, b) => a.timestamp - b.timestamp);
        setMoistureHistory(dataArr);
        console.log('Moisture history loaded:', dataArr.length, 'entries');
        
        // If no history data, create some demo data
        if (dataArr.length === 0) {
          const now = Math.floor(Date.now() / 1000);
          const demoData = [];
          for (let i = 10; i >= 0; i--) {
            demoData.push({
              moisture: Math.floor(Math.random() * 30) + 50, // Random moisture between 50-80
              timestamp: now - (i * 300) // 5-minute intervals
            });
          }
          setMoistureHistory(demoData);
          console.log('Demo history data created');
        }
      } catch (error) {
        console.error('Error loading moisture history:', error);
      }
    };

    // Load initial history
    loadHistory();

    // Set up interval to refresh chart every 10 seconds
    const chartInterval = setInterval(() => {
      loadHistory();
    }, 10000);

    return () => {
      dataUnsubscribe();
      clearInterval(chartInterval);
    };
  }, [selectedDevice]);

  const handleValveControl = async (status) => {
    if (!selectedDevice) return;
    
    try {
      // Send command to device
      const commandRef = ref(database, `deviceData/${selectedDevice.deviceId}/commands`);
      await set(commandRef, {
        valve: {
          command: status,
          timestamp: new Date().toISOString(),
          id: Date.now()
        }
      });
      
      // Update local state immediately for UI responsiveness
      setSensorData(prev => ({ ...prev, valveStatus: status }));
      
      console.log(`Valve command sent: ${status}`);
    } catch (error) {
      console.error('Error controlling valve:', error);
      alert('Error controlling valve: ' + error.message);
    }
  };

  const handleQuickWater = async (duration) => {
    if (!selectedDevice) return;
    
    try {
      // Send timed watering command
      const commandRef = ref(database, `deviceData/${selectedDevice.deviceId}/commands`);
      await set(commandRef, {
        valve: {
          command: 'ON',
          duration: duration,
          timestamp: new Date().toISOString(),
          id: Date.now()
        }
      });
      
      // Update local state
      setSensorData(prev => ({ ...prev, valveStatus: 'ON' }));
      
      console.log(`Quick water started: ${duration} minutes`);
      
      // Optional: Show notification
      alert(`Quick watering started for ${duration} minutes`);
      
    } catch (error) {
      console.error('Error starting quick water:', error);
      alert('Error starting quick watering: ' + error.message);
    }
  };

  const handleEmergencyStop = async () => {
    if (!selectedDevice) return;
    
    try {
      // Send emergency stop command
      const commandRef = ref(database, `deviceData/${selectedDevice.deviceId}/commands`);
      await set(commandRef, {
        valve: {
          command: 'OFF',
          emergency: true,
          timestamp: new Date().toISOString(),
          id: Date.now()
        }
      });
      
      // Update local state
      setSensorData(prev => ({ ...prev, valveStatus: 'OFF' }));
      
      console.log('Emergency stop activated');
      alert('Emergency stop activated - valve closed immediately');
      
    } catch (error) {
      console.error('Error executing emergency stop:', error);
      alert('Error executing emergency stop: ' + error.message);
    }
  };

  const handleSetAutomaticMode = async () => {
    if (!selectedDevice) return;
    
    try {
      // Send automatic mode command to device
      const commandRef = ref(database, `deviceData/${selectedDevice.deviceId}/commands/mode`);
      await set(commandRef, {
        command: 'AUTOMATIC',
        timestamp: new Date().toISOString(),
        id: Date.now()
      });
      
      console.log('Automatic mode command sent to ESP32');
    } catch (error) {
      console.error('Error setting automatic mode:', error);
      alert('Error setting automatic mode: ' + error.message);
    }
  };

  const handleSetManualMode = async () => {
    if (!selectedDevice) return;
    
    try {
      // Send manual mode command to device
      const commandRef = ref(database, `deviceData/${selectedDevice.deviceId}/commands/mode`);
      await set(commandRef, {
        command: 'MANUAL',
        timestamp: new Date().toISOString(),
        id: Date.now()
      });
      
      console.log('Manual mode command sent to ESP32');
    } catch (error) {
      console.error('Error setting manual mode:', error);
      alert('Error setting manual mode: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRefresh = async () => {
    if (!selectedDevice) return;
    
    try {
      const deviceDataRef = ref(database, `deviceData/${selectedDevice.deviceId}`);
      const snapshot = await get(deviceDataRef);
      const data = snapshot.val();
      
      if (data) {
        setSensorData({
          moisture: data.moisture || 0,
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          valveStatus: data.valveStatus || 'OFF'
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (loading) {
    return (
      <DashboardContainer 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            sx={{ 
              color: (theme) => theme.palette.md3?.primary || theme.palette.primary.main,
              marginBottom: 2 
            }} 
          />
          <Typography 
            variant="headlineSmall" 
            sx={{ 
              color: (theme) => theme.palette.text.primary, 
              mb: 1 
            }}
          >
            Loading Dashboard...
          </Typography>
          <Typography 
            variant="bodyMedium" 
            sx={{ 
              color: (theme) => theme.palette.text.secondary,
              mb: 3 
            }}
          >
            Checking for your devices...
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setLoading(false);
              setCurrentTab(1);
            }}
            sx={{ 
              textTransform: 'none',
              borderRadius: '20px',
            }}
          >
            Skip to Device Manager
          </Button>
        </Box>
      </DashboardContainer>
    );
  }

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderDashboardContent = () => {
    if (devices.length === 0) {
      return (
        <Container maxWidth="lg" sx={{ padding: '30px 20px', textAlign: 'center' }}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              py: 6
            }}
          >
            <CardContent>
              <DeviceIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
              <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                No Devices Found
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                Add your first ESP32 device to start monitoring your irrigation system
              </Typography>
              <Button
                variant="contained"
                onClick={() => setCurrentTab(1)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                Go to Device Manager
              </Button>
            </CardContent>
          </Card>
        </Container>
      );
    }

    if (!selectedDevice) {
      return (
        <Container maxWidth="lg" sx={{ padding: '30px 20px', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Select a device to view its data
          </Typography>
        </Container>
      );
    }

    return (
      <Container maxWidth="lg" sx={{ padding: '30px 20px' }}>
        {/* Device Selector */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Active Device: {selectedDevice.name || `Device ${selectedDevice.deviceId?.substring(0, 8)}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {devices.map((device) => (
              <Button
                key={device.id}
                variant={selectedDevice?.id === device.id ? 'contained' : 'outlined'}
                onClick={() => setSelectedDevice(device)}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)'
                  }
                }}
              >
                {device.name || `Device ${device.deviceId?.substring(0, 8)}`}
              </Button>
            ))}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Moisture Sensor */}
          <Grid item xs={12} sm={6} md={3}>
            <MD3Card>
              <CardContent sx={{ textAlign: 'center', padding: '30px 20px' }}>
                <Opacity sx={{ fontSize: '3em', color: '#2196f3', marginBottom: 1 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 1 }}>
                  Soil Moisture
                </Typography>
                <SensorValue>
                  {sensorData.moisture !== null ? sensorData.moisture : '--'}
                </SensorValue>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Moisture Level
                </Typography>
              </CardContent>
            </MD3Card>
          </Grid>

          {/* Temperature Sensor */}
          <Grid item xs={12} sm={6} md={3}>
            <MD3Card>
              <CardContent sx={{ textAlign: 'center', padding: '30px 20px' }}>
                <Thermostat sx={{ fontSize: '3em', color: '#ff5722', marginBottom: 1 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 1 }}>
                  Temperature
                </Typography>
                <SensorValue>
                  {sensorData.temperature !== null ? `${sensorData.temperature}°C` : '--'}
                </SensorValue>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Current Temp
                </Typography>
              </CardContent>
            </MD3Card>
          </Grid>

          {/* Humidity Sensor */}
          <Grid item xs={12} sm={6} md={3}>
            <MD3Card>
              <CardContent sx={{ textAlign: 'center', padding: '30px 20px' }}>
                <Water sx={{ fontSize: '3em', color: '#00bcd4', marginBottom: 1 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 1 }}>
                  Humidity
                </Typography>
                <SensorValue>
                  {sensorData.humidity !== null ? `${sensorData.humidity}%` : '--'}
                </SensorValue>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Air Humidity
                </Typography>
              </CardContent>
            </MD3Card>
          </Grid>

          {/* Valve Control */}
          <Grid item xs={12} sm={6} md={3}>
            <MD3Card>
              <CardContent sx={{ textAlign: 'center', padding: '30px 20px' }}>
                <PowerSettingsNew sx={{ fontSize: '3em', color: '#4caf50', marginBottom: 1 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 1 }}>
                  Valve Control
                </Typography>
                
                {/* Control Mode Toggle */}
                <Box sx={{ marginBottom: 2 }}>
                  <Tabs 
                    value={controlMode} 
                    onChange={(e, newValue) => {
                      setControlMode(newValue);
                      if (newValue === 'automatic') {
                        handleSetAutomaticMode();
                      } else if (newValue === 'manual') {
                        handleSetManualMode();
                      }
                    }}
                    variant="fullWidth"
                    sx={{
                      '& .MuiTab-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem',
                        minHeight: '32px',
                        padding: '6px 12px',
                      },
                      '& .Mui-selected': {
                        color: '#4caf50 !important',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#4caf50',
                        height: '2px',
                      },
                    }}
                  >
                    <Tab label="Auto" value="automatic" />
                    <Tab label="Manual" value="manual" />
                  </Tabs>
                </Box>
                
                {/* Status Display */}
                <Box sx={{ marginBottom: 2 }}>
                  <StatusChip 
                    label={sensorData.valveStatus === 'ON' ? 'OPEN' : 'CLOSED'}
                    status={sensorData.valveStatus}
                  />
                </Box>
                
                {/* Control Interface */}
                {controlMode === 'automatic' ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                      Automatic Mode Active
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      System controls valve based on moisture levels
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <ControlButton
                      variant="on"
                      onClick={() => handleValveControl('ON')}
                      disabled={sensorData.valveStatus === 'ON'}
                      size="small"
                    >
                      Open
                    </ControlButton>
                    <ControlButton
                      variant="off"
                      onClick={() => handleValveControl('OFF')}
                      disabled={sensorData.valveStatus === 'OFF'}
                      size="small"
                    >
                      Close
                    </ControlButton>
                  </Box>
                )}
                
                {/* Device Status - Only show if online */}
                {selectedDevice && deviceOnlineStatus[selectedDevice.deviceId] && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      size="small"
                      label="Device Online"
                      color="success"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                )}
              </CardContent>
            </MD3Card>
          </Grid>

          {/* Moisture Chart */}
          {moistureHistory.length > 0 && (
            <Grid item xs={12}>
              <MD3Card>
                <CardContent sx={{ padding: '30px' }}>
                  <MoistureChart 
                    moistureData={moistureHistory} 
                    deviceId={selectedDevice.deviceId}
                    onRefresh={handleRefresh}
                  />
                </CardContent>
              </MD3Card>
            </Grid>
          )}

          {/* Enhanced Device Controls */}
          <Grid item xs={12}>
            <MD3Card>
              <CardContent sx={{ padding: '30px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                  <PowerSettingsNew sx={{ fontSize: '2em', color: '#4caf50', marginRight: 1 }} />
                  <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                    Device Controls
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {/* Enhanced Valve Control */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Enhanced Valve Control
                      </Typography>
                      
                      {/* Control Mode Toggle */}
                      <Box sx={{ mb: 3 }}>
                        <Tabs 
                          value={controlMode} 
                          onChange={(e, newValue) => {
                            setControlMode(newValue);
                            if (newValue === 'automatic') {
                              // When switching to automatic, send signal to device
                              handleSetAutomaticMode();
                            } else if (newValue === 'manual') {
                              // When switching to manual, send signal to device
                              handleSetManualMode();
                            }
                          }}
                          variant="fullWidth"
                          sx={{
                            '& .MuiTab-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontWeight: 500,
                            },
                            '& .Mui-selected': {
                              color: '#4caf50 !important',
                            },
                            '& .MuiTabs-indicator': {
                              backgroundColor: '#4caf50',
                            },
                          }}
                        >
                          <Tab 
                            label="Automatic Mode" 
                            value="automatic" 
                            icon={<DeviceIcon />}
                            iconPosition="start"
                          />
                          <Tab 
                            label="Manual Control" 
                            value="manual" 
                            icon={<PowerSettingsNew />}
                            iconPosition="start"
                          />
                        </Tabs>
                      </Box>
                      
                      {controlMode === 'automatic' ? (
                        // Automatic Mode Display
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <StatusChip 
                              label={sensorData.valveStatus === 'ON' ? 'VALVE OPEN' : 'VALVE CLOSED'}
                              status={sensorData.valveStatus}
                            />
                            <Chip
                              size="small"
                              label={selectedDevice && deviceOnlineStatus[selectedDevice.deviceId] ? 'System Active' : 'Checking Status...'}
                              color={selectedDevice && deviceOnlineStatus[selectedDevice.deviceId] ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                          
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                            {sensorData.valveStatus === 'ON' ? 'System is automatically watering based on soil moisture' : 'System monitoring - will activate when needed'}
                          </Typography>
                          
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Current moisture: {sensorData.moisture}% | Threshold: 30%
                          </Typography>
                          
                          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                            <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 500 }}>
                              💡 Automatic mode handles watering based on moisture levels and weather conditions
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        // Manual Mode Controls
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <StatusChip 
                              label={sensorData.valveStatus === 'ON' ? 'VALVE OPEN' : 'VALVE CLOSED'}
                              status={sensorData.valveStatus}
                            />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {sensorData.valveStatus === 'ON' ? 'Water is flowing' : 'Water flow stopped'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <ControlButton
                              variant="on"
                              onClick={() => handleValveControl('ON')}
                              disabled={sensorData.valveStatus === 'ON'}
                              startIcon={<Water />}
                            >
                              Open Valve
                            </ControlButton>
                            <ControlButton
                              variant="off"
                              onClick={() => handleValveControl('OFF')}
                              disabled={sensorData.valveStatus === 'OFF'}
                              startIcon={<PowerSettingsNew />}
                            >
                              Close Valve
                            </ControlButton>
                          </Box>
                          
                          <Box sx={{ p: 2, backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                            <Typography variant="caption" sx={{ color: '#ffc107', fontWeight: 500 }}>
                              ⚠️ Manual mode overrides automatic watering. Switch back to automatic when done.
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Quick Actions */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Quick Actions
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => handleQuickWater(5)}
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(33, 150, 243, 0.5)',
                            '&:hover': {
                              borderColor: '#2196f3',
                              background: 'rgba(33, 150, 243, 0.1)'
                            }
                          }}
                        >
                          Quick Water (5 minutes)
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleQuickWater(10)}
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(76, 175, 80, 0.5)',
                            '&:hover': {
                              borderColor: '#4caf50',
                              background: 'rgba(76, 175, 80, 0.1)'
                            }
                          }}
                        >
                          Standard Water (10 minutes)
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleEmergencyStop}
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(244, 67, 54, 0.5)',
                            '&:hover': {
                              borderColor: '#f44336',
                              background: 'rgba(244, 67, 54, 0.1)'
                            }
                          }}
                        >
                          Emergency Stop
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </MD3Card>
          </Grid>
        </Grid>
      </Container>
    );
  };

  return (
    <DashboardContainer>
      <MD3AppBar position="static" elevation={0}>
        <Toolbar>
          <DashboardIcon sx={{ marginRight: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Smart Drip Irrigation Dashboard
          </Typography>
          
          {lastUpdate && (
            <Typography variant="caption" sx={{ marginRight: 2, opacity: 0.8 }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
              {!firebaseConnected && (
                <span style={{ color: '#ff9800', marginLeft: '8px' }}>
                  (Demo Mode - Firebase Disconnected)
                </span>
              )}
            </Typography>
          )}
          
          <IconButton
            onClick={onToggleDarkMode}
            sx={{ 
              marginRight: 1,
              color: (theme) => theme.palette.md3?.onSurface || theme.palette.text.primary,
              '&:hover': {
                backgroundColor: (theme) => `${theme.palette.md3?.onSurface || theme.palette.text.primary}08`,
              }
            }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          
          <MD3RefreshButton onClick={handleRefresh}>
            <Refresh />
          </MD3RefreshButton>
          
          <Typography variant="body2" sx={{ marginLeft: 2, marginRight: 2 }}>
            {currentUser?.email}
          </Typography>
          
          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<Logout />}
            sx={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </MD3AppBar>

      {/* Navigation Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: (theme) => theme.palette.md3?.outlineVariant || theme.palette.divider,
        backgroundColor: (theme) => theme.palette.md3?.surface || theme.palette.background.paper,
      }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: (theme) => theme.palette.md3?.onSurfaceVariant || theme.palette.text.secondary,
              '&.Mui-selected': {
                color: (theme) => theme.palette.md3?.primary || theme.palette.primary.main,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: (theme) => theme.palette.md3?.primary || theme.palette.primary.main,
              height: '3px',
              borderRadius: '3px',
            }
          }}
        >
          <Tab 
            label="Dashboard" 
            icon={<DashboardIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Device Manager" 
            icon={<DeviceIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Analytics" 
            icon={<AnalyticsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && renderDashboardContent()}
      {currentTab === 1 && (
        <Container maxWidth="lg" sx={{ padding: '30px 20px' }}>
          <DeviceManager />
        </Container>
      )}
      {currentTab === 2 && (
        <Container maxWidth="lg" sx={{ padding: '30px 20px' }}>
          <AnalyticsDashboard devices={devices} selectedDevice={selectedDevice} />
        </Container>
      )}

    </DashboardContainer>
  );
}

export default Dashboard;
