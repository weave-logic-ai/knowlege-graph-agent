# Infrastructure Directory

**Purpose**: Infrastructure as Code, Docker configurations, and deployment manifests

**Current Status**: 🔥 Active (Docker for MVP), ⏳ K8s placeholder for future

---

## Directory Structure

```
infrastructure/
├── docker/                     # 🔥 MVP: Docker configurations
│   ├── weaver/
│   │   ├── Dockerfile          # Production Weaver image
│   │   └── Dockerfile.dev      # Development Weaver image
│   └── README.md
│
├── local_development_environment/  # ✅ Existing local dev setup
│   ├── .devcontainer/
│   ├── docker-compose.yml
│   └── README.md
│
├── kubernetes/                 # 📦 FUTURE: Kubernetes manifests
│   └── README.md
│
└── README.md (this file)
```

---

## Current State (MVP)

### Docker (Active)
- **Location**: `/infrastructure/docker/`
- **Status**: ✅ Ready for MVP implementation
- **Purpose**: Docker images for Weaver service

**Files to Create**:
- `docker/weaver/Dockerfile` - Production multi-stage build
- `docker/weaver/Dockerfile.dev` - Development with hot reload
- Root `docker-compose.yml` - Orchestration for MVP

### Local Development Environment (Existing)
- **Location**: `/infrastructure/local_development_environment/`
- **Status**: ✅ Already exists (from vault)
- **Purpose**: Devcontainer setup for VSCode Remote Containers

**Current Contents**:
- `.devcontainer/` - VSCode devcontainer configuration
- `docker-compose.yml` - Development environment

### Kubernetes (Future)
- **Location**: `/infrastructure/kubernetes/`
- **Status**: ⏳ Placeholder for future
- **Purpose**: Production Kubernetes manifests

**When to implement**: v2.0+ (cloud deployment, multi-user)

---

## Docker Strategy (MVP)

### Weaver Service Dockerfile

**Production** (`docker/weaver/Dockerfile`):
```dockerfile
# Multi-stage build for smaller production image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Development** (`docker/weaver/Dockerfile.dev`):
```dockerfile
# Development with hot reload
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### Root docker-compose.yml

**Location**: `/home/aepod/dev/weave-nn/docker-compose.yml`

**Services**:
```yaml
version: '3.8'

services:
  weaver:
    build:
      context: ./weaver
      dockerfile: ../infrastructure/docker/weaver/Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./weave-nn:/vault:ro           # Read-only vault
      - ./weaver/data:/data             # Persistent shadow cache
      - ./weaver/logs:/logs             # Log files
      - ./weaver/src:/app/src:cached    # Hot reload
    environment:
      - VAULT_PATH=/vault
      - NODE_ENV=development
      - VERCEL_AI_GATEWAY_API_KEY=${VERCEL_AI_GATEWAY_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    networks:
      - weave-network

networks:
  weave-network:
    driver: bridge
```

---

## Kubernetes Strategy (Future v2.0+)

### When to Migrate to Kubernetes

**Triggers**:
- Multi-user deployment needed
- Cloud hosting (AWS EKS, GCP GKE, Azure AKS)
- Horizontal scaling required (multiple Weaver instances)
- High availability needed (99.9% uptime)
- Advanced networking (service mesh, ingress)

### Future Kubernetes Structure

```
kubernetes/
├── base/                       # Base configurations (Kustomize)
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── kustomization.yaml
│
├── services/                   # Service-specific manifests
│   ├── weaver/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── hpa.yaml            # Horizontal Pod Autoscaler
│   ├── api-gateway/
│   └── mcp-server/
│
├── overlays/                   # Environment-specific configs
│   ├── development/
│   ├── staging/
│   └── production/
│
└── README.md
```

**See**: `/docs/monorepo-structure.md` section 3 for full K8s structure

---

## Deployment Strategy

### MVP (Current) - Docker Compose
- **Deployment**: Local machine only
- **Orchestration**: docker-compose
- **Scaling**: Vertical (increase container resources)
- **Networking**: Docker bridge network
- **Storage**: Local volumes
- **Monitoring**: Docker logs

**Deploy Command**:
```bash
docker-compose up -d
```

### v0.5 - Docker Compose (Multi-Service)
- **Deployment**: Still local, but 3+ services
- **Services**: API Gateway, MCP Server, File Watcher
- **Orchestration**: docker-compose with multiple services
- **Networking**: Docker networks with service discovery
- **Storage**: Named volumes

### v2.0+ - Kubernetes
- **Deployment**: Cloud (AWS, GCP, Azure)
- **Orchestration**: Kubernetes
- **Scaling**: Horizontal (pod replicas)
- **Networking**: Service mesh (Istio), ingress controllers
- **Storage**: Persistent volumes, cloud storage
- **Monitoring**: Prometheus, Grafana, Jaeger

---

## Migration Path

### Phase 1: MVP (Week 1-2)
1. Create `docker/weaver/Dockerfile`
2. Create `docker/weaver/Dockerfile.dev`
3. Create root `docker-compose.yml`
4. Test local deployment

### Phase 2: Multi-Service Docker (Month 2)
1. Update `docker-compose.yml` with 3+ services
2. Add service-specific Dockerfiles
3. Configure Docker networks
4. Add health checks

### Phase 3: Kubernetes Prep (Month 4-5)
1. Create `kubernetes/` directory structure
2. Write base Kubernetes manifests
3. Set up Kustomize overlays
4. Test in local Kubernetes (minikube)

### Phase 4: Cloud Deployment (Month 6+)
1. Choose cloud provider (AWS, GCP, Azure)
2. Set up managed Kubernetes cluster
3. Deploy services to K8s
4. Configure monitoring and observability

---

## Related Documentation

- `/docs/monorepo-structure-mvp.md` - MVP directory structure
- `/docs/monorepo-structure.md` - Full infrastructure section (section 3)
- `/docs/migration-strategy-local-to-microservices.md` - Detailed migration guide
- Root `docker-compose.yml` - Orchestration configuration

---

**Last Updated**: 2025-10-23
**Status**: Docker active (MVP), Kubernetes placeholder
**Next Steps**: Create Weaver Dockerfiles
