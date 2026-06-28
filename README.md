# Sion Academy

Sion Academy is an offline-first discipleship tracking application for Sion Ministry.

## Project Structure
- [/frontend](file:///d:/project_yosua/sion-academy/frontend): React (TypeScript) + Vite + Tailwind CSS v4.
- [/backend](file:///d:/project_yosua/sion-academy/backend): Go (Golang) + Fiber + GORM (PostgreSQL).

## Quickstart

### 1. Database Setup
Ensure PostgreSQL is running locally on port `5432` with username `postgres` and password `postgres`. The backend will automatically create the database `sion_ministry` and seed it on startup.

### 2. Run Backend
```bash
cd backend
go run main.go
```

### 3. Run Frontend
```bash
cd frontend
npm run dev
```