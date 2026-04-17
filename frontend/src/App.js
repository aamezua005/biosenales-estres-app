import React, { useState, useEffect } from 'react';
import './App.css';

//arene 
function App() {
  const [heartRate, setHeartRate] = useState(null);
  const [stressLevel, setStressLevel] = useState(null);
  const [userId] = useState('1');
  const [biosignals, setBiosignals] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const hr = Math.floor(Math.random() * 40) + 65;
      setHeartRate(hr);

      try {
        const response = await fetch('http://backend:5000/biosignals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, heart_rate: hr })
        });
        const data = await response.json();
        setStressLevel(data.stress_level || 0);
        setBiosignals(prev => [...prev, data].slice(-10));
      } catch (error) {
        console.error('Error:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const getStressColor = (level) => {
    switch(level) {
      case 0: return '#4CAF50';
      case 1: return '#FFC107';
      case 2: return '#FF9800';
      case 3: return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStressText = (level) => {
    switch(level) {
      case 0: return 'Normal';
      case 1: return 'Bajo';
      case 2: return 'Medio';
      case 3: return 'Alto';
      default: return 'Desconocido';
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'Arial' }}>
      <h1>❤️ Monitor de Estrés</h1>
      
      <div style={{ fontSize: '48px', margin: '20px', fontWeight: 'bold' }}>
        {heartRate ? `${heartRate} BPM` : 'Conectando...'}
      </div>

      <div style={{
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        backgroundColor: getStressColor(stressLevel),
        margin: '20px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s'
      }}>
        {stressLevel !== null ? (
          <div>
            <div style={{ fontSize: '18px' }}>Nivel de Estrés</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {getStressText(stressLevel)} ({stressLevel}/3)
            </div>
          </div>
        ) : 'Esperando datos...'}
      </div>

      <h3>Últimas 10 Lecturas:</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '10px',
        marginTop: '20px',
        maxWidth: '500px',
        margin: '20px auto'
      }}>
        {biosignals.map((signal, idx) => (
          <div key={idx} style={{
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <strong>FC:</strong> {signal.heart_rate} BPM<br/>
            <strong>Estrés:</strong> {getStressText(signal.stress_level)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
