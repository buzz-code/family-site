# Family Site Docker Deployment

## Prerequisites
- Docker 20.10+ with Swarm mode enabled
- Node.js 14+ (for local development)

## Environment Variables

Create a `.env` file or set these in your Docker Swarm secrets:

| Variable        | Description                  | Example                                      |
|-----------------|------------------------------|----------------------------------------------|
| `DATABASE_URL`  | SQLite database path         | `file:./prisma/dev.db`                        |
| `NEXTAUTH_URL`  | Public URL of the app        | `http://62.238.4.145:3000`                   |
| `NEXTAUTH_SECRET`| NextAuth.js secret           | Generate with `openssl rand -base64 32`      |

## Local Testing

### Build and run with Docker
```bash
cd /home/admin/coding/family-site
docker build -t family-site:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  family-site:latest
```

### Test the build locally (no Docker)
```bash
npm install
npx prisma generate
npm run build
node .next/standalone/server.js
```

## Docker Swarm Deployment

### 1. Initialize Swarm (if not already)
```bash
docker swarm init
```

### 2. Create the overlay network
```bash
docker network create --driver overlay family-network
```

### 3. Set environment variables
```bash
export DATABASE_URL="file:./prisma/dev.db"
export NEXTAUTH_URL="http://62.238.4.145:3000"
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### 4. Deploy the stack
```bash
docker stack deploy -c docker-compose.swarm.yml family-site
```

### 5. Verify deployment
```bash
docker stack services family-site
docker stack ps family-site
```

## Troubleshooting

### Build fails with SIGBUS / out of memory
The Next.js build requires ~1GB RAM. Solutions:
1. Add swap space:
   ```bash
   sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
   ```
2. Build on a machine with more memory, then:
   ```bash
   docker save family-site:latest | ssh user@server 'docker load'
   ```

### Service unhealthy
Check logs:
```bash
docker service logs family-site_family-site
```

### Port 3000 already in use
Change the port mapping in `docker-compose.swarm.yml`:
```yaml
ports:
  - "8090:3000"
```
The container still listens on 3000 internally.

## File changes in this deliverable
- `Dockerfile` — Multi-stage build
- `docker-compose.swarm.yml` — Swarm stack configuration
- `next.config.mjs` — Standalone output mode
- `src/app/api/health/route.ts` — Health check endpoint
