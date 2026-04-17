# 🏗️ Arquitectura - App de Detección de Estrés

## Componentes

Frontend (React 3000) <-> Backend (Flask 5000) <-> BD (PostgreSQL 5432)

## Stack

- Frontend: React
- Backend: Flask (Python)
- BD: PostgreSQL
- Contenedor: Docker

## Flujo

1. Usuario abre http://localhost:3000
2. Ve un círculo que cambia de color según estrés
3. Frontend envía medida de FC al Backend
4. Backend calcula nivel de estrés
5. Frontend muestra resultado

## Carpetas

biosenales-estres-app/
├── backend/
├── frontend/
├── observability/
├── docker-compose.yml
├── ESPECIFICACION.md
└── ARQUITECTURA.md
