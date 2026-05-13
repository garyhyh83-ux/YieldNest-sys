@echo off
echo ============================================
echo   YieldNest Development Environment
echo ============================================
echo.

echo [1/3] Starting Docker services...
docker compose -f docker/compose.yaml up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker compose failed
    exit /b %ERRORLEVEL%
)

echo [2/3] Waiting for PostgreSQL to be ready...
:wait_pg
docker compose -f docker/compose.yaml exec -T postgres pg_isready -U yieldnest >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 >nul
    goto wait_pg
)
echo PostgreSQL is ready.

echo [3/3] Running database migrations...
cd services/account
go run cmd/migrate/main.go up
cd ..\..

echo.
echo ============================================
echo   All services ready! Starting dev servers...
echo   Auth Service:    http://localhost:3100
echo   Account Service: http://localhost:3200
echo   Web App:         http://localhost:3000
echo ============================================
echo.

pnpm dev
