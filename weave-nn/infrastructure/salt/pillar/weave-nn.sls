weave_nn:
  version: "1.0.0"
  project_name: "weave-nn"

  # User configuration
  user:
    name: "{{ salt['environ.get']('SUDO_USER', 'developer') }}"
    home: "{{ salt['user.info'](salt['environ.get']('SUDO_USER', 'developer'))['home'] }}"

  # Python configuration
  python:
    version: "3.11"
    venv_path: "{{ salt['user.info'](salt['environ.get']('SUDO_USER', 'developer'))['home'] }}/weave-nn/.venv"

  # Node.js configuration
  nodejs:
    version: "20"

  # Obsidian configuration
  obsidian:
    version: "latest"
    appimage_url: "https://github.com/obsidianmd/obsidian-releases/releases/latest/download/Obsidian-latest.AppImage"
    plugins:
      - "obsidian-local-rest-api"
      - "obsidian-tasks-plugin"
      - "obsidian-mehrmaid"
      - "obsidian-advanced-uri"

  # Claude Code configuration
  claude_code:
    install_method: "npm"  # or "curl" for standalone binary

  # Claude-Flow configuration
  claude_flow:
    version: "2.7"
    git_url: "https://github.com/cyanheads/claude-engineer"

  # RabbitMQ configuration
  rabbitmq:
    docker_image: "rabbitmq:3-management"
    ports:
      amqp: 5672
      management: 15672
    exchanges:
      - name: "weave-nn.events"
        type: "topic"
        durable: true
    queues:
      - name: "mcp_sync"
        durable: true
        routing_keys: ["vault.file.*", "vault.metadata.*"]
      - name: "git_auto_commit"
        durable: true
        routing_keys: ["vault.file.created", "vault.file.modified", "vault.file.deleted"]
      - name: "n8n_workflows"
        durable: true
        routing_keys: ["vault.file.*", "task.*", "client.*"]
      - name: "agent_rules"
        durable: true
        routing_keys: ["vault.file.*", "vault.metadata.*"]
      - name: "knowledge_extraction"
        durable: true
        routing_keys: ["project.completed"]

  # N8N configuration
  n8n:
    docker_image: "n8nio/n8n"
    port: 5678
    basic_auth:
      user: "admin"
      password: "changeme"  # Change in production

  # Python packages
  python_packages:
    - fastapi
    - uvicorn[standard]
    - pika
    - requests
    - pyyaml
    - watchdog
    - gitpython
    - python-dotenv
    - aiosqlite
