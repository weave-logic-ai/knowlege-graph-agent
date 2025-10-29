---
title: 'Quick Reference Guide: Service Mesh & Networking Architecture'
type: documentation
status: in-progress
phase_id: PHASE-1
tags:
  - phase/phase-1
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F52C"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:06.186Z'
keywords:
  - 1. service mesh decision matrix
  - 2. rabbitmq deployment checklist
  - 3. observability stack components
  - 4. security layers (zero-trust)
  - 5. network topology
  - 6. technology stack recommendations
  - 'minimal stack (startups, <10 services)'
  - enterprise stack (>20 services)
  - 7. message queue patterns
  - 8. implementation phases
---
# Quick Reference Guide: Service Mesh & Networking Architecture

**Research Date:** 2025-10-23 | **Agent:** DevOps Specialist

---

## 1. Service Mesh Decision Matrix

| Services | Complexity | Recommendation | Alternative |
|----------|-----------|----------------|-------------|
| 1-10 | Low | ❌ No mesh needed | API Gateway + K8s |
| 10-20 | Medium | 🟡 Linkerd (K8s) / Consul (hybrid) | Native K8s |
| 20+ | High | ✅ Istio | - |
| Multi-cloud | Very High | ✅ Istio | Consul Connect |

**When to use a service mesh:**
- ✅ 20+ microservices
- ✅ Advanced traffic management (canary, A/B)
- ✅ Zero-trust security mandate
- ✅ Multi-environment (K8s + VMs + cloud)

**When to skip:**
- ❌ Simple architecture (<10 services)
- ❌ Single K8s cluster
- ❌ Team lacks service mesh expertise

---

## 2. RabbitMQ Deployment Checklist

```bash
# ✅ Best Practice: Use RabbitMQ Operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# Configuration
✓ Dedicated namespace (rabbitmq-system)
✓ Cluster size: 3-5 nodes (max 7 for quorum queues)
✓ Resource limits = requests (memory)
✓ High-water mark: 0.6 × memory limit
✓ TCP readiness probe (port 5672)
✓ Parallel pod management
✓ Persistent volumes (StatefulSet)
```

**Anti-Patterns:**
- ❌ Manual deployment (use operator)
- ❌ >7 nodes for quorum queues
- ❌ Different memory requests vs limits
- ❌ HTTP readiness probes

---

## 3. Observability Stack Components

```
Metrics  → Prometheus → "What is happening?" (CPU 90%)
Logs     → Loki       → "Why is it happening?" (buffer overflow)
Traces   → Tempo      → "Where is the bottleneck?" (slow DB query)
UI       → Grafana    → Unified visualization
Instrumentation → OpenTelemetry → Vendor-agnostic telemetry
```

**Essential Metrics (Golden Signals):**
- Latency (P50, P95, P99)
- Traffic (requests/sec)
- Errors (5xx rate)
- Saturation (CPU, memory, queue depth)

**Deployment:** Single Docker Compose file (5 containers)

---

## 4. Security Layers (Zero-Trust)

```
Layer 1: Edge Security
  → Load Balancer + WAF + DDoS protection

Layer 2: API Gateway
  → OAuth2/OIDC authentication
  → Rate limiting + JWT validation

Layer 3: Service Mesh
  → mTLS (all service-to-service)
  → SPIFFE/SPIRE (identity)

Layer 4: Application
  → OPA policies (authorization)
  → Secrets management (Vault)

Layer 5: Infrastructure
  → K8s Network Policies
  → Pod Security Standards
```

**Key Technologies:**
- **Identity:** Keycloak (OSS) or Okta (commercial)
- **Service Auth:** SPIFFE/SPIRE
- **Authorization:** Open Policy Agent (OPA)
- **Secrets:** HashiCorp Vault
- **Runtime Security:** Falco

---

## 5. Network Topology

```
Internet
   ↓
Load Balancer (TLS termination)
   ↓
API Gateway (OAuth2)
   ↓
┌────────────────────────┐
│  Service Mesh (mTLS)   │
│  ├── Service A         │
│  ├── Service B         │
│  └── Service C         │
└────────────────────────┘
   ↓
Message Queue (RabbitMQ)
   ↓
Workers (auto-scale)
   ↓
Database + Cache
```

---

## 6. Technology Stack Recommendations

### Minimal Stack (Startups, <10 services)
```yaml
Orchestration: Kubernetes (managed: EKS/GKE/AKS)
Gateway: Kong or NGINX Ingress
Auth: Keycloak
Messaging: RabbitMQ (3 nodes)
Observability: Prometheus + Grafana + Loki
Security: Network Policies + OAuth2
```

### Enterprise Stack (>20 services)
```yaml
Orchestration: Kubernetes (self-managed or managed)
Service Mesh: Istio
Gateway: Kong Gateway
Auth: Okta or Keycloak
Messaging: RabbitMQ (5 nodes) + Kafka (event streaming)
Observability: Prometheus + Loki + Tempo + Grafana + OpenTelemetry
Security: Istio mTLS + SPIFFE/SPIRE + OPA + Vault + Falco
```

---

## 7. Message Queue Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Request/Reply** | Synchronous-like | Payment processing |
| **One-Way (Fire-Forget)** | Background jobs | Email notifications |
| **Pub/Sub** | Multiple consumers | Order event → inventory + analytics |

**Scaling:** Kubernetes HPA based on queue depth

---

## 8. Implementation Phases

```
Phase 1 (Weeks 1-2): Foundation
  → K8s + Prometheus + Grafana + API Gateway + OAuth2

Phase 2 (Weeks 3-4): Messaging
  → RabbitMQ Operator + cluster + monitoring

Phase 3 (Week 5): Observability++
  → Loki + Tempo + OpenTelemetry instrumentation

Phase 4 (Weeks 6-8): Service Mesh (if needed)
  → Istio + mTLS + policies

Phase 5 (Weeks 9-10): Security Hardening
  → SPIFFE/SPIRE + OPA + Vault + Falco

Phase 6 (Weeks 11-12): Optimization
  → Performance tuning + auto-scaling + DR
```

---

## 9. Cost Comparison

| Approach | Software Cost | Infra Cost | Ops Complexity |
|----------|--------------|------------|----------------|
| **Self-Managed OSS** | $0 | Variable | High |
| **Managed Services** | $300-500+/mo | Higher | Medium |

**Open Source Stack:**
- Kubernetes, Istio, RabbitMQ, Prometheus, Keycloak, OPA
- **Cost:** Infrastructure only
- **Expertise Required:** High

**Managed Stack:**
- EKS/GKE, App Mesh, Amazon MQ, Datadog, Okta
- **Cost:** $300-500+/month (small setup)
- **Expertise Required:** Medium

---

## 10. Critical Success Factors

✅ **DO**
- Start with observability (day one)
- Use RabbitMQ Operator (not manual)
- Implement API Gateway with OAuth2
- Adopt OpenTelemetry early
- Use namespace isolation
- Plan for auto-scaling

❌ **DON'T**
- Deploy service mesh for simple architectures
- Manually manage RabbitMQ
- Skip observability
- Trust the network (always verify)
- Exceed 7 RabbitMQ nodes for quorum queues
- Instrument without OpenTelemetry (vendor lock-in)

---

## 11. Decision Trees

### Do I need a service mesh?
```
Services < 10?
  └─ NO → Use API Gateway + K8s native

Services 10-20?
  └─ YES → Linkerd (K8s-only) or Consul (hybrid)

Services > 20?
  └─ YES → Istio (full-featured)

Multi-cloud/hybrid?
  └─ YES → Istio or Consul
```

### Which message queue?
```
Async processing?
  └─ YES → RabbitMQ

Event streaming (high throughput)?
  └─ YES → Apache Kafka

Real-time pub/sub?
  └─ YES → NATS

Synchronous only?
  └─ NO QUEUE → Direct HTTP/gRPC
```

### Observability approach?
```
All architectures:
  └─ YES → Prometheus + Loki + Tempo/Jaeger + Grafana

Budget constrained?
  └─ OSS stack (self-managed)

Want managed?
  └─ Datadog, New Relic, Dynatrace
```

---

## 12. Key Metrics to Monitor

```yaml
# Service-Level
http_request_duration_seconds{quantile="0.99"} < 200ms
http_requests_total{status=~"5.."} / http_requests_total < 0.01 (1% error rate)

# Infrastructure
container_memory_usage_bytes / container_spec_memory_limit_bytes < 0.80
container_cpu_usage_seconds_total < 0.70 (70% CPU)

# RabbitMQ
rabbitmq_queue_messages < 10000 (queue backlog)
rabbitmq_node_mem_used / rabbitmq_node_mem_limit < 0.60

# Kubernetes
kube_pod_container_status_restarts_total < 5 (per hour)
kube_node_status_condition{condition="Ready"} == 1
```

---

## 13. Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| **Service mesh overkill** | Only adopt for 20+ services |
| **Manual RabbitMQ deployment** | Use Kubernetes Operator |
| **No observability** | Deploy Prometheus/Grafana day one |
| **Trusting internal network** | Implement zero-trust (mTLS) |
| **Ignoring auto-scaling** | Configure HPA for services + nodes |
| **Poor secret management** | Use Vault or cloud secret managers |
| **No distributed tracing** | Instrument with OpenTelemetry |

---

## 14. Useful Commands

```bash
# RabbitMQ Operator Install
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# Istio Install
istioctl install --set profile=demo

# Prometheus Operator
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml

# Check service mesh status
istioctl analyze
kubectl get pods -n istio-system

# RabbitMQ cluster status
kubectl get rabbitmqclusters
kubectl rabbitmq manage my-cluster

# View logs with Loki
logcli query '{namespace="production", level="error"}'

# OpenTelemetry collector
kubectl apply -f https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml
```

---

## 15. Resource Links

**Official Docs:**
- Istio: https://istio.io/latest/docs/
- RabbitMQ Operator: https://www.rabbitmq.com/kubernetes/operator/
- Prometheus: https://prometheus.io/docs/
- OpenTelemetry: https://opentelemetry.io/docs/

**Community:**
- CNCF Landscape: https://landscape.cncf.io/
- Service Mesh Comparison: https://servicemesh.es/

---

**Full Report:** `/home/aepod/dev/weave-nn/weave-nn/research/devops-networking/service-mesh-networking-recommendations.md`

**Coordination Key:** `swarm/devops-researcher/architecture-recommendations`

## Related Documents

### Related Files
- [[DEVOPS-NETWORKING-HUB.md]] - Parent hub
- [[service-mesh-networking-recommendations.md]] - Same directory

### Similar Content
- [[service-mesh-networking-recommendations.md]] - Semantic similarity: 75.2%

