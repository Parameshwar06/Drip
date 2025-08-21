import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MoistureChart = ({ moistureData }) => {
  const chartRef = useRef();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#f1f1f1'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#f1f1f1'
        },
        grid: {
          color: 'rgba(241, 241, 241, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#f1f1f1'
        },
        grid: {
          color: 'rgba(241, 241, 241, 0.1)'
        }
      }
    }
  };

  const data = {
    labels: moistureData.map(d => {
      const date = new Date(d.timestamp * 1000);
      return date.toLocaleTimeString();
    }),
    datasets: [
      {
        label: 'Moisture Level',
        data: moistureData.map(d => d.moisture),
        borderColor: '#3a86ff',
        backgroundColor: 'rgba(58, 134, 255, 0.1)',
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  return (
    <div className="chart-section">
      <h2 className="chart-title">Moisture History</h2>
      <Line ref={chartRef} options={options} data={data} />
    </div>
  );
};

export default MoistureChart;
