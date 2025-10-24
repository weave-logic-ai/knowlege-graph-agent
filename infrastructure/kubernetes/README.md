# Kubernetes Directory (Future)

**Purpose**: Kubernetes manifests for cloud deployment and production orchestration

**Current Status**: ⏳ Placeholder - Not implemented yet

---

## When to Implement Kubernetes

### Don't Use K8s Until...

**Current (MVP v0.1-0.4)**:
- ✅ Use Docker Compose
- ✅ Single service (Weaver)
- ✅ Local development only

**v0.5 (Multi-Service)**:
- ✅ Still use Docker Compose
- ✅ 3-5 services
- ✅ Still local development

**v2.0+ (Production Ready)**:
- ✅ **NOW use Kubernetes**
- ✅ Multi-user deployment
- ✅ Cloud hosting needed
- ✅ Horizontal scaling required

### Triggers for Kubernetes Migration

Use Kubernetes when you need:
- ☑️ Multi-user deployment (>10 concurrent users)
- ☑️ Cloud hosting (AWS EKS, GCP GKE, Azure AKS)
- ☑️ Horizontal scaling (multiple pod replicas)
- ☑️ High availability (99.9%+ uptime SLA)
- ☑️ Advanced networking (service mesh, ingress controllers)
- ☑️ Auto-scaling based on load
- ☑️ Rolling deployments with zero downtime
- ☑️ Resource quotas and limits per service

**If you don't need these**, stay with Docker Compose.

---

## Future Kubernetes Structure

```
kubernetes/
├── base/                       # Kustomize base configurations
│   ├── namespace.yaml          # weave-nn namespace
│   ├── configmap.yaml          # Shared configuration
│   ├── secrets.yaml            # Sealed secrets (production)
│   └── kustomization.yaml      # Kustomize base
│
├── services/                   # Per-service manifests
│   ├── weaver/
│   │   ├── deployment.yaml     # Weaver deployment
│   │   ├── service.yaml        # Weaver K8s service
│   │   ├── configmap.yaml      # Weaver-specific config
│   │   ├── hpa.yaml            # Horizontal Pod Autoscaler
│   │   └── kustomization.yaml
│   │
│   ├── api-gateway/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml        # External ingress
│   │   └── kustomization.yaml
│   │
│   └── mcp-server/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── kustomization.yaml
│
├── overlays/                   # Environment-specific configs
│   ├── development/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── production/
│       ├── kustomization.yaml
│       ├── patches/
│       └── secrets/            # Sealed secrets for prod
│
├── monitoring/                 # Observability stack
│   ├── prometheus/
│   ├── grafana/
│   └── jaeger/
│
└── README.md (this file)
```

---

## Migration Guide

### Step 1: Learn Kubernetes Locally
```bash
# Install minikube (local Kubernetes)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start minikube
minikube start

# Verify cluster
kubectl get nodes
```

### Step 2: Create Base Manifests

**namespace.yaml**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: weave-nn
```

**deployment.yaml** (Weaver example):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: weaver
  namespace: weave-nn
spec:
  replicas: 3
  selector:
    matchLabels:
      app: weaver
  template:
    metadata:
      labels:
        app: weaver
    spec:
      containers:
      - name: weaver
        image: weaver:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
```

**service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: weaver
  namespace: weave-nn
spec:
  selector:
    app: weaver
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

### Step 3: Deploy to Minikube

```bash
# Apply namespace
kubectl apply -f kubernetes/base/namespace.yaml

# Apply services
kubectl apply -k kubernetes/services/weaver/

# Check deployment
kubectl get pods -n weave-nn
kubectl get services -n weave-nn
```

### Step 4: Set Up Kustomize Overlays

**overlays/development/kustomization.yaml**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: weave-nn

bases:
  - ../../services/weaver

patches:
  - path: development-patches.yaml
```

**overlays/development/development-patches.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: weaver
spec:
  replicas: 1  # Fewer replicas for dev
  template:
    spec:
      containers:
      - name: weaver
        env:
        - name: NODE_ENV
          value: "development"
        - name: LOG_LEVEL
          value: "debug"
```

### Step 5: Cloud Deployment

**AWS EKS**:
```bash
# Create EKS cluster
eksctl create cluster --name weave-nn --region us-east-1

# Deploy
kubectl apply -k kubernetes/overlays/production/
```

**GCP GKE**:
```bash
# Create GKE cluster
gcloud container clusters create weave-nn --zone us-central1-a

# Deploy
kubectl apply -k kubernetes/overlays/production/
```

---

## Key Kubernetes Concepts for Weaver

### Deployments
- Manage pod replicas
- Rolling updates
- Rollback capability

### Services
- Internal DNS (weaver.weave-nn.svc.cluster.local)
- Load balancing
- Service discovery

### ConfigMaps
- Non-sensitive configuration
- Mount as files or env vars
- Hot reload on changes

### Secrets
- Sensitive data (API keys)
- Base64 encoded
- Mounted securely to pods

### Horizontal Pod Autoscaler (HPA)
- Auto-scale based on CPU/memory
- Min/max replica counts
- Custom metrics (request rate, queue depth)

### Ingress
- External HTTP/HTTPS access
- TLS termination
- Path-based routing

---

## Cost Considerations

### Managed Kubernetes Pricing

**AWS EKS**:
- Control plane: $0.10/hour (~$73/month)
- Worker nodes: EC2 pricing (t3.medium ~$30/month each)
- Total (3 nodes): ~$163/month

**GCP GKE**:
- Control plane: Free (autopilot) or $0.10/hour (standard)
- Worker nodes: Compute Engine pricing (e2-medium ~$25/month each)
- Total (3 nodes): ~$75/month (autopilot)

**Azure AKS**:
- Control plane: Free
- Worker nodes: VM pricing (B2s ~$15/month each)
- Total (3 nodes): ~$45/month

**vs Docker Compose on single VM**:
- 1 VM (4 vCPU, 16GB RAM): ~$50-80/month
- **Recommendation**: Stay with Docker Compose until revenue justifies K8s costs

---

## Related Documentation

- `/docs/monorepo-structure.md` - Full K8s structure (section 3.1)
- `/docs/migration-strategy-local-to-microservices.md` - Migration guide (section 6)
- `/infrastructure/docker/README.md` - Current Docker strategy

---

**Last Updated**: 2025-10-23
**Status**: Placeholder - Do not implement until v2.0
**Next Review**: After v1.0 launch (Month 6+)
