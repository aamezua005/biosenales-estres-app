from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time
import logging
import socket

app = Flask(__name__)
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

# Configuración PostgreSQL
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://admin:admin123@db:5432/biosenales_db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Modelos de BD
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    heart_rate_baseline = db.Column(db.Float, nullable=False)

class Biosignal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    heart_rate = db.Column(db.Float, nullable=False)
    stress_level = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

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
request_count = Counter("api_requests_total", "Total de requests", ["method", "endpoint"])
request_duration = Histogram("api_request_duration_seconds", "Duración de requests")
stress_events = Counter("stress_events_total", "Total de eventos de estrés", ["level"])

# Crear tablas y usuarios iniciales
with app.app_context():
    db.create_all()

    if User.query.count() == 0:
        db.session.add(User(name="Juan", heart_rate_baseline=70))
        db.session.add(User(name="María", heart_rate_baseline=65))
        db.session.commit()

@app.before_request
def start_timer():
    request.start_time = time.time()

@app.after_request
def log_metrics(response):
    duration = time.time() - request.start_time
    request_count.labels(method=request.method, endpoint=request.path).inc()
    request_duration.observe(duration)
    return response

def calculate_stress_level(heart_rate, baseline):
    if heart_rate > baseline * 1.6:
        return 3
    elif heart_rate > baseline * 1.4:
        return 2
    elif heart_rate > baseline * 1.2:
        return 1
    else:
        return 0

def get_recommendation(stress_level):
    if stress_level == 0:
        return "Estado normal. Mantén una respiración tranquila."
    elif stress_level == 1:
        return "Estrés leve. Respira profundamente durante unos segundos."
    elif stress_level == 2:
        return "Estrés moderado. Haz una pausa breve y relaja el cuerpo."
    else:
        return "Estrés alto. Se recomienda detener la actividad y descansar."

# ENDPOINT 1: Health check
@app.route("/health", methods=["GET"])
def health():
    logger.info("Health check llamado")
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

# ENDPOINT 2: Obtener usuario
@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    logger.info(f"Obteniendo usuario {user_id}")

    user = User.query.get(user_id)

    if not user:
        logger.warning(f"Usuario {user_id} no encontrado")
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "heart_rate_baseline": user.heart_rate_baseline
    })

# ENDPOINT 3: Registrar bioseñal
@app.route("/biosignals", methods=["POST"])
def post_biosignal():
    data = request.json or {}

    user_id = data.get("user_id")
    heart_rate = data.get("heart_rate")

    logger.info(f"Registrando bioseñal para usuario {user_id}")

    if user_id is None or heart_rate is None:
        return jsonify({"error": "Faltan user_id o heart_rate"}), 400

    try:
        user_id = int(user_id)
        heart_rate = float(heart_rate)
    except ValueError:
        return jsonify({"error": "user_id y heart_rate deben ser numéricos"}), 400

    if heart_rate < 30 or heart_rate > 220:
        return jsonify({"error": "heart_rate fuera de rango"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    stress_level = calculate_stress_level(heart_rate, user.heart_rate_baseline)

    biosignal = Biosignal(
        user_id=user.id,
        heart_rate=heart_rate,
        stress_level=stress_level
    )

    db.session.add(biosignal)
    db.session.commit()

    stress_events.labels(level=str(stress_level)).inc()
    logger.info(f"Estrés detectado: nivel {stress_level}")

    return jsonify({
        "id": biosignal.id,
        "user_id": biosignal.user_id,
        "heart_rate": biosignal.heart_rate,
        "stress_level": biosignal.stress_level,
        "recommendation": get_recommendation(stress_level),
        "timestamp": biosignal.timestamp.isoformat()
    }), 201

# ENDPOINT 4: Obtener bioseñales del usuario
@app.route("/biosignals/<int:user_id>", methods=["GET"])
def get_biosignals(user_id):
    logger.info(f"Obteniendo bioseñales para usuario {user_id}")

    signals = (
        Biosignal.query
        .filter_by(user_id=user_id)
        .order_by(Biosignal.timestamp.desc())
        .all()
    )

    return jsonify([
        {
            "id": s.id,
            "user_id": s.user_id,
            "heart_rate": s.heart_rate,
            "stress_level": s.stress_level,
            "timestamp": s.timestamp.isoformat()
        }
        for s in signals
    ])


@app.route("/summary/<int:user_id>", methods=["GET"])
def get_summary(user_id):

    signals = Biosignal.query.filter_by(user_id=user_id).all()

    if not signals:
        return jsonify({
            "total_readings": 0,
            "average_heart_rate": 0,
            "stress_events": 0,
            "max_stress_level": 0,
            "message": "No hay datos registrados todavía."
        })

    total_readings = len(signals)

    average_heart_rate = (
        sum(s.heart_rate for s in signals) / total_readings
    )

    stress_events_count = len([
        s for s in signals if s.stress_level > 0
    ])

    max_stress_level = max(
        s.stress_level for s in signals
    )

    return jsonify({
        "total_readings": total_readings,
        "average_heart_rate": round(average_heart_rate, 2),
        "stress_events": stress_events_count,
        "max_stress_level": max_stress_level,
        "message": get_recommendation(max_stress_level)
    })

# ENDPOINT 5: Métricas para Prometheus
@app.route("/metrics", methods=["GET"])
def metrics():
    logger.info("Endpoint /metrics solicitado")
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}

# ENDPOINT 6: Listar todos los usuarios
@app.route("/users", methods=["GET"])
def list_users():
    logger.info("Listando usuarios")

    users = User.query.all()

    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "heart_rate_baseline": u.heart_rate_baseline
        }
        for u in users
    ])

if __name__ == "__main__":
    logger.info("🚀 Backend iniciando en puerto 5000")
    app.run(host="0.0.0.0", port=5000, debug=True)