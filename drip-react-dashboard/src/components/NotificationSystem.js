import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  IconButton,
  Typography,
  Chip,
  Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  Opacity as MoistureIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const NotificationSystem = ({ devices }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [openNotification, setOpenNotification] = useState(null);

  useEffect(() => {
    if (!currentUser || !devices.length) return;

    const unsubscribes = [];

    devices.forEach(device => {
      // Listen for device alerts
      const alertsRef = ref(database, `deviceData/${device.deviceId}/alerts`);
      const unsubscribe = onValue(alertsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          Object.entries(data).forEach(([alertId, alert]) => {
            if (!alert.acknowledged) {
              addNotification({
                id: `${device.deviceId}_${alertId}`,
                deviceId: device.deviceId,
                deviceName: device.name || device.deviceId,
                type: alert.type,
                message: alert.message,
                severity: alert.severity || 'info',
                timestamp: alert.timestamp,
                data: alert.data
              });
            }
          });
        }
      });
      unsubscribes.push(unsubscribe);

      // Monitor sensor values for automatic alerts
      const sensorRef = ref(database, `deviceData/${device.deviceId}`);
      const sensorUnsubscribe = onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          checkSensorAlerts(device, data);
        }
      });
      unsubscribes.push(sensorUnsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, devices]);

  const addNotification = (notification) => {
    setNotifications(prev => {
      // Avoid duplicates
      if (prev.find(n => n.id === notification.id)) {
        return prev;
      }
      return [...prev, notification];
    });

    // Show the latest notification
    setOpenNotification(notification);
  };

  const checkSensorAlerts = (device, sensorData) => {
    const now = Date.now();
    
    // Low moisture alert
    if (sensorData.moisture < 20) {
      addNotification({
        id: `${device.deviceId}_low_moisture_${Math.floor(now / 300000)}`, // Group by 5-minute intervals
        deviceId: device.deviceId,
        deviceName: device.name || device.deviceId,
        type: 'low_moisture',
        message: `Critical: Soil moisture is very low (${sensorData.moisture}%)`,
        severity: 'error',
        timestamp: now,
        data: { moisture: sensorData.moisture }
      });
    } else if (sensorData.moisture < 30) {
      addNotification({
        id: `${device.deviceId}_moisture_warning_${Math.floor(now / 600000)}`, // Group by 10-minute intervals
        deviceId: device.deviceId,
        deviceName: device.name || device.deviceId,
        type: 'moisture_warning',
        message: `Warning: Soil moisture is getting low (${sensorData.moisture}%)`,
        severity: 'warning',
        timestamp: now,
        data: { moisture: sensorData.moisture }
      });
    }

    // Temperature alerts
    if (sensorData.temperature > 35) {
      addNotification({
        id: `${device.deviceId}_high_temp_${Math.floor(now / 900000)}`, // Group by 15-minute intervals
        deviceId: device.deviceId,
        deviceName: device.name || device.deviceId,
        type: 'high_temperature',
        message: `High temperature detected (${sensorData.temperature}°C)`,
        severity: 'warning',
        timestamp: now,
        data: { temperature: sensorData.temperature }
      });
    }

    // Device offline alert
    const lastUpdate = sensorData.timestamp || 0;
    const timeSinceUpdate = now - lastUpdate;
    if (timeSinceUpdate > 600000) { // 10 minutes
      addNotification({
        id: `${device.deviceId}_offline_${Math.floor(now / 1800000)}`, // Group by 30-minute intervals
        deviceId: device.deviceId,
        deviceName: device.name || device.deviceId,
        type: 'device_offline',
        message: `Device appears to be offline`,
        severity: 'error',
        timestamp: now,
        data: { lastSeen: lastUpdate }
      });
    }
  };

  const handleCloseNotification = () => {
    setOpenNotification(null);
  };

  const acknowledgeNotification = async (notification) => {
    try {
      // Mark as acknowledged in Firebase
      const alertRef = ref(database, `deviceData/${notification.deviceId}/alerts/${notification.id}`);
      await update(alertRef, {
        acknowledged: true,
        acknowledgedAt: Date.now(),
        acknowledgedBy: currentUser.uid
      });

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setOpenNotification(null);
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'low_moisture':
      case 'moisture_warning':
        return <MoistureIcon />;
      case 'high_temperature':
      case 'device_offline':
        return <WarningIcon />;
      case 'success':
        return <SuccessIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getNotificationColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <>
      {/* Active notification display */}
      {openNotification && (
        <Snackbar
          open={Boolean(openNotification)}
          onClose={handleCloseNotification}
          autoHideDuration={8000}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Slide}
          TransitionProps={{ direction: 'left' }}
        >
          <Alert
            severity={getNotificationColor(openNotification.severity)}
            icon={getNotificationIcon(openNotification.type)}
            sx={{
              minWidth: '300px',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '& .MuiAlert-icon': {
                color: openNotification.severity === 'error' ? '#f44336' : 
                       openNotification.severity === 'warning' ? '#ff9800' : 
                       openNotification.severity === 'success' ? '#4caf50' : '#2196f3'
              }
            }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label="Acknowledge"
                  size="small"
                  onClick={() => acknowledgeNotification(openNotification)}
                  sx={{
                    color: 'white',
                    background: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleCloseNotification}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                {openNotification.deviceName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {openNotification.message}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {new Date(openNotification.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Alert>
        </Snackbar>
      )}

      {/* Notification counter for debugging */}
      {notifications.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 9999
          }}
        >
          {notifications.length}
        </Box>
      )}
    </>
  );
};

export default NotificationSystem;
