import React, { useRef, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Box, 
  Typography, 
  Button, 
  ButtonGroup, 
  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import { 
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartContainer = styled(Box)({
  position: 'relative',
  height: '400px',
  padding: '20px',
});

const ChartHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  flexWrap: 'wrap',
  gap: '10px'
});

const MoistureChart = ({ moistureData, deviceId, onRefresh }) => {
  const chartRef = useRef();
  const [timeRange, setTimeRange] = useState('24h');
  const [anchorEl, setAnchorEl] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (!moistureData || moistureData.length === 0) {
      setFilteredData([]);
      return;
    }

    const now = Date.now();
    let cutoffTime;

    switch (timeRange) {
      case '1h':
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = now - (6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = 0;
    }

    const filtered = moistureData.filter(d => {
      const timestamp = d.timestamp * 1000; // Convert to milliseconds
      return timestamp >= cutoffTime;
    });

    setFilteredData(filtered);
  }, [moistureData, timeRange]);

  const exportData = () => {
    if (!filteredData || filteredData.length === 0) return;

    const csvContent = [
      ['Timestamp', 'Moisture Level', 'Temperature', 'Humidity'],
      ...filteredData.map(d => [
        new Date(d.timestamp * 1000).toISOString(),
        d.moisture || 0,
        d.temperature || 0,
        d.humidity || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moisture_data_${deviceId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setAnchorEl(null);
  };

  if (!moistureData || moistureData.length === 0) {
    return (
      <ChartContainer>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            No sensor data available
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, maxWidth: '300px' }}>
            Data will appear here once your ESP32 device starts sending sensor readings to Firebase.
          </Typography>
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              Refresh Data
            </Button>
          )}
        </Box>
      </ChartContainer>
    );
  }

  const getMoistureColor = (value) => {
    if (value < 30) return 'rgba(244, 67, 54, 0.8)'; // Red for low moisture
    if (value < 50) return 'rgba(255, 152, 0, 0.8)'; // Orange for medium-low
    if (value < 70) return 'rgba(255, 235, 59, 0.8)'; // Yellow for medium
    return 'rgba(76, 175, 80, 0.8)'; // Green for good moisture
  };

  const getTimeLabel = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (timeRange === '1h' || timeRange === '6h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '24h') {
      if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 14,
            weight: 'bold',
          },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          title: function(context) {
            const timestamp = filteredData[context[0].dataIndex].timestamp;
            return new Date(timestamp * 1000).toLocaleString();
          },
          label: function(context) {
            const dataPoint = filteredData[context.dataIndex];
            const labels = [
              `Moisture: ${context.parsed.y}%`,
            ];
            
            if (dataPoint.temperature !== undefined) {
              labels.push(`Temperature: ${dataPoint.temperature}°C`);
            }
            if (dataPoint.humidity !== undefined) {
              labels.push(`Humidity: ${dataPoint.humidity}%`);
            }
            
            return labels;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'category',
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          },
          maxTicksLimit: timeRange === '1h' ? 12 : timeRange === '6h' ? 8 : 6,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          },
          callback: function(value) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        hitRadius: 10,
      },
      line: {
        tension: 0.4,
      }
    }
  };

  // Create gradient for fill
  const createGradient = (ctx, chartArea) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.05)');
    gradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.15)');
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0.3)');
    return gradient;
  };

  const data = {
    labels: filteredData.map(d => getTimeLabel(d.timestamp)),
    datasets: [
      {
        label: 'Moisture Level',
        data: filteredData.map(d => d.moisture),
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return createGradient(ctx, chartArea);
        },
        borderColor: 'rgba(33, 150, 243, 0.9)',
        borderWidth: 3,
        pointBackgroundColor: filteredData.map(d => getMoistureColor(d.moisture)),
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4,
        segment: {
          borderColor: function(ctx) {
            const current = filteredData[ctx.p0DataIndex];
            const next = filteredData[ctx.p1DataIndex];
            if (current && next) {
              if (current.moisture < 30 || next.moisture < 30) {
                return 'rgba(244, 67, 54, 0.8)';
              }
            }
            return 'rgba(33, 150, 243, 0.9)';
          }
        }
      },
    ],
  };

  return (
    <Box>
      <ChartHeader>
        <Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Sensor Data History
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {filteredData.length} data points • Last updated: {filteredData.length > 0 ? new Date(filteredData[filteredData.length - 1].timestamp * 1000).toLocaleTimeString() : 'Never'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <ButtonGroup variant="outlined" size="small">
            {['1h', '6h', '24h', '7d'].map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? 'contained' : 'outlined'}
                sx={{
                  color: timeRange === range ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: timeRange === range ? 'rgba(102, 126, 234, 0.8)' : 'transparent',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: timeRange === range ? 'rgba(102, 126, 234, 0.9)' : 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {range}
              </Button>
            ))}
          </ButtonGroup>

          {onRefresh && (
            <IconButton
              onClick={onRefresh}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          )}

          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            <MoreIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px'
              }
            }}
          >
            <MenuItem onClick={exportData} sx={{ color: 'white' }}>
              <DownloadIcon sx={{ mr: 1 }} />
              Export Data
            </MenuItem>
          </Menu>
        </Box>
      </ChartHeader>

      <ChartContainer>
        <Line ref={chartRef} options={options} data={data} />
      </ChartContainer>

      {/* Data Summary */}
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 2
      }}>
        {filteredData.length > 0 && (
          <>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Current
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {filteredData[filteredData.length - 1]?.moisture}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Average
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {Math.round(filteredData.reduce((sum, d) => sum + d.moisture, 0) / filteredData.length)}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Minimum
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {Math.min(...filteredData.map(d => d.moisture))}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Maximum
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {Math.max(...filteredData.map(d => d.moisture))}%
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default MoistureChart;
