import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [heartRate, setHeartRate] = useState(0);
    const [stressLevel, setStressLevel] = useState(0);
    const [recommendation, setRecommendation] = useState('');
    const [biosignals, setBiosignals] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(1);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const getUserName = () => {
        return userId === 1 ? 'Juan' : 'María';
    };

    const getStressColor = (level) => {
        switch (level) {
            case 0: return '#4CAF50';
            case 1: return '#FFC107';
            case 2: return '#FF9800';
            case 3: return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const getStressText = (level) => {
        switch (level) {
            case 0: return 'Normal 😊';
            case 1: return 'Estrés Bajo 😐';
            case 2: return 'Estrés Medio 😟';
            case 3: return 'Estrés Alto 😰';
            default: return 'Desconocido';
        }
    };

    useEffect(() => {
        fetchBiosignals();
        fetchSummary();
    }, [userId]);

    const generateAndFetchData = async () => {
        try {
            const newHeartRate = Math.floor(Math.random() * 40) + 70;

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
                setRecommendation(data.recommendation || '');

                fetchBiosignals();
                fetchSummary();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const simulateStress = async () => {
        const stressSequence = [75, 88, 102, 118];

        for (const bpm of stressSequence) {
            await fetch(`${API_URL}/biosignals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    heart_rate: bpm
                })
            });
        }

        fetchBiosignals();
        fetchSummary();

        setHeartRate(118);
        setStressLevel(3);
        setRecommendation('Estrés alto. Se recomienda detener la actividad y descansar.');
    };

    const fetchBiosignals = async () => {
        try {
            const response = await fetch(`${API_URL}/biosignals/${userId}`);
            const data = await response.json();

            const ordered = data.slice(0, 10);
            setBiosignals(ordered);
            setLoading(false);

            if (ordered.length > 0) {
                setHeartRate(ordered[0].heart_rate);
                setStressLevel(ordered[0].stress_level || 0);
            }
        } catch (error) {
            console.error('Error fetching biosignals:', error);
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await fetch(`${API_URL}/summary/${userId}`);
            const data = await response.json();
            setSummary(data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    return (
        <div className="App">
            <header className="header">
                <h1>❤️ Monitor de Estrés</h1>
                <p>Monitorización de bioseñales en tiempo real</p>
            </header>

            <div className="container">
                {stressLevel === 3 && (
                    <div className="alert-box">
                        ⚠️ Estrés alto detectado. Se recomienda parar y descansar.
                    </div>
                )}

                <div className="user-selector">
                    <label>Usuario: </label>
                    <select value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
                        <option value={1}>Juan</option>
                        <option value={2}>María</option>
                    </select>
                </div>

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

                <div className="user-info">
                    <h2>Usuario: {getUserName()}</h2>
                    <p>ID: {userId}</p>
                    <p>
                        Estado:
                        <span className="status-badge" style={{ backgroundColor: getStressColor(stressLevel) }}>
                            {getStressText(stressLevel)}
                        </span>
                    </p>
                    <p className="recommendation">💡 {recommendation || summary?.message}</p>
                </div>

                {summary && (
                    <div className="summary-box">
                        <h3>📊 Resumen de sesión</h3>
                        <div className="summary-grid">
                            <div>
                                <strong>{summary.total_readings}</strong>
                                <span>Lecturas</span>
                            </div>
                            <div>
                                <strong>{summary.average_heart_rate}</strong>
                                <span>BPM medio</span>
                            </div>
                            <div>
                                <strong>{summary.stress_events}</strong>
                                <span>Eventos de estrés</span>
                            </div>
                            <div>
                                <strong>{getStressText(summary.max_stress_level)}</strong>
                                <span>Máximo estrés</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="button-group">
                    <button className="btn-refresh" onClick={generateAndFetchData}>
                        🔄 Obtener nueva medida
                    </button>

                    <button className="btn-danger" onClick={simulateStress}>
                        ⚠️ Simular estrés
                    </button>
                </div>

                <div className="chart-box">
                    <h3>📈 Evolución BPM</h3>
                    <div className="chart">
                        {[...biosignals].reverse().map((signal, index) => (
                            <div key={index} className="bar-container">
                                <div
                                    className="bar"
                                    style={{
                                        height: `${signal.heart_rate}px`,
                                        backgroundColor: getStressColor(signal.stress_level)
                                    }}
                                ></div>
                                <span>{Math.round(signal.heart_rate)}</span>
                            </div>
                        ))}
                    </div>
                </div>

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
                                    <tr key={signal.id || index}>
                                        <td>{signal.id}</td>
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