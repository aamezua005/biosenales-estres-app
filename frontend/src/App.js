import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [heartRate, setHeartRate] = useState(0);
  const [stressLevel, setStressLevel] = useState(0);
  const [biosignals, setBiosignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Juan');
  const userId = '1';

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Función para obtener color según nivel de estrés
  const getStressColor = (level) => {
    switch(level) {
      case 0: return '#4CAF50'; // Verde - Normal
      case 1: return '#FFC107'; // Amarillo - Bajo
      case 2: return '#FF9800'; // Naranja - Medio
      case 3: return '#F44336'; // Rojo - Alto
      default: return '#9E9E9E'; // Gris - Desconocido
    }
  };

  // Función para obtener texto de estrés
  const getStressText = (level) => {
    switch(level) {
      case 0: return 'Normal 😊';
      case 1: return 'Estrés Bajo 😐';
      case 2: return 'Estrés Medio 😟';
      case 3: return 'Estrés Alto 😰';
      default: return 'Desconocido';
    }
  };

  // Obtener datos iniciales
  useEffect(() => {
    fetchBiosignals();
  }, []);

  // Actualizar cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      generateAndFetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Generar nueva medida y obtener datos
  const generateAndFetchData = async () => {
    try {
      // Generar ritmo cardíaco aleatorio
      const newHeartRate = Math.floor(Math.random() * 40) + 70; // 70-110 BPM

      // Enviar al backend
      const response = await fetch(`${API_URL}/biosignals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          heart_rate: newHeartRate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setHeartRate(data.heart_rate);
        setStressLevel(data.stress_level || 0);
        
        // Obtener últimas lecturas
        fetchBiosignals();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Obtener últimas bioseñales
  const fetchBiosignals = async () => {
    try {
      const response = await fetch(`${API_URL}/biosignals/${userId}`);
      const data = await response.json();
      setBiosignals(data.slice(-10).reverse()); // Últimas 10
      setLoading(false);

      // Actualizar valores si hay datos
      if (data.length > 0) {
        setHeartRate(data[data.length - 1].heart_rate);
        setStressLevel(data[data.length - 1].stress_level || 0);
      }
    } catch (error) {
      console.error('Error fetching biosignals:', error);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>❤️ Monitor de Estrés</h1>
        <p>Observa tu nivel de estrés en tiempo real</p>
      </header>

      <div className="container">
        {/* Círculo de estrés */}
        <div className="stress-circle-container">
          <div
            className="stress-circle"
            style={{
              backgroundColor: getStressColor(stressLevel),
              boxShadow: `0 0 40px ${getStressColor(stressLevel)}`
            }}
          >
            <div className="circle-content">
              <div className="heart-rate">{heartRate} BPM</div>
              <div className="stress-label">{getStressText(stressLevel)}</div>
            </div>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="user-info">
          <h2>Usuario: {userName}</h2>
          <p>ID: {userId}</p>
          <p>Estado: 
            <span className="status-badge" style={{ backgroundColor: getStressColor(stressLevel) }}>
              {getStressText(stressLevel)}
            </span>
          </p>
        </div>

        {/* Botón para generar datos manualmente */}
        <button className="btn-refresh" onClick={generateAndFetchData}>
          🔄 Obtener nueva medida
        </button>

        {/* Tabla de últimas lecturas */}
        <div className="biosignals-table">
          <h3>📋 Últimas 10 Lecturas:</h3>
          {loading ? (
            <p>Cargando...</p>
          ) : biosignals.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ritmo Cardíaco (BPM)</th>
                  <th>Nivel de Estrés</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {biosignals.map((signal, index) => (
                  <tr key={index}>
                    <td>{biosignals.length - index}</td>
                    <td>
                      <span className="heart-badge">{signal.heart_rate} BPM</span>
                    </td>
                    <td>
                      <span
                        className="stress-badge"
                        style={{ backgroundColor: getStressColor(signal.stress_level) }}
                      >
                        {getStressText(signal.stress_level)}
                      </span>
                    </td>
                    <td>{new Date(signal.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay datos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
