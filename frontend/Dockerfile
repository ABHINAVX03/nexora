# Multi-stage Dockerfile for Nexora Frontend SPA
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build production bundle with Vite
RUN npm run build

# Production NGINX server stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default nginx files
RUN rm -rf ./*

# Copy compiled assets from builder
COPY --from=builder /app/dist .

# Copy custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
