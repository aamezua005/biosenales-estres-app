import requests
import time
import random

# URL del backend
BACKEND_URL = "http://localhost:5001"

# Usuarios
users = ["1", "2"]

# Baseline de ritmo cardíaco
baselines = {
    "1": 70,  # Juan
    "2": 65   # María
}

print("🚀 Generando datos de estrés...")

for i in range(50):
    user_id = random.choice(users)
    baseline = baselines[user_id]
    
    # Generar ritmo cardíaco aleatorio
    # 50% normal, 30% bajo, 15% medio, 5% alto
    rand = random.random()
    
    if rand < 0.5:
        # Normal
        heart_rate = baseline + random.randint(-5, 5)
    elif rand < 0.8:
        # Bajo estrés
        heart_rate = int(baseline * 1.3) + random.randint(-5, 5)
    elif rand < 0.95:
        # Medio estrés
        heart_rate = int(baseline * 1.5) + random.randint(-5, 5)
    else:
        # Alto estrés
        heart_rate = int(baseline * 1.7) + random.randint(-5, 5)
    
    # Enviar al backend
    data = {
        "user_id": user_id,
        "heart_rate": heart_rate
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/biosignals", json=data)
        if response.status_code == 201:
            stress_level = response.json().get("stress_level", "?")
            print(f"✅ Usuario {user_id}: {heart_rate} BPM → Estrés nivel {stress_level}")
        else:
            print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    time.sleep(0.5)

print("✅ Datos generados correctamente")
