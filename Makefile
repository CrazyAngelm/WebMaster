# 📁 Makefile - Convenient commands for Docker management
# 🎯 Core function: Simplify Docker operations
# 🔗 Key dependencies: Docker, Docker Compose
# 💡 Usage: make <command>

.PHONY: help up down build clean logs shell db-backup db-restore

# Default target
help:
	@echo "WebMaster Docker Commands:"
	@echo ""
	@echo "  up          - Start all services in production mode"
	@echo "  up-dev      - Start all services in development mode"
	@echo "  down        - Stop all services"
	@echo "  build       - Build all Docker images"
	@echo "  clean       - Remove all containers, images, and volumes"
	@echo "  logs        - Show logs for all services"
	@echo "  shell       - Open shell in backend container"
	@echo "  db-backup   - Backup PostgreSQL database"
	@echo "  db-restore  - Restore PostgreSQL database"
	@echo "  migrate     - Run database migrations"
	@echo "  seed        - Seed database with initial data"
	@echo "  status      - Show status of all services"

# Production
up:
	@echo "Starting production services..."
	docker-compose up -d

# Development
up-dev:
	@echo "Starting development services..."
	docker-compose -f docker-compose.dev.yml up -d

# Stop services
down:
	@echo "Stopping all services..."
	docker-compose down

# Build images
build:
	@echo "Building all images..."
	docker-compose build --no-cache

# Clean everything
clean:
	@echo "Removing all containers, images, and volumes..."
	docker-compose down -v --rmi all

# Show logs
logs:
	docker-compose logs -f

# Shell access
shell:
	docker-compose exec backend sh

# Database backup
db-backup:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U webmaster webmaster > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed"

# Database restore
db-restore:
	@read -p "Enter backup file path: " backup_file; \
	docker-compose exec -T postgres psql -U webmaster webmaster < $$backup_file

# Run migrations
migrate:
	@echo "Running database migrations..."
	docker-compose exec backend npx prisma migrate deploy

# Seed database
seed:
	@echo "Seeding database..."
	docker-compose exec backend npm run prisma:seed

# Show status
status:
	@echo "Service status:"
	docker-compose ps

# Development Prisma commands
prisma-generate-dev:
	@echo "Generating Prisma client in development..."
	docker-compose -f docker-compose.dev.yml exec backend npx prisma generate

prisma-migrate-dev:
	@echo "Running Prisma migrations in development..."
	docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

prisma-seed-dev:
	@echo "Seeding database in development..."
	docker-compose -f docker-compose.dev.yml exec backend npm run prisma:seed

# Production Prisma commands
prisma-generate:
	@echo "Generating Prisma client in production..."
	docker-compose exec backend npx prisma generate

prisma-migrate:
	@echo "Running Prisma migrations in production..."
	docker-compose exec backend npx prisma migrate deploy

prisma-seed:
	@echo "Seeding database in production..."
	docker-compose exec backend npm run prisma:seed
