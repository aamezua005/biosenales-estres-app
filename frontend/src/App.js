import React, { useState, useEffect } from 'react';
import './App.css';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell
} from 'recharts';

function App() {
    const [heartRate, setHeartRate] = useState(0);
    const [stressLevel, setStressLevel] = useState(0);
    const [recommendation, setRecommendation] = useState('');
    const [biosignals, setBiosignals] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(1);
    const [autoSimulation, setAutoSimulation] = useState(false);
    const [activePage, setActivePage] = useState("home");

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    const getUserName = () => {
        return userId === 1 ? 'Juan' : 'María';
    };

    const getStressColor = (level) => {
        switch (level) {
            case 0: return '#4CAF50';
            case 1: return '#8BC34A';
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

    useEffect(() => {
        if (!autoSimulation) return;

        const modes = ["normal", "normal", "recovery", "stress", "stress", "stress", "recovery"];
        let step = 0;

        const interval = setInterval(() => {
            const mode = modes[Math.min(step, modes.length - 1)];
            generateAndFetchData(mode);
            step++;
        }, 2500);

        return () => clearInterval(interval);
    }, [autoSimulation, userId]);

    const generateAndFetchData = async (mode = "normal") => {
        try {

            const response = await fetch(`${API_URL}/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    mode: mode
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

        await generateAndFetchData("stress");
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
            <header className="main-header">
                <div>
                    <h1>❤️ StressGuard</h1>
                    <p>Plataforma de monitorización de estrés mediante bioseñales</p>
                </div>

                <nav className="nav-menu">
                    <button
                        className={activePage === "home" ? "nav-active" : ""}
                        onClick={() => setActivePage("home")}
                    >
                        Inicio
                    </button>

                    <button
                        className={activePage === "monitor" ? "nav-active" : ""}
                        onClick={() => setActivePage("monitor")}
                    >
                        Monitorización
                    </button>

                    <button
                        className={activePage === "history" ? "nav-active" : ""}
                        onClick={() => setActivePage("history")}
                    >
                        Historial
                    </button>
                </nav>
            </header>

            {activePage === "home" && (
                <main className="home-page">
                    <section className="hero-card">
                        <h2>Monitorización inteligente del estrés</h2>
                        <p>
                            StressGuard permite simular, analizar y visualizar bioseñales en tiempo real
                            para detectar posibles estados de estrés y recomendar intervenciones básicas.
                        </p>

                        <button className="btn-refresh" onClick={() => setActivePage("monitor")}>
                            Empezar monitorización
                        </button>
                    </section>

                    <section className="features-grid">
                        <div className="feature-card">
                            <h3>❤️ Frecuencia cardíaca</h3>
                            <p>Seguimiento del ritmo cardíaco como indicador principal de activación fisiológica.</p>
                        </div>

                        <div className="feature-card">
                            <h3>🌬️ Respiración</h3>
                            <p>Simulación de frecuencia respiratoria para interpretar mejor el estado del usuario.</p>
                        </div>

                        <div className="feature-card">
                            <h3>🌡️ Temperatura</h3>
                            <p>Registro de temperatura corporal simulada para enriquecer el análisis.</p>
                        </div>

                        <div className="feature-card">
                            <h3>🩸 Oxígeno</h3>
                            <p>Monitorización de saturación de oxígeno como señal complementaria.</p>
                        </div>
                    </section>
                </main>
            )}

            {activePage === "monitor" && (
                <main className="dashboard-page">
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

                    <section className="dashboard-grid">
                        <div className="panel-card current-panel">
                            <h2>Estado actual</h2>

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

                            <p className="recommendation">💡 {recommendation || summary?.message}</p>
                        </div>

                        <div className="panel-card summary-panel">
                            <h2>Resumen de sesión</h2>

                            {summary && (
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
                            )}

                            <div className="button-group">
                                <button className="btn-refresh" onClick={() => generateAndFetchData("normal")}>
                                    🔄 Nueva medida
                                </button>

                                <button
                                    className={autoSimulation ? "btn-stop" : "btn-danger"}
                                    onClick={() => setAutoSimulation(!autoSimulation)}
                                >
                                    {autoSimulation ? "⏸ Detener simulación" : "▶ Iniciar simulación"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="panel-card chart-panel">
                        <h2>📈 Evolución BPM</h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={[...biosignals].reverse()}>

                                <CartesianGrid stroke="rgba(0,0,0,0.08)" />

                                <XAxis hide />

                                <YAxis />

                                <Tooltip />

                                <Bar
                                    dataKey="heart_rate"
                                    radius={[12, 12, 0, 0]}
                                    barSize={26}
                                >
                                    {[...biosignals].reverse().map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getStressColor(entry.stress_level)}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        
                    </section>
                </main>
            )}

            {activePage === "history" && (
                <main className="history-page">
                    <section className="panel-card">
                        <h2>📋 Historial de lecturas</h2>
                        <p className="history-intro">
                            Consulta las últimas bioseñales registradas para el usuario {getUserName()}.
                        </p>

                        {loading ? (
                            <p>Cargando...</p>
                        ) : biosignals.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Ritmo Cardíaco</th>
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
                    </section>
                </main>
            )}
        </div>
    );
}

export default App;