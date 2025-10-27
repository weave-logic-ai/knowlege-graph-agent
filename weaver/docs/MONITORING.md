# Weaver Monitoring Guide

**Version**: 1.0.0 (MVP)
**Date**: 2025-10-27

## Key Metrics

### Service Health

```bash
# Overall health
weaver health

# Service status
weaver status

# Detailed metrics
weaver metrics
```

### Performance Metrics

| Metric | Target | Command |
|--------|--------|---------|
| Startup Time | < 100ms | `weaver start --time` |
| Shadow Cache Sync | > 100 files/s | `weaver stats` |
| Memory Usage | < 100MB | `weaver metrics --memory` |
| CPU Usage | < 25% average | `weaver metrics --cpu` |

### Activity Monitoring

```bash
# View logs
weaver logs

# Tail logs in real-time
weaver logs --follow

# Filter by level
weaver logs --level error

# Export logs
weaver logs --export /path/to/logs.txt
```

## Alerting

### Critical Alerts

Monitor these conditions:

1. **Service Down**: Any service shows "stopped"
   ```bash
   if [[ $(weaver status | grep -c "stopped") -gt 0 ]]; then
     alert "Weaver service down!"
   fi
   ```

2. **High Memory**: Memory > 500MB
   ```bash
   MEM=$(weaver metrics --memory | grep MB | awk '{print $2}')
   if (( $(echo "$MEM > 500" | bc -l) )); then
     alert "High memory usage: ${MEM}MB"
   fi
   ```

3. **Sync Failures**: Shadow cache out of sync
   ```bash
   if weaver sync --check | grep -q "failed"; then
     alert "Shadow cache sync failed!"
   fi
   ```

### Warning Alerts

1. **Slow Performance**: Sync < 50 files/s
2. **High CPU**: CPU > 50% for > 5 minutes
3. **Disk Space**: < 1GB free in `.weaver`

## Logging

### Log Levels

- `debug`: Detailed debugging information
- `info`: General informational messages
- `warn`: Warning messages
- `error`: Error messages
- `fatal`: Fatal errors

### Log Rotation

Logs rotate automatically:
- **Daily rotation** (default)
- **30-day retention** (configurable)
- **Compression** of old logs

Configure in `.weaver/config.json`:
```json
{
  "logging": {
    "rotation": "daily",
    "retention": 30,
    "compress": true
  }
}
```

### Log Analysis

```bash
# Count errors in last 24h
weaver logs --since 24h --level error | wc -l

# Find performance issues
weaver logs | grep "slow" | tail -20

# Export for analysis
weaver logs --export logs.jsonl --format jsonl
```

## Performance Monitoring

### Real-Time Monitoring

```bash
# Monitor services
weaver monitor

# Monitor with refresh interval
weaver monitor --interval 1000

# Monitor specific service
weaver monitor --service shadow-cache
```

### Baseline Metrics

From benchmarking (Phase 10):
- **Startup**: 5ms average
- **Shadow Cache**: 3009 files/second
- **Workflow Latency**: 0.01ms average
- **Memory Growth**: ~9MB/hour
- **Shutdown**: < 10ms

### Performance Degradation

Alert if:
- Startup > 1 second (20x slower than baseline)
- Sync < 500 files/s (6x slower than baseline)
- Memory growth > 50MB/hour (5x baseline)

## Maintenance Tasks

### Daily

```bash
# Health check
weaver health

# Check logs for errors
weaver logs --since 24h --level error
```

### Weekly

```bash
# Full vault sync verification
weaver sync --full --verify

# Review performance metrics
weaver metrics --week

# Check database integrity
weaver db --check
```

### Monthly

```bash
# Optimize database
weaver db --optimize

# Review and archive old logs
weaver logs --archive

# Review API usage and costs
weaver usage --month
```

## Dashboard (Future)

Planned metrics dashboard:
- Real-time service status
- Performance graphs
- Error rate trends
- API usage statistics
- Resource utilization

## Integration with Monitoring Tools

### Prometheus

Export metrics:
```bash
weaver metrics --export prometheus
```

### Grafana

Use Prometheus datasource with exported metrics.

### Custom Scripts

```bash
#!/bin/bash
# health-check.sh
weaver health || {
  echo "Weaver health check failed!" | mail -s "Alert" admin@example.com
  exit 1
}
```

For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
