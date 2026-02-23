# WebMaster

Игровой проект на React + TypeScript + Vite с Docker контейнеризацией.

## 🐳 Docker Запуск

### Быстрый старт с Docker Compose

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd WebMaster
```

2. **Создайте файл окружения:**
```bash
cp .env.example .env
# Отредактируйте .env с вашими настройками безопасности
```

3. **Запустите все сервисы:**
```bash
# Production режим
docker-compose up -d

# Development режим с hot reload
docker-compose -f docker-compose.dev.yml up -d
```

4. **Доступ к приложению:**
- **Frontend**: http://localhost:3000 (production) или http://localhost:5173 (development)
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Остановка сервисов
```bash
docker-compose down
```

### Полная очистка (включая данные)
```bash
docker-compose down -v
```

## 📋 Структура Docker конфигурации

### Сервисы
- **frontend**: React + Vite приложение (Nginx в production)
- **backend**: Node.js + Express + Prisma API сервер
- **postgres**: PostgreSQL база данных
- **redis**: Redis для кэширования и сессий

### Файлы конфигурации
- `docker-compose.yml` - Production окружение
- `docker-compose.dev.yml` - Development окружение с hot reload
- `Dockerfile` - Production сборка frontend
- `Dockerfile.dev` - Development сборка frontend
- `server/Dockerfile` - Production сборка backend
- `server/Dockerfile.dev` - Development сборка backend
- `.env.example` - Шаблон переменных окружения

## 🛠️ Локальная разработка

### Установка зависимостей

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### Запуск в режиме разработки

```bash
# Frontend (в корне)
npm run dev

# Backend (в папке server)
npm run dev
```

Проект будет доступен по адресу: **http://localhost:5173**

### Дополнительные команды

- **Сборка проекта:**
```bash
npm run build
```

- **Предпросмотр собранного проекта:**
```bash
npm run preview
```

## 🗄️ Работа с базой данных

### Миграции
```bash
cd server
npx prisma migrate dev
```

### Генерация клиента
```bash
cd server
npx prisma generate
```

### Заполнение данными
```bash
cd server
npm run prisma:seed
```

## 📊 Мониторинг и логи

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Health checks
```bash
# Проверка статуса всех сервисов
docker-compose ps

# Проверка health check конкретного сервиса
docker inspect webmaster-backend | grep -A 10 Health
```

## 🔧 Переменные окружения

Основные переменные в `.env`:

- `POSTGRES_PASSWORD` - Пароль PostgreSQL
- `JWT_SECRET` - Секретный ключ для JWT токенов
- `REDIS_PASSWORD` - Пароль Redis
- `NODE_ENV` - Режим работы (production/development)
- `CORS_ORIGIN` - Разрешенный origin для CORS

## 🚀 Production развертывание

### Требования
- Docker 20.10+
- Docker Compose 2.0+
- Минимум 2GB RAM
- Минимум 5GB дискового пространства

### Шаги развертывания
1. Настройте `.env` файл с надежными паролями
2. Запустите `docker-compose up -d`
3. Проверьте статус: `docker-compose ps`
4. Выполните миграции: `docker-compose exec backend npx prisma migrate deploy`
5. Заполните данные: `docker-compose exec backend npm run prisma:seed`

### Резервное копирование
```bash
# Backup базы данных
docker-compose exec postgres pg_dump -U webmaster webmaster > backup.sql

# Восстановление базы данных
docker-compose exec -T postgres psql -U webmaster webmaster < backup.sql
```

## 🐛 Отладка

### Вход в контейнеры
```bash
# Frontend контейнер
docker-compose exec frontend sh

# Backend контейнер
docker-compose exec backend sh

# PostgreSQL контейнер
docker-compose exec postgres psql -U webmaster -d webmaster
```

### Перезапуск сервисов
```bash
# Перезапустить все сервисы
docker-compose restart

# Перезапустить конкретный сервис
docker-compose restart backend
```

## 📈 Оптимизация

### Сборка образов
```bash
# Пересобрать все образы
docker-compose build --no-cache

# Пересобрать конкретный сервис
docker-compose build backend
```

### Очистка ресурсов
```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые тома
docker volume prune
```

## ⚡ Технические детали

- **Frontend порт:** 3000 (production), 5173 (development)
- **Backend порт:** 5000
- **Порт PostgreSQL:** 5432
- **Порт Redis:** 6379
- **Сборщик:** Vite
- **Фреймворк:** React 18
- **Язык:** TypeScript
- **Стили:** Tailwind CSS
- **База данных:** PostgreSQL (production), SQLite (development)
- **Оркестрация:** Docker Compose

## 📝 Требования

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (для локальной разработки)
- Git

