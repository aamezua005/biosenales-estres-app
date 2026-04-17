# 📋 Especificación - App de Detección de Estrés

## ¿Qué hace?
Monitorea el ritmo cardíaco de usuarios y detecta si están estresados.

## 👥 Usuarios

| ID | Nombre | Ritmo Base |
|----|--------|-----------|
| 1  | Juan   | 70 BPM    |
| 2  | María  | 65 BPM    |

## 📊 Niveles de Estrés

| Nivel | Nombre  | Condición | Color |
|-------|---------|-----------|-------|
| 0 | Normal | FC ≤ Base * 1.2 | Verde |
| 1 | Bajo | Base * 1.2 < FC ≤ Base * 1.4 | Amarillo |
| 2 | Medio | Base * 1.4 < FC ≤ Base * 1.6 | Naranja |
| 3 | Alto | FC > Base * 1.6 | Rojo |

## 🔌 API Endpoints

GET /health - Verifica que funciona
GET /users - Lista usuarios
POST /biosignals - Registra medida
GET /biosignals/{id} - Obtiene medidas
GET /metrics - Métricas Prometheus
