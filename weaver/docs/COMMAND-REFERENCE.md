# Weaver Command Reference

**Quick lookup for all Weaver CLI commands**

---

## Global Options

```bash
weaver --help              # Show help
weaver --version           # Show version
weaver --debug             # Enable debug output
weaver --config <path>     # Use custom config file
```

---

## Service Management

### Start/Stop Service

```bash
weaver service start                    # Start Weaver service
weaver service stop                     # Stop Weaver service
weaver service restart                  # Restart Weaver service
weaver service status                   # Show service status
weaver service health                   # Health check
weaver service logs                     # View logs
weaver service logs --tail <n>          # Show last N lines
weaver service logs --follow            # Follow logs in real-time
weaver service logs --level <level>     # Filter by log level (debug|info|warn|error)
```

### Service Configuration

```bash
weaver service config show              # Show current configuration
weaver service config validate          # Validate configuration
weaver service config reload            # Reload configuration
```

---

## Vault Operations

### Vault Management

```bash
weaver vault init --path <path>                          # Initialize vault
weaver vault stats --path <path>                         # Show vault statistics
weaver vault sync                                        # Sync vault with shadow cache
weaver vault validate --path <path>                      # Validate vault structure
```

### Metadata Operations

```bash
weaver vault enhance-metadata --target <path>            # Enhance all metadata
weaver vault enhance-metadata --target <path> --dry-run  # Preview changes
weaver vault enhance-metadata --batch-size <n>           # Set batch size
weaver vault enhance-metadata --priority-files <list>    # Prioritize specific files
```

### Icon Application

```bash
weaver vault apply-icons --mode incremental              # Apply icons to new files
weaver vault apply-icons --mode full                     # Apply icons to all files
weaver vault apply-icons --mode watch                    # Watch and apply icons
weaver vault apply-icons --dry-run                       # Preview changes
```

---

## Knowledge Graph Operations

### Graph Analysis

```bash
weaver graph analyze <path>                    # Analyze graph structure
weaver graph analyze <path> --format json      # Output as JSON
weaver graph analyze <path> --format markdown  # Output as markdown report
weaver graph analyze <path> --output <file>    # Save to file
```

### Graph Validation

```bash
weaver graph validate <path>                   # Validate graph structure
weaver graph validate <path> --strict          # Strict validation
weaver graph validate <path> --fix             # Auto-fix issues
weaver graph validate <path> --report <file>   # Save validation report
```

### Graph Operations

```bash
weaver graph orphans <path>                    # Find orphaned documents
weaver graph orphans <path> --threshold <n>    # Set connection threshold
weaver graph suggest <path>                    # Suggest new connections
weaver graph suggest <path> --limit <n>        # Limit suggestions
weaver graph metrics <path>                    # Calculate graph metrics
weaver graph metrics <path> --detailed         # Detailed metrics
```

### Graph Visualization

```bash
weaver graph visualize <path>                  # Generate graph visualization
weaver graph visualize <path> --format svg     # Output format (svg|png|json)
weaver graph visualize <path> --output <file>  # Save to file
weaver graph visualize <path> --filter <type>  # Filter by type
```

### Hub Management

```bash
weaver graph hubs list <path>                  # List all hub documents
weaver graph hubs validate <path>              # Validate hub structure
weaver graph hubs suggest <path>               # Suggest missing hubs
weaver graph hubs create --template <type>     # Create new hub
```

---

## Workflow Operations

### Workflow Management

```bash
weaver workflow list                           # List all workflows
weaver workflow describe <workflow-id>         # Show workflow details
weaver workflow validate <workflow-id>         # Validate workflow definition
```

### Workflow Execution

```bash
# Document Connection Workflow
weaver workflow run document-connection \
  --file-path <path> \
  --vault-root <path> \
  --event-type <change|create|delete>

# Add --dry-run for preview
weaver workflow run document-connection \
  --file-path <path> \
  --vault-root <path> \
  --dry-run

# Metadata Enhancement Workflow
weaver workflow run enhance-metadata \
  --target <path> \
  --batch-size <n>

# Icon Application Workflow
weaver workflow run icon-application \
  --mode <incremental|full|watch> \
  --root-dir <path>

# Validation Workflow
weaver workflow run validate-graph \
  --vault-root <path> \
  --strict
```

