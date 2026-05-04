# Family Site Infrastructure Design

**Date:** 2026-05-03  
**Author:** System Architect

## Overview

This document describes the deployment infrastructure for the Family Site application, a Next.js-based web application with authentication and database capabilities.

## Architecture

The application is deployed using Docker Swarm for orchestration, providing:
- Horizontal scaling with multiple replicas
- Resource isolation and limits
- Health monitoring and automatic recovery
- Network isolation

## 1. Dockerfile Structure

The Dockerfile uses a multi-stage build approach:

### Stage 1: Dependencies
- Base image: Node.js 20 Alpine
- Installs system dependencies (libc6-compat for Prisma)
- Installs npm dependencies with `npm ci`

### Stage 2: Builder
- Copies dependencies from deps stage
- Generates Prisma client
- Builds Next.js application with `next build`

### Stage 3: Runner
- Minimal production image
- Creates non-root user for security
- Copies only necessary runtime files
- Configures standalone output mode

## 2. Docker Swarm Configuration

### Service Settings
- **Replicas:** 2 (for high availability)
- **CPU Limit:** 0.5 cores per replica
- **Memory Limit:** 512MB per replica
- **Health Check:** HTTP endpoint check every 30s

### Network Configuration
- Overlay network for inter-service communication
- Attachable for debugging and external access

## 3. Environment Variables

Required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth JWT signing | Yes |
| `NODE_ENV` | Runtime environment | No (default: production) |
| `PORT` | Application port | No (default: 3000) |

## 4. Deployment Commands

### Initialize Docker Swarm
```bash
docker swarm init
```

### Deploy the Stack
```bash
docker stack deploy -c docker-compose.swarm.yml family-site
```

### Check Deployment Status
```bash
docker stack services family-site
docker service ps family-site-family-site
```

### View Logs
```bash
docker service logs -f family-site-family-site
```

### Scale Service
```bash
docker service scale family-site-family-site=4
```

### Update Service
```bash
docker stack deploy -c docker-compose.swarm.yml family-site --prune
```

### Remove Stack
```bash
docker stack rm family-site
```

## 5. Local Testing

### Build Docker Image
```bash
docker build -t family-site:latest .
```

### Run Locally
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  family-site:latest
```

## 6. Security Considerations

1. **Non-root User:** Application runs as `nextjs` user (UID 1001)
2. **Minimal Image:** Only production dependencies included
3. **Resource Limits:** Prevents runaway memory/CPU usage
4. **Health Checks:** Automatic detection of unhealthy containers

## 7. Monitoring

### Health Endpoint
The application exposes `/api/health` for health checks.

### Metrics to Monitor
- Container CPU usage (limit: 0.5 cores)
- Container memory usage (limit: 512MB)
- Request latency
- Error rates
- Database connection pool usage

## 8. Troubleshooting

### Container Won't Start
1. Check environment variables are set correctly
2. Verify DATABASE_URL connectivity
3. Check logs: `docker service logs family-site-family-site --tail 100`

### Out of Memory
1. Increase memory limit in docker-compose.swarm.yml
2. Check for memory leaks in application
3. Consider reducing number of replicas

### Database Connection Issues
1. Verify DATABASE_URL format
2. Ensure database is accessible from swarm network
3. Check database connection pool settings
