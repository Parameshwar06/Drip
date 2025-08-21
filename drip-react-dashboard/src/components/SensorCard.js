import React from 'react';

const SensorCard = ({ title, value, unit = '' }) => {
  return (
    <div className="sensor-card">
      <h3>{title}</h3>
      <div className="sensor-value">
        {value !== undefined && value !== null ? `${value}${unit}` : '--'}
      </div>
    </div>
  );
};

export default SensorCard;