### Workflow Monitoring

```bash
weaver workflow status <workflow-id>           # Check workflow status
weaver workflow status --follow                # Follow status updates
weaver workflow logs <workflow-id>             # View workflow logs
weaver workflow metrics <workflow-id>          # Show workflow metrics
weaver workflow cancel <workflow-id>           # Cancel running workflow
```

---

## Configuration Management

### View Configuration

```bash
weaver config show                             # Show all configuration
weaver config show --key <key>                 # Show specific key
weaver config show --format json               # Output as JSON
weaver config show --format yaml               # Output as YAML
```

### Set Configuration

```bash
weaver config set <key> <value>                # Set configuration value
weaver config set vault.path /path/to/vault
weaver config set workflows.enabled true
weaver config set log.level debug
```

### Configuration Management

```bash
weaver config validate                         # Validate configuration
weaver config reset <key>                      # Reset to default
weaver config export <file>                    # Export configuration
weaver config import <file>                    # Import configuration
```

---

## Development Tools

### Schema Management

```bash
weaver schema validate <file>                  # Validate against schema
weaver schema generate --type <type>           # Generate schema
weaver schema list                             # List available schemas
```

### Testing

```bash
weaver test workflow <workflow-id>             # Test workflow
weaver test workflow <workflow-id> --mock      # Test with mock data
weaver test connection <file>                  # Test file connections
weaver test integration                        # Run integration tests
```

### Debugging

```bash
weaver debug inspect <file>                    # Inspect file metadata
weaver debug inspect <file> --show-raw         # Show raw frontmatter
weaver debug analyze <workflow-id>             # Analyze workflow execution
weaver debug performance <workflow-id>         # Show performance metrics
weaver debug memory                            # Show memory usage
```

---

## MCP Server

### MCP Operations

```bash
weaver-mcp                                     # Start MCP server (stdio)
weaver-mcp --transport http                    # Start HTTP transport
weaver-mcp --port 3000                         # Set HTTP port
weaver-mcp --debug                             # Enable debug mode
```

### MCP Tools (via Claude Desktop)

Available tools when MCP is configured:

- `vault_list_files` - List files in vault
- `vault_read_file` - Read file contents
- `vault_search` - Search vault
- `graph_analyze` - Analyze knowledge graph
- `graph_suggest_connections` - Suggest connections
- `workflow_run` - Execute workflow
- `workflow_status` - Check workflow status

---

## Batch Operations

### Bulk Processing

```bash
# Process multiple files
weaver batch process \
  --files <file1,file2,file3> \
  --workflow document-connection

# Process by pattern
weaver batch process \
  --pattern "docs/**/*.md" \
  --workflow enhance-metadata \
  --concurrency 5

# Process with filter
weaver batch process \
  --path <dir> \
  --filter "status:draft" \
  --workflow validate-graph
```

---

## Monitoring & Diagnostics

### System Monitoring

```bash
weaver monitor metrics                         # Show system metrics
weaver monitor metrics --follow                # Follow metrics
weaver monitor metrics --interval <seconds>    # Set update interval
weaver monitor performance                     # Show performance stats
weaver monitor processes                       # Show running processes
```

### Diagnostics

```bash
weaver diagnostics run                         # Run diagnostics
weaver diagnostics export                      # Export diagnostics
weaver diagnostics export --output <file>      # Save to file
weaver diagnostics check <component>           # Check specific component
```

### Health Checks

```bash
weaver health check                            # Full health check
weaver health check --component <name>         # Check component
weaver health check --verbose                  # Detailed output
```

---

## Data Management

### Database Operations

