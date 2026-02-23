# 📁 migrate.ps1 - PowerShell script for database migrations
# 🎯 Core function: Run Prisma migrations in Docker environment
# 🔗 Key dependencies: Docker, Docker Compose
# 💡 Usage: .\migrate.ps1

Write-Host "🔄 Starting database migration..." -ForegroundColor Green

# Stop all services
Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
docker compose down

# Start only database
Write-Host "🗄️ Starting PostgreSQL..." -ForegroundColor Yellow
docker compose up -d postgres

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migrations
Write-Host "🚀 Running Prisma migrations..." -ForegroundColor Yellow
docker run --rm `
    --network webmaster_webmaster-network `
    -e DATABASE_URL="postgresql://webmaster:webmaster123@postgres:5432/webmaster" `
    -v "${PWD}/server:/app" `
    -w /app `
    node:18-alpine npx prisma migrate deploy

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Yellow
docker run --rm `
    --network webmaster_webmaster-network `
    -e DATABASE_URL="postgresql://webmaster:webmaster123@postgres:5432/webmaster" `
    -v "${PWD}/server:/app" `
    -w /app `
    node:18-alpine npx prisma generate

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
docker run --rm `
    --network webmaster_webmaster-network `
    -e DATABASE_URL="postgresql://webmaster:webmaster123@postgres:5432/webmaster" `
    -e JWT_SECRET="temp-jwt-secret-for-seeding" `
    -v "${PWD}/server:/app" `
    -w /app `
    node:18-alpine npm run prisma:seed

# Start all services
Write-Host "🚀 Starting all services..." -ForegroundColor Yellow
docker compose up -d

Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
