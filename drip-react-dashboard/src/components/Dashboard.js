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
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import MoistureChart from './MoistureChart';
import DeviceManager from './DeviceManager';
import NotificationSystem from './NotificationSystem';
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

// Styled Components
const DashboardContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6))',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
});

const GlassAppBar = styled(AppBar)({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
  },
});

const GlassCard = styled(Card)({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '20px',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.1)
  `,
  animation: `${fadeIn} 0.6s ease-out`,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `
      0 15px 40px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 1px 0 rgba(255, 255, 255, 0.15)
    `,
    border: '1px solid rgba(255, 255, 255, 0.25)',
  },
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
  },
});

const SensorValue = styled(Typography)({
  fontSize: '2.5em',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #ffffff, #e0e0e0)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  animation: `${pulse} 2s ease-in-out infinite`,
});

const StatusChip = styled(Chip)(({ status }) => ({
  background: status === 'ON' 
    ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.8), rgba(56, 142, 60, 0.8))'
    : 'linear-gradient(135deg, rgba(244, 67, 54, 0.8), rgba(211, 47, 47, 0.8))',
  color: 'white',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  fontWeight: 600,
  animation: `${float} 3s ease-in-out infinite`,
}));

const ControlButton = styled(Button)(({ variant: buttonVariant }) => ({
  background: buttonVariant === 'on' 
    ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.8), rgba(56, 142, 60, 0.8))'
    : 'linear-gradient(135deg, rgba(244, 67, 54, 0.8), rgba(211, 47, 47, 0.8))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '15px',
  padding: '12px 24px',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
}));

const RefreshButton = styled(IconButton)({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: 'white',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'rotate(180deg)',
  },
});

function Dashboard() {
  const [sensorData, setSensorData] = useState({});
  const [moistureHistory, setMoistureHistory] = useState({});
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

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
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 2 
            }} 
          />
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
            Loading Dashboard...
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Checking for your devices...
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setLoading(false);
              setCurrentTab(1);
            }}
            sx={{ 
              mt: 3,
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.5)'
              }
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
            <GlassCard>
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
            </GlassCard>
          </Grid>

          {/* Temperature Sensor */}
          <Grid item xs={12} sm={6} md={3}>
            <GlassCard>
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
            </GlassCard>
          </Grid>

          {/* Humidity Sensor */}
          <Grid item xs={12} sm={6} md={3}>
            <GlassCard>
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
            </GlassCard>
          </Grid>

          {/* Valve Control */}
          <Grid item xs={12} sm={6} md={3}>
            <GlassCard>
              <CardContent sx={{ textAlign: 'center', padding: '30px 20px' }}>
                <PowerSettingsNew sx={{ fontSize: '3em', color: '#4caf50', marginBottom: 1 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 1 }}>
                  Valve Control
                </Typography>
                
                <Box sx={{ marginBottom: 2 }}>
                  <StatusChip 
                    label={sensorData.valveStatus === 'ON' ? 'OPEN' : 'CLOSED'}
                    status={sensorData.valveStatus}
                  />
                </Box>
                
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
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Moisture Chart */}
          {moistureHistory.length > 0 && (
            <Grid item xs={12}>
              <GlassCard>
                <CardContent sx={{ padding: '30px' }}>
                  <MoistureChart 
                    moistureData={moistureHistory} 
                    deviceId={selectedDevice.deviceId}
                    onRefresh={handleRefresh}
                  />
                </CardContent>
              </GlassCard>
            </Grid>
          )}

          {/* Enhanced Device Controls */}
          <Grid item xs={12}>
            <GlassCard>
              <CardContent sx={{ padding: '30px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                  <PowerSettingsNew sx={{ fontSize: '2em', color: '#4caf50', marginRight: 1 }} />
                  <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                    Device Controls
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {/* Manual Valve Control */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 3, 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Manual Valve Control
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <StatusChip 
                          label={sensorData.valveStatus === 'ON' ? 'VALVE OPEN' : 'VALVE CLOSED'}
                          status={sensorData.valveStatus}
                        />
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {sensorData.valveStatus === 'ON' ? 'Water is flowing' : 'Water flow stopped'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
    );
  };

  return (
    <DashboardContainer>
      <GlassAppBar position="static">
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
          
          <RefreshButton onClick={handleRefresh}>
            <Refresh />
          </RefreshButton>
          
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
      </GlassAppBar>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': {
                color: 'white',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#667eea',
            }
          }}
        >
          <Tab 
            label="Dashboard" 
            icon={<DashboardIcon />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Device Manager" 
            icon={<DeviceIcon />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Analytics" 
            icon={<AnalyticsIcon />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
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

      {/* Notification System */}
      <NotificationSystem devices={devices} />
    </DashboardContainer>
  );
}

export default Dashboard;
