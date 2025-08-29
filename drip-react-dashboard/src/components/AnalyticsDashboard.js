import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  WaterDrop as WaterIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database } from '../config/firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsDashboard = ({ devices, selectedDevice }) => {
  const [analytics, setAnalytics] = useState({
    moistureTrends: [],
    wateringHistory: [],
    efficiency: {},
    predictions: {}
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (selectedDevice) {
      loadAnalytics();
    }
  }, [selectedDevice, timeRange]);

  const loadAnalytics = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      // Load historical data for analytics
      const now = Date.now();
      const ranges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const startTime = now - ranges[timeRange];

      // Get sensor history
      const historyRef = query(
        ref(database, `deviceData/${selectedDevice.deviceId}/history`),
        orderByChild('timestamp'),
        limitToLast(100)
      );
      
      const snapshot = await get(historyRef);
      const data = [];
      
      snapshot.forEach(child => {
        const record = child.val();
        if (record && record.timestamp * 1000 >= startTime) {
          data.push(record);
        }
      });

      // Calculate analytics
      const moistureTrends = analyzeMoistureTrends(data);
      const wateringHistory = analyzeWateringHistory(data);
      const efficiency = calculateEfficiency(data);
      const predictions = generatePredictions(data);

      setAnalytics({
        moistureTrends,
        wateringHistory,
        efficiency,
        predictions
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeMoistureTrends = (data) => {
    if (data.length < 2) return [];

    const trends = [];
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const change = curr.moisture - prev.moisture;
      const timeWindow = (curr.timestamp - prev.timestamp) / 3600; // hours
      
      trends.push({
        timestamp: curr.timestamp,
        change,
        rate: timeWindow > 0 ? change / timeWindow : 0,
        moisture: curr.moisture
      });
    }

    return trends;
  };

  const analyzeWateringHistory = (data) => {
    const wateringEvents = [];
    let currentWatering = null;

    data.forEach(record => {
      if (record.valveStatus === 'ON' && !currentWatering) {
        currentWatering = {
          start: record.timestamp,
          startMoisture: record.moisture
        };
      } else if (record.valveStatus === 'OFF' && currentWatering) {
        wateringEvents.push({
          ...currentWatering,
          end: record.timestamp,
          endMoisture: record.moisture,
          duration: (record.timestamp - currentWatering.start) / 60, // minutes
          effectiveness: record.moisture - currentWatering.startMoisture
        });
        currentWatering = null;
      }
    });

    return wateringEvents;
  };

  const calculateEfficiency = (data) => {
    if (data.length === 0) return {};

    const totalWateringTime = analytics.wateringHistory.reduce(
      (sum, event) => sum + event.duration, 0
    );

    const avgMoisture = data.reduce((sum, record) => sum + record.moisture, 0) / data.length;
    
    const lowMoistureEvents = data.filter(record => record.moisture < 30).length;
    const totalReadings = data.length;

    return {
      avgMoisture: Math.round(avgMoisture * 10) / 10,
      totalWateringTime: Math.round(totalWateringTime),
      lowMoisturePercent: Math.round((lowMoistureEvents / totalReadings) * 100),
      wateringEfficiency: analytics.wateringHistory.length > 0 
        ? Math.round(analytics.wateringHistory.reduce((sum, event) => sum + event.effectiveness, 0) / analytics.wateringHistory.length)
        : 0
    };
  };

  const generatePredictions = (data) => {
    if (data.length < 10) return {};

    // Simple linear regression for moisture prediction
    const recentData = data.slice(-10);
    const moistureValues = recentData.map(d => d.moisture);
    const timeValues = recentData.map((d, i) => i);

    const n = moistureValues.length;
    const sumX = timeValues.reduce((a, b) => a + b, 0);
    const sumY = moistureValues.reduce((a, b) => a + b, 0);
    const sumXY = timeValues.reduce((sum, x, i) => sum + x * moistureValues[i], 0);
    const sumXX = timeValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict moisture in next 6 hours (assuming 30-minute intervals)
    const nextReadings = 12;
    const predictedMoisture = intercept + slope * (n + nextReadings);

    return {
      trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      predictedMoisture: Math.max(0, Math.min(100, Math.round(predictedMoisture))),
      confidence: Math.min(95, Math.max(60, 95 - Math.abs(slope) * 10))
    };
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography sx={{ color: 'white' }}>Loading analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon />
          Device Analytics
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '15px'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Key Performance Metrics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                      {analytics.efficiency.avgMoisture || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Average Moisture
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {analytics.efficiency.totalWateringTime || 0}m
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Total Watering
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      {analytics.efficiency.lowMoisturePercent || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Low Moisture Time
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                      {analytics.efficiency.wateringEfficiency || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Watering Efficiency
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Predictions */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '15px'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon />
                Predictions
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Moisture Trend:
                </Typography>
                <Chip
                  icon={analytics.predictions.trend === 'increasing' ? <TrendingUpIcon /> : 
                        analytics.predictions.trend === 'decreasing' ? <TrendingDownIcon /> : 
                        <TimelineIcon />}
                  label={analytics.predictions.trend || 'stable'}
                  color={analytics.predictions.trend === 'increasing' ? 'success' : 
                         analytics.predictions.trend === 'decreasing' ? 'error' : 'default'}
                  variant="outlined"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Predicted Moisture (6h): {analytics.predictions.predictedMoisture || 0}%
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Confidence: {analytics.predictions.confidence || 0}%
                </Typography>
              </Box>

              {analytics.predictions.predictedMoisture < 30 && (
                <Box sx={{ 
                  p: 2, 
                  background: 'rgba(255, 152, 0, 0.1)', 
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 152, 0, 0.3)'
                }}>
                  <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    ⚠️ Low moisture predicted - consider scheduling watering
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Watering Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '15px'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WaterIcon />
                Watering Summary
              </Typography>
              
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                Total Watering Events: {analytics.wateringHistory.length}
              </Typography>
              
              {analytics.wateringHistory.length > 0 && (
                <>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                    Average Duration: {Math.round(analytics.wateringHistory.reduce((sum, event) => sum + event.duration, 0) / analytics.wateringHistory.length)}m
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    Average Effectiveness: +{Math.round(analytics.wateringHistory.reduce((sum, event) => sum + event.effectiveness, 0) / analytics.wateringHistory.length)}%
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const csv = analytics.wateringHistory.map(event => 
                        `${new Date(event.start * 1000).toISOString()},${event.duration},${event.effectiveness}`
                      ).join('\n');
                      const blob = new Blob([`Timestamp,Duration(min),Effectiveness(%)\n${csv}`], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `watering_history_${selectedDevice.deviceId}.csv`;
                      a.click();
                    }}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                    }}
                  >
                    Export History
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
