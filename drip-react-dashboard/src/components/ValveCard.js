import React from 'react';

const ValveCard = ({ valveStatus, onOpenValve, onCloseValve }) => {
  return (
    <div className="sensor-card">
      <h3>Valve Status</h3>
      <div className="sensor-value">
        {valveStatus || '--'}
      </div>
      <div className="valve-controls">
        <button className="valve-button" onClick={onOpenValve}>
          Open Valve
        </button>
        <button className="valve-button" onClick={onCloseValve}>
          Close Valve
        </button>
      </div>
    </div>
  );
};

export default ValveCard;
