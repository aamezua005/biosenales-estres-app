from flask import Flask, jsonify, request
from datetime import datetime
import os
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time
import logging
import socket

app = Flask(__name__)

# Configurar logging
class LogstashHandler(logging.Handler):
    def emit(self, record):
        log_entry = self.format(record)
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect(("logstash", 5000))
            sock.sendall((log_entry + "\n").encode("utf-8"))
            sock.close()
        except Exception:
            pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logstash_handler = LogstashHandler()
logstash_handler.setLevel(logging.INFO)
logstash_formatter = logging.Formatter('{"message": "%(message)s", "level": "%(levelname)s"}')
logstash_handler.setFormatter(logstash_formatter)

logger.addHandler(logstash_handler)

# Métricas Prometheus
request_count = Counter('api_requests_total', 'Total de requests', ['method', 'endpoint'])
request_duration = Histogram('api_request_duration_seconds', 'Duración de requests')
stress_events = Counter('stress_events_total', 'Total de eventos de estrés', ['level'])

# Simular BD en memoria
users_db = {
    "1": {"id": "1", "name": "Juan", "heart_rate_baseline": 70},
    "2": {"id": "2", "name": "María", "heart_rate_baseline": 65}
}

biosignals_db = []

@app.before_request
def start_timer():
    request.start_time = time.time()

@app.after_request
def log_metrics(response):
    duration = time.time() - request.start_time
    request_count.labels(method=request.method, endpoint=request.path).inc()
    request_duration.observe(duration)
    return response

# ✅ ENDPOINT 1: Health check
@app.route('/health', methods=['GET'])
def health():
    logger.info("Health check llamado")
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

# ✅ ENDPOINT 2: Obtener usuario
@app.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    logger.info(f"Obteniendo usuario {user_id}")
    user = users_db.get(user_id)
    if not user:
        logger.warning(f"Usuario {user_id} no encontrado")
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user)

# ✅ ENDPOINT 3: Registrar bioseñal (frecuencia cardíaca)
@app.route('/biosignals', methods=['POST'])
def post_biosignal():
    data = request.json
    logger.info(f"Registrando bioseñal para usuario {data.get('user_id')}")
    
    biosignal = {
        "id": len(biosignals_db) + 1,
        "user_id": data.get("user_id"),
        "heart_rate": data.get("heart_rate"),
        "timestamp": datetime.now().isoformat()
    }
    
    # Detectar estrés
    user = users_db.get(data.get("user_id"))
    if user:
        baseline = user["heart_rate_baseline"]
        hr = data.get("heart_rate")
        
        if hr > baseline * 1.6:
            stress_level = 3
        elif hr > baseline * 1.4:
            stress_level = 2
        elif hr > baseline * 1.2:
            stress_level = 1
        else:
            stress_level = 0
        
        biosignal["stress_level"] = stress_level
        stress_events.labels(level=stress_level).inc()
        logger.info(f"Estrés detectado: nivel {stress_level}")
    
    biosignals_db.append(biosignal)
    return jsonify(biosignal), 201

# ✅ ENDPOINT 4: Obtener bioseñales del usuario
@app.route('/biosignals/<user_id>', methods=['GET'])
def get_biosignals(user_id):
    logger.info(f"Obteniendo bioseñales para usuario {user_id}")
    signals = [b for b in biosignals_db if str(b["user_id"]) == user_id]
    return jsonify(signals)

# ✅ ENDPOINT 5: Métricas para Prometheus (FORMATO CORRECTO)
@app.route('/metrics', methods=['GET'])
def metrics():
    logger.info("Endpoint /metrics solicitado")
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

# ✅ ENDPOINT 6: Listar todos los usuarios
@app.route('/users', methods=['GET'])
def list_users():
    logger.info("Listando usuarios")
    return jsonify(list(users_db.values()))

if __name__ == '__main__':
    logger.info("🚀 Backend iniciando en puerto 5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
