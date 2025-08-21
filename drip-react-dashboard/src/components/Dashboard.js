import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { ref, onValue, set, query, limitToLast, get, orderByChild } from 'firebase/database';
import { auth, database } from '../config/firebase';
import SensorCard from './SensorCard';
import ValveCard from './ValveCard';
import MoistureChart from './MoistureChart';

const Dashboard = ({ user }) => {
  const [sensorData, setSensorData] = useState({
    moisture: null,
    temperature: null,
    humidity: null,
    valveStatus: null
  });
  const [moistureHistory, setMoistureHistory] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Get user-specific path
    const userNodePath = `SensorData/${user.uid}/node1/`;

    // Listen to live sensor data
    const nodeRef = ref(database, userNodePath);
    const unsubscribe = onValue(nodeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          moisture: data.moisture,
          temperature: data.temperature,
          humidity: data.humidity,
          valveStatus: data.valveStatus
        });
      }
    });

    // Load moisture history function
    const loadHistory = async () => {
      try {
        const nodeRef = query(
          ref(database, userNodePath),
          orderByChild('timestamp'),
          limitToLast(20)
        );
        
        const snapshot = await get(nodeRef);
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
      unsubscribe();
      clearInterval(chartInterval);
    };
  }, [user]);

  const loadMoistureHistory = async () => {
    if (!user) return;
    
    try {
      const userNodePath = `SensorData/${user.uid}/node1/`;
      const nodeRef = query(
        ref(database, userNodePath),
        orderByChild('timestamp'),
        limitToLast(20)
      );
      
      const snapshot = await get(nodeRef);
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
    } catch (error) {
      console.error('Error loading moisture history:', error);
    }
  };

  const handleValveControl = async (status) => {
    if (!user) return;
    
    try {
      const userNodePath = `SensorData/${user.uid}/node1/`;
      await set(ref(database, userNodePath + 'valveStatus'), status);
    } catch (error) {
      console.error('Error controlling valve:', error);
      alert('Error controlling valve: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Smart Drip Irrigation Dashboard</h1>
        <div className="user-info">
          <span>Logged in as: {user?.email}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="cards-grid">
        <SensorCard 
          title="Moisture" 
          value={sensorData.moisture} 
          unit=""
        />
        <SensorCard 
          title="Temperature" 
          value={sensorData.temperature} 
          unit=" °C"
        />
        <SensorCard 
          title="Humidity" 
          value={sensorData.humidity} 
          unit=" %"
        />
        <ValveCard 
          valveStatus={sensorData.valveStatus}
          onOpenValve={() => handleValveControl('ON')}
          onCloseValve={() => handleValveControl('OFF')}
        />
      </div>

      {moistureHistory.length > 0 && (
        <MoistureChart moistureData={moistureHistory} />
      )}
    </div>
  );
};

export default Dashboard;
