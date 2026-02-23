# 📁 Dockerfile - Frontend container
# 🎯 Core function: Single-stage build for React + Vite frontend
# 🔗 Key dependencies: Node.js, serve package
# 💡 Usage: Production-ready frontend with Node.js serve

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - use Node.js instead of Nginx
FROM node:18-alpine

WORKDIR /app

# Install serve package globally
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port 3000
EXPOSE 3000

# Start the application with serve
CMD ["serve", "-s", "dist", "-l", "3000"]