```bash
weaver db status                               # Show database status
weaver db backup                               # Backup database
weaver db backup --output <file>               # Save backup
weaver db restore <file>                       # Restore from backup
weaver db vacuum                               # Optimize database
weaver db repair                               # Repair database
```

### Cache Management

```bash
weaver cache clear                             # Clear all caches
weaver cache clear --type <type>               # Clear specific cache
weaver cache stats                             # Show cache statistics
weaver cache rebuild                           # Rebuild caches
```

---

## Advanced Operations

### Learning Loop

```bash
weaver learn analyze <topic>                   # Analyze topic
weaver learn search <query>                    # Search with learning
weaver learn reason --context <file>           # Reasoning with context
weaver learn adapt --strategy <name>           # Adapt strategy
```

### Embeddings

```bash
weaver embed generate <file>                   # Generate embeddings
weaver embed search <query>                    # Semantic search
weaver embed similar <file>                    # Find similar documents
weaver embed cluster                           # Cluster documents
```

---

## Environment Variables

### Required

```bash
VAULT_PATH=/path/to/vault                      # Vault root path
ANTHROPIC_API_KEY=sk-ant-...                   # Anthropic API key
```

### Optional

```bash
NODE_ENV=development|production                # Environment
WEAVER_PORT=3000                               # Server port
LOG_LEVEL=debug|info|warn|error               # Log level
WORKFLOWS_ENABLED=true|false                   # Enable workflows
MCP_ENABLED=true|false                         # Enable MCP
MCP_TRANSPORT=stdio|http                       # MCP transport
```

---

## Common Workflows

### Daily Operations

```bash
# Morning routine - sync and analyze
weaver vault sync
weaver graph analyze $VAULT_PATH
weaver graph validate $VAULT_PATH --fix

# Process new documents
weaver workflow run document-connection \
  --file-path path/to/new-doc.md \
  --vault-root $VAULT_PATH

# End of day - cleanup and metrics
weaver cache clear --type temporary
weaver db vacuum
weaver monitor metrics --report daily
```

### Development Workflow

```bash
# Start development
weaver service start
weaver service logs --follow &

# Make changes and test
weaver workflow run document-connection \
  --file-path test.md \
  --dry-run

# Run tests
weaver test integration

# Stop when done
weaver service stop
```

### Production Deployment

```bash
# Pre-deployment checks
weaver config validate
weaver health check --verbose
weaver db backup --output backup.db

# Deploy
weaver service start
weaver monitor metrics --follow

# Post-deployment verification
weaver health check
weaver graph validate $VAULT_PATH
```

---

## Exit Codes

```
0   - Success
1   - General error
2   - Configuration error
3   - Validation error
4   - Service error
5   - Network error
6   - Database error
10  - Workflow execution error
20  - Permission error
```

---

## Keyboard Shortcuts (Interactive Mode)

```
Ctrl+C  - Cancel operation
Ctrl+D  - Exit interactive mode
q       - Quit current view
h       - Help
r       - Refresh
f       - Filter
s       - Sort
/       - Search
```

---

## Tips & Tricks

### Performance Optimization

```bash
# Use dry-run to preview changes
weaver vault enhance-metadata --target . --dry-run

# Process in smaller batches
weaver batch process --batch-size 10

# Monitor resource usage
watch -n 1 'ps aux | grep weaver'

# Clear caches regularly
weaver cache clear --type embeddings
```

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run with debug flag
weaver --debug workflow run document-connection

# Export diagnostics
weaver diagnostics export --output debug.json

# Check specific component
weaver health check --component workflow-engine
```

### Automation

```bash
# Create cron job for daily sync
0 9 * * * cd /path/to/vault && weaver vault sync

# Auto-enhance new files
weaver vault apply-icons --mode watch &

# Scheduled backups
0 0 * * * weaver db backup --output /backups/$(date +\%Y\%m\%d).db
```

---

**Last Updated:** 2025-10-29
**Weaver Version:** 0.1.0

For more details, see [Integration Guide](./INTEGRATION-GUIDE.md) or run `weaver --help`
