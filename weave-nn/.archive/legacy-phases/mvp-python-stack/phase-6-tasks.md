---
phase_id: PHASE-5
phase_name: MVP Development - Week 1 (Backend Infrastructure)
total_tasks: 64
start_date: '2025-10-21'
end_date: '2025-10-26'
status: pending
---

# Phase 5: MVP Week 1 - Complete Task Breakdown (64 Tasks)

## Day 0 (2025-10-21): Prerequisites & Plugin Installation (18 tasks)

### Obsidian Plugin Installation (11 tasks)

#### Task 1: Install obsidian-local-rest-api plugin
- **Title**: Install obsidian-local-rest-api plugin from Community Plugins
- **Active Form**: Installing obsidian-local-rest-api plugin from Community Plugins
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#obsidian-plugins` `#rest-api` `#critical` `#installation`
- **Dependencies**: None
- **Acceptance Criteria**:
  - Plugin appears in Obsidian Settings > Community Plugins > Installed
  - Plugin is enabled (toggle is ON)
  - No error messages in Obsidian console (Ctrl+Shift+I)
- **Verification**: Check Obsidian Settings > Community Plugins

#### Task 2: Generate API key for obsidian-local-rest-api
- **Title**: Generate API key for obsidian-local-rest-api plugin
- **Active Form**: Generating API key for obsidian-local-rest-api plugin
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#obsidian-plugins` `#rest-api` `#security` `#configuration`
- **Dependencies**: Task 1 (Install obsidian-local-rest-api)
- **Acceptance Criteria**:
  - API key generated and visible in plugin settings
  - API key is at least 32 characters long
  - API key copied to clipboard
- **Verification**: Navigate to plugin settings and verify key is displayed

#### Task 3: Test obsidian-local-rest-api connectivity
- **Title**: Test obsidian-local-rest-api with curl command: curl https://localhost:27124/vault/
- **Active Form**: Testing obsidian-local-rest-api with curl command
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#obsidian-plugins` `#rest-api` `#testing` `#verification`
- **Dependencies**: Task 2 (Generate API key)
- **Acceptance Criteria**:
  - curl command returns HTTP 200 status
  - Response contains vault metadata (name, files list)
  - No SSL certificate errors
- **Verification**:
  ```bash
  curl -k -H "Authorization: Bearer YOUR_API_KEY" https://localhost:27124/vault/
  ```

#### Task 4: Save Obsidian API key to .env file
- **Title**: Save Obsidian API key to .env file
- **Active Form**: Saving Obsidian API key to .env file
- **Due Date**: 2025-10-21
- **Priority**: ⏫ High
- **Tags**: `#day-0` `#configuration` `#environment` `#security` `#env-vars`
- **Dependencies**: Task 2 (Generate API key)
- **Acceptance Criteria**:
  - .env file exists in project root
  - OBSIDIAN_API_KEY variable is set correctly
  - OBSIDIAN_API_URL=https://localhost:27124 is set
  - .env file is added to .gitignore
- **Verification**: `cat .env | grep OBSIDIAN_API_KEY`

#### Task 5: Install obsidian-mehrmaid plugin
- **Title**: Install obsidian-mehrmaid plugin from Community Plugins
- **Active Form**: Installing obsidian-mehrmaid plugin from Community Plugins
- **Due Date**: 2025-10-21
- **Priority**: ⏫ High
- **Tags**: `#day-0` `#obsidian-plugins` `#visualization` `#graphs` `#installation`
- **Dependencies**: None
- **Acceptance Criteria**:
  - Plugin appears in installed plugins list
  - Plugin is enabled
  - No errors in console
- **Verification**: Check Obsidian Settings > Community Plugins > Mehrmaid

#### Task 6: Test mehrmaid graph creation
- **Title**: Test mehrmaid graph creation with wikilinks in Obsidian
- **Active Form**: Testing mehrmaid graph creation with wikilinks in Obsidian
- **Due Date**: 2025-10-21
- **Priority**: ⏫ High
- **Tags**: `#day-0` `#obsidian-plugins` `#visualization` `#testing` `#wikilinks`
- **Dependencies**: Task 5 (Install mehrmaid)
- **Acceptance Criteria**:
  - Create test note with mehrmaid code block
  - Graph renders with wikilinks as clickable nodes
  - Clicking node navigates to linked note
- **Verification**: Create test note with sample mehrmaid graph and verify rendering

#### Task 7: Install obsidian-tasks plugin
- **Title**: Install obsidian-tasks plugin from Community Plugins
- **Active Form**: Installing obsidian-tasks plugin from Community Plugins
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#obsidian-plugins` `#task-management` `#critical` `#installation`
- **Dependencies**: None
- **Acceptance Criteria**:
  - Plugin installed successfully
  - Plugin enabled without errors
  - Tasks syntax is recognized in notes
- **Verification**: Check plugin list in Obsidian settings

#### Task 8: Configure obsidian-tasks global filter
- **Title**: Configure obsidian-tasks global filter settings
- **Active Form**: Configuring obsidian-tasks global filter settings
- **Due Date**: 2025-10-21
- **Priority**: ⏫ High
- **Tags**: `#day-0` `#obsidian-plugins` `#task-management` `#configuration` `#filters`
- **Dependencies**: Task 7 (Install tasks plugin)
- **Acceptance Criteria**:
  - Global filter configured in plugin settings
  - Filter syntax validated (no errors)
  - Sample task query works in test note
- **Verification**: Run test query in Obsidian note and verify results

#### Task 9: Test task queries in Obsidian
- **Title**: Test task queries in Obsidian using task plugin syntax
- **Active Form**: Testing task queries in Obsidian using task plugin syntax
- **Due Date**: 2025-10-21
- **Priority**: ⏫ High
- **Tags**: `#day-0` `#obsidian-plugins` `#task-management` `#testing` `#queries`
- **Dependencies**: Task 8 (Configure global filter)
- **Acceptance Criteria**:
  - Create note with 5+ tasks
  - Run query to filter by status (done/not done)
  - Run query to filter by due date
  - All queries return expected results
- **Verification**: Create test note with various task scenarios

#### Task 10: Install obsidian-advanced-uri plugin
- **Title**: Install obsidian-advanced-uri plugin from Community Plugins
- **Active Form**: Installing obsidian-advanced-uri plugin from Community Plugins
- **Due Date**: 2025-10-21
- **Priority**: 🔽 Medium (Fallback)
- **Tags**: `#day-0` `#obsidian-plugins` `#uri` `#fallback` `#installation`
- **Dependencies**: None
- **Acceptance Criteria**:
  - Plugin installed and enabled
  - No conflicts with other plugins
- **Verification**: Check plugin settings

#### Task 11: Test basic URI functionality
- **Title**: Test basic URI: obsidian://open?vault=weave-nn
- **Active Form**: Testing basic URI for vault access
- **Due Date**: 2025-10-21
- **Priority**: 🔽 Medium
- **Tags**: `#day-0` `#obsidian-plugins` `#uri` `#testing` `#fallback`
- **Dependencies**: Task 10 (Install advanced-uri)
- **Acceptance Criteria**:
  - URI opens vault successfully
  - No errors in browser or Obsidian
  - Can open specific notes via URI
- **Verification**:
  ```bash
  # On Linux/WSL
  xdg-open "obsidian://open?vault=weave-nn"
  ```

### Development Environment Setup (7 tasks)

#### Task 12: Verify Python 3.11+ installation
- **Title**: Verify Python 3.11+ is installed on system
- **Active Form**: Verifying Python 3.11+ installation on system
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#python` `#environment` `#prerequisites` `#verification`
- **Dependencies**: None
- **Acceptance Criteria**:
  - `python --version` or `python3 --version` returns 3.11 or higher
  - Python is in system PATH
  - pip is available
- **Verification**:
  ```bash
  python3 --version  # Should show Python 3.11.x or higher
  python3 -m pip --version
  ```

#### Task 13: Create Python virtual environment
- **Title**: Create Python virtual environment: python -m venv .venv
- **Active Form**: Creating Python virtual environment
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#python` `#environment` `#venv` `#isolation`
- **Dependencies**: Task 12 (Verify Python)
- **Acceptance Criteria**:
  - .venv directory created in project root
  - Virtual environment activates without errors
  - Python interpreter in venv matches system Python version
- **Verification**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate  # Linux/Mac
  # .venv\Scripts\activate  # Windows
  which python  # Should point to .venv/bin/python
  ```

#### Task 14: Install Python dependencies
- **Title**: Activate virtual environment and install dependencies: fastapi, uvicorn, pika, requests, pyyaml, watchdog, gitpython
- **Active Form**: Installing Python dependencies in virtual environment
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#python` `#dependencies` `#pip` `#packages`
- **Dependencies**: Task 13 (Create venv)
- **Acceptance Criteria**:
  - All packages installed without errors
  - `pip list` shows all required packages
  - No version conflicts
  - requirements.txt file created with pinned versions
- **Verification**:
  ```bash
  source .venv/bin/activate
  pip install fastapi uvicorn pika requests pyyaml watchdog gitpython sqlite3
  pip freeze > requirements.txt
  pip list | grep -E "(fastapi|uvicorn|pika|requests|pyyaml|watchdog|gitpython)"
  ```

#### Task 15: Create .env configuration file
- **Title**: Create .env file with OBSIDIAN_API_URL, OBSIDIAN_API_KEY, RABBITMQ_URL, CLAUDE_API_KEY, WEAVER_API_KEY
- **Active Form**: Creating .env file with required environment variables
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#configuration` `#environment` `#security` `#env-vars`
- **Dependencies**: Task 4 (Save API key)
- **Acceptance Criteria**:
  - .env file contains all required variables (Obsidian, RabbitMQ, Claude, Weaver)
  - Variables are properly formatted (KEY=value)
  - No trailing spaces or invalid characters
  - .env file is in .gitignore
- **Verification**:
  ```bash
  cat .env
  # Should contain:
  # OBSIDIAN_API_URL=https://localhost:27124
  # OBSIDIAN_API_KEY=<your-key>
  # RABBITMQ_URL=amqp://admin:password@localhost:5672
  # CLAUDE_API_KEY=<your-key>
  # WEAVER_API_URL=https://api.workflow.dev
  # WEAVER_API_KEY=<your-key>
  # WEAVER_WORKSPACE_ID=<your-workspace-id>
  grep "^\.env$" .gitignore  # Verify .env is ignored
  ```

#### Task 16: Provision GCP VM (Optional)
- **Title**: Provision GCP e2-standard-2 VM (2 vCPU, 8GB RAM) if using cloud deployment
- **Active Form**: Provisioning GCP e2-standard-2 VM for cloud deployment
- **Due Date**: 2025-10-21
- **Priority**: 🔽 Medium (Optional)
- **Tags**: `#day-0` `#gcp` `#cloud` `#vm` `#infrastructure` `#optional`
- **Dependencies**: None
- **Acceptance Criteria**:
  - VM created with e2-standard-2 machine type
  - VM is running and accessible via SSH
  - Static IP assigned (optional but recommended)
  - VM has Ubuntu 22.04 LTS or Debian 12
- **Verification**:
  ```bash
  gcloud compute instances list | grep weave-nn-vm
  gcloud compute ssh weave-nn-vm --zone=us-central1-a
  ```

#### Task 17: Install Docker on VM/local machine
- **Title**: Install Docker on GCP VM or local machine
- **Active Form**: Installing Docker on GCP VM or local machine
- **Due Date**: 2025-10-21
- **Priority**: 🔴 Critical
- **Tags**: `#day-0` `#docker` `#installation` `#infrastructure` `#containers`
- **Dependencies**: Task 16 (Provision VM, if using cloud)
- **Acceptance Criteria**:
  - Docker installed and running
  - User added to docker group (no sudo needed)
  - Docker version 24.0 or higher
  - Docker Compose installed
- **Verification**:
  ```bash
  docker --version  # Should show Docker version 24.0+
  docker ps  # Should run without sudo
  docker-compose --version
  ```

#### Task 18: Configure GCP firewall rules
- **Title**: Open firewall ports: 5672 (RabbitMQ), 15672 (RabbitMQ UI) on GCP VM
- **Active Form**: Opening firewall ports on GCP VM
- **Due Date**: 2025-10-21
- **Priority**: ⏫ High (If using GCP)
- **Tags**: `#day-0` `#gcp` `#firewall` `#networking` `#security` `#optional`
- **Dependencies**: Task 16 (Provision VM)
- **Acceptance Criteria**:
  - Firewall rules created for ports 5672, 15672
  - Rules apply to correct VM instance
  - Source IP range configured (restrict to your IP for security)
  - Rules are active and not blocked by VPC settings
- **Verification**:
  ```bash
  gcloud compute firewall-rules list | grep weave-nn
  # Test connectivity
  telnet <VM_EXTERNAL_IP> 15672
  ```

---

## Day 1 (2025-10-22): RabbitMQ + File Watcher Setup (15 tasks)

### RabbitMQ Installation & Configuration (14 tasks)

#### Task 19: Install RabbitMQ via Docker
- **Title**: Install RabbitMQ via Docker with management plugin enabled
- **Active Form**: Installing RabbitMQ via Docker with management plugin
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#docker` `#message-queue` `#critical`
- **Dependencies**: Task 17 (Install Docker)
- **Acceptance Criteria**:
  - RabbitMQ container running with management plugin
  - Container set to restart automatically (unless-stopped)
  - Environment variables set for admin user
  - Ports 5672 and 15672 exposed
- **Verification**:
  ```bash
  docker run -d \
    --name rabbitmq \
    --restart unless-stopped \
    -p 5672:5672 \
    -p 15672:15672 \
    -e RABBITMQ_DEFAULT_USER=admin \
    -e RABBITMQ_DEFAULT_PASS=<secure-password> \
    rabbitmq:3.12-management
  ```

#### Task 20: Verify RabbitMQ container status
- **Title**: Verify RabbitMQ container is running: docker ps | grep rabbitmq
- **Active Form**: Verifying RabbitMQ container is running
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#docker` `#verification` `#monitoring`
- **Dependencies**: Task 19 (Install RabbitMQ)
- **Acceptance Criteria**:
  - Container status is "Up" not "Restarting"
  - Container uptime > 30 seconds
  - No error messages in container logs
  - Both ports (5672, 15672) are mapped correctly
- **Verification**:
  ```bash
  docker ps | grep rabbitmq
  docker logs rabbitmq | tail -20
  # Should see: "Server startup complete"
  ```

#### Task 21: Access RabbitMQ Management UI
- **Title**: Access RabbitMQ Management UI at http://localhost:15672
- **Active Form**: Accessing RabbitMQ Management UI
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#ui` `#verification` `#monitoring`
- **Dependencies**: Task 20 (Verify container)
- **Acceptance Criteria**:
  - Management UI loads in browser
  - Login page displayed with RabbitMQ branding
  - No connection errors or timeouts
- **Verification**:
  ```bash
  curl http://localhost:15672  # Should return HTML
  # Or open in browser: http://localhost:15672
  ```

#### Task 22: Login to RabbitMQ Management UI
- **Title**: Login to RabbitMQ UI with admin credentials and verify interface
- **Active Form**: Logging into RabbitMQ UI and verifying interface
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#rabbitmq` `#ui` `#authentication` `#verification`
- **Dependencies**: Task 21 (Access UI)
- **Acceptance Criteria**:
  - Login successful with admin credentials
  - Dashboard shows node status as "Running"
  - Queues and Exchanges tabs are visible and accessible
  - No permission errors
- **Verification**: Navigate to Overview tab and verify node status is green

#### Task 23: Create topic exchange
- **Title**: Create topic exchange 'weave-nn.events' with durable=true using rabbitmqadmin
- **Active Form**: Creating topic exchange in RabbitMQ
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#exchange` `#configuration` `#topology`
- **Dependencies**: Task 22 (Login to UI)
- **Acceptance Criteria**:
  - Exchange 'weave-nn.events' created
  - Type is 'topic'
  - Durable flag is set to true
  - Exchange appears in Exchanges tab
- **Verification**:
  ```bash
  # Install rabbitmqadmin if not present
  docker exec rabbitmq rabbitmqadmin declare exchange \
    name=weave-nn.events type=topic durable=true

  # Verify in UI: Exchanges tab should show weave-nn.events
  curl -u admin:password http://localhost:15672/api/exchanges/%2F/weave-nn.events
  ```

#### Task 24: Create weaver_workflows queue
- **Title**: Create durable queue 'weaver_workflows' in RabbitMQ
- **Active Form**: Creating weaver_workflows queue in RabbitMQ
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#rabbitmq` `#queue` `#configuration` `#weaver`
- **Dependencies**: Task 23 (Create exchange)
- **Acceptance Criteria**:
  - Queue 'weaver_workflows' created
  - Durable flag is true
  - Queue appears in Queues tab
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare queue \
    name=weaver_workflows durable=true
  ```

#### Task 25: Create mcp_sync queue
- **Title**: Create durable queue 'mcp_sync' in RabbitMQ
- **Active Form**: Creating mcp_sync queue in RabbitMQ
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#queue` `#configuration` `#mcp-sync`
- **Dependencies**: Task 23 (Create exchange)
- **Acceptance Criteria**:
  - Queue 'mcp_sync' created with durable=true
  - Queue is ready to receive messages
  - Visible in Queues tab
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare queue \
    name=mcp_sync durable=true
  ```

#### Task 26: Create git_auto_commit queue
- **Title**: Create durable queue 'git_auto_commit' in RabbitMQ
- **Active Form**: Creating git_auto_commit queue in RabbitMQ
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#queue` `#configuration` `#git`
- **Dependencies**: Task 23 (Create exchange)
- **Acceptance Criteria**:
  - Queue 'git_auto_commit' created with durable=true
  - Queue operational
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare queue \
    name=git_auto_commit durable=true
  ```

#### Task 27: Create agent_tasks queue
- **Title**: Create durable queue 'agent_tasks' in RabbitMQ
- **Active Form**: Creating agent_tasks queue in RabbitMQ
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#rabbitmq` `#queue` `#configuration` `#agents`
- **Dependencies**: Task 23 (Create exchange)
- **Acceptance Criteria**:
  - Queue 'agent_tasks' created with durable=true
  - Ready to route agent task events
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare queue \
    name=agent_tasks durable=true
  ```

#### Task 28: Create dead letter queue
- **Title**: Create durable queue 'dlq' (dead letter queue) in RabbitMQ
- **Active Form**: Creating dead letter queue in RabbitMQ
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#rabbitmq` `#queue` `#dlq` `#error-handling`
- **Dependencies**: Task 23 (Create exchange)
- **Acceptance Criteria**:
  - Queue 'dlq' created with durable=true
  - Available for failed message routing
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare queue \
    name=dlq durable=true
  ```

#### Task 29: Bind weaver_workflows queue
- **Title**: Bind weaver_workflows queue to exchange with routing key 'vault.*.*'
- **Active Form**: Binding weaver_workflows queue to exchange
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#rabbitmq` `#binding` `#routing` `#weaver`
- **Dependencies**: Task 24 (Create weaver queue)
- **Acceptance Criteria**:
  - Binding created between exchange and queue
  - Routing key 'vault.*.*' set correctly
  - Binding visible in queue's Bindings section
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare binding \
    source=weave-nn.events \
    destination=weaver_workflows \
    routing_key="vault.*.*"
  ```

#### Task 30: Bind mcp_sync queue
- **Title**: Bind mcp_sync queue to exchange with routing key 'vault.file.*'
- **Active Form**: Binding mcp_sync queue to exchange
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#binding` `#routing` `#mcp-sync`
- **Dependencies**: Task 25 (Create mcp_sync queue)
- **Acceptance Criteria**:
  - Binding created with routing key 'vault.file.*'
  - Messages with matching routing key route to mcp_sync
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare binding \
    source=weave-nn.events \
    destination=mcp_sync \
    routing_key="vault.file.*"
  ```

#### Task 31: Bind git_auto_commit queue
- **Title**: Bind git_auto_commit queue to exchange with routing key 'vault.file.updated'
- **Active Form**: Binding git_auto_commit queue to exchange
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#binding` `#routing` `#git`
- **Dependencies**: Task 26 (Create git queue)
- **Acceptance Criteria**:
  - Binding created with routing key 'vault.file.updated'
  - Only file update events route to this queue
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare binding \
    source=weave-nn.events \
    destination=git_auto_commit \
    routing_key="vault.file.updated"
  ```

#### Task 32: Bind agent_tasks queue
- **Title**: Bind agent_tasks queue to exchange with routing key 'task.*'
- **Active Form**: Binding agent_tasks queue to exchange
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#rabbitmq` `#binding` `#routing` `#agents`
- **Dependencies**: Task 27 (Create agent queue)
- **Acceptance Criteria**:
  - Binding created with routing key 'task.*'
  - Agent task events route correctly
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin declare binding \
    source=weave-nn.events \
    destination=agent_tasks \
    routing_key="task.*"
  ```

#### Task 33: Test RabbitMQ message flow
- **Title**: Test RabbitMQ by publishing test message and verifying queue receipt
- **Active Form**: Testing RabbitMQ message publishing and consumption
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#testing` `#verification` `#integration`
- **Dependencies**: Tasks 29-32 (All bindings created)
- **Acceptance Criteria**:
  - Publish test message to exchange with routing key 'vault.file.created'
  - Message appears in mcp_sync queue
  - Message count increments in UI
  - Can retrieve message from queue
- **Verification**:
  ```bash
  docker exec rabbitmq rabbitmqadmin publish \
    exchange=weave-nn.events \
    routing_key=vault.file.created \
    payload='{"test": "message"}'

  # Check queue in UI: Queues > mcp_sync > Get Messages
  docker exec rabbitmq rabbitmqadmin get queue=mcp_sync
  ```

### File Watcher Implementation (5 tasks - moved to next section)

#### Task 34: Create project directory structure
- **Title**: Create project directory structure: weave-nn-mcp/ with publishers/, consumers/, utils/ folders
- **Active Form**: Creating project directory structure
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#project-setup` `#structure` `#organization` `#filesystem`
- **Dependencies**: Task 14 (Install dependencies)
- **Acceptance Criteria**:
  - Directory structure created:
    ```
    weave-nn-mcp/
    ├── publishers/
    │   ├── __init__.py
    │   └── file_watcher.py
    ├── consumers/
    │   ├── __init__.py
    ├── utils/
    │   ├── __init__.py
    │   └── rabbitmq_client.py
    ├── config.py
    └── requirements.txt
    ```
  - All __init__.py files created
  - Project is a valid Python package
- **Verification**:
  ```bash
  tree weave-nn-mcp
  python -c "import weave-nn-mcp.publishers"
  ```

#### Task 35: Implement RabbitMQ Publisher client
- **Title**: Implement RabbitMQ Publisher client in utils/rabbitmq_client.py with connection management
- **Active Form**: Implementing RabbitMQ Publisher client
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#python` `#publisher` `#client`
- **Dependencies**: Task 34 (Create structure)
- **Acceptance Criteria**:
  - RabbitMQPublisher class created
  - Connection management with auto-reconnect
  - Connection pooling for efficiency
  - Graceful connection closure on exit
  - Environment variables read from .env
- **Verification**:
  ```python
  from utils.rabbitmq_client import RabbitMQPublisher
  pub = RabbitMQPublisher()
  # Should connect without errors
  ```

#### Task 36: Add JSON serialization to RabbitMQ client
- **Title**: Add JSON serialization and publish method to RabbitMQ client
- **Active Form**: Adding JSON serialization to RabbitMQ client
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#rabbitmq` `#python` `#json` `#serialization`
- **Dependencies**: Task 35 (Implement client)
- **Acceptance Criteria**:
  - publish() method accepts routing_key and dict payload
  - Payload automatically serialized to JSON
  - Message properties set (content_type='application/json', delivery_mode=2)
  - Returns True on success, False on failure
- **Verification**:
  ```python
  pub.publish("vault.file.created", {"file": "test.md"})
  # Check RabbitMQ UI for message
  ```

#### Task 37: Implement error handling in RabbitMQ publisher
- **Title**: Implement error handling and retry logic in RabbitMQ publisher
- **Active Form**: Implementing error handling in RabbitMQ publisher
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#rabbitmq` `#error-handling` `#retry` `#resilience`
- **Dependencies**: Task 36 (Add publish method)
- **Acceptance Criteria**:
  - Try-except blocks around all RabbitMQ operations
  - Exponential backoff retry (3 attempts)
  - Connection errors trigger reconnect
  - Publish errors logged with details
  - Failed messages optionally sent to DLQ
- **Verification**:
  ```python
  # Stop RabbitMQ and test error handling
  pub.publish("test", {})  # Should retry and log error
  ```

#### Task 38: Implement file watcher for vault directory
- **Title**: Implement file watcher in publishers/file_watcher.py to watch vault directory recursively
- **Active Form**: Implementing file watcher for vault directory
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#file-watcher` `#watchdog` `#filesystem` `#events`
- **Dependencies**: Task 37 (Error handling)
- **Acceptance Criteria**:
  - Uses watchdog library for file system events
  - Watches vault directory recursively
  - Monitors all subdirectories
  - Ignores .obsidian/ directory changes (except workspace.json)
  - Handler class extends FileSystemEventHandler
- **Verification**:
  ```python
  python publishers/file_watcher.py
  # Should print "Watching: /path/to/vault"
  ```

#### Task 39: Add file change detection to watcher
- **Title**: Add .md file change detection (created, modified, deleted) to file watcher
- **Active Form**: Adding file change detection to file watcher
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#file-watcher` `#events` `#detection` `#markdown`
- **Dependencies**: Task 38 (Implement watcher)
- **Acceptance Criteria**:
  - Detects file created events (.md only)
  - Detects file modified events (.md only)
  - Detects file deleted events (.md only)
  - Ignores non-.md files
  - Debouncing to prevent duplicate events (500ms)
- **Verification**: Create, modify, delete test.md and verify console output

#### Task 40: Implement YAML frontmatter parsing
- **Title**: Implement YAML frontmatter parsing in file watcher
- **Active Form**: Implementing YAML frontmatter parsing
- **Due Date**: 2025-10-22
- **Priority**: ⏫ High
- **Tags**: `#day-1` `#file-watcher` `#yaml` `#frontmatter` `#parsing`
- **Dependencies**: Task 39 (File detection)
- **Acceptance Criteria**:
  - Extracts frontmatter from .md files
  - Parses YAML to Python dict
  - Handles files without frontmatter gracefully
  - Handles malformed YAML (logs error, doesn't crash)
  - Extracts tags, type, status, priority fields
- **Verification**:
  ```python
  fm = parse_frontmatter("test.md")
  assert "tags" in fm
  ```

#### Task 41: Add RabbitMQ event publishing to file watcher
- **Title**: Add RabbitMQ event publishing to file watcher with vault.file.* routing keys
- **Active Form**: Adding event publishing to file watcher
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#file-watcher` `#rabbitmq` `#publishing` `#events`
- **Dependencies**: Task 40 (Frontmatter parsing)
- **Acceptance Criteria**:
  - Publishes 'vault.file.created' on file create
  - Publishes 'vault.file.updated' on file modify
  - Publishes 'vault.file.deleted' on file delete
  - Event payload includes: file_path, frontmatter, timestamp, event_type
  - Events successfully reach RabbitMQ exchange
- **Verification**:
  ```bash
  # Start watcher, create file, check RabbitMQ UI
  python publishers/file_watcher.py &
  echo "---\ntags: [test]\n---\n# Test" > vault/test.md
  # Check mcp_sync queue in UI
  ```

#### Task 42: Test file watcher integration
- **Title**: Test file watcher by creating test note in Obsidian and verifying RabbitMQ event
- **Active Form**: Testing file watcher integration
- **Due Date**: 2025-10-22
- **Priority**: 🔴 Critical
- **Tags**: `#day-1` `#file-watcher` `#testing` `#integration` `#end-to-end`
- **Dependencies**: Task 41 (Event publishing)
- **Acceptance Criteria**:
  - File watcher running without errors
  - Create note in Obsidian triggers event
  - Event appears in mcp_sync queue within 1 second
  - Event payload is valid JSON
  - Frontmatter correctly parsed in event
- **Verification**:
  ```bash
  # Terminal 1
  python publishers/file_watcher.py

  # Terminal 2 - Create note in Obsidian
  # Then check:
  docker exec rabbitmq rabbitmqadmin get queue=mcp_sync
  ```

---

## Day 2 (2025-10-23): Python MCP Server Core (REST API Client) (11 tasks)

### Obsidian REST API Client (5 tasks)

#### Task 43: Create ObsidianRESTClient class
- **Title**: Create ObsidianRESTClient class in utils/obsidian_client.py with initialization
- **Active Form**: Creating ObsidianRESTClient class
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#rest-api` `#obsidian` `#client`
- **Dependencies**: Task 14 (Install dependencies)
- **Acceptance Criteria**:
  - ObsidianRESTClient class created
  - __init__ accepts api_url and api_key
  - Headers configured with Bearer token
  - SSL verification disabled for self-signed cert (localhost)
  - Timeout set to 30 seconds for requests
- **Verification**:
  ```python
  from utils.obsidian_client import ObsidianRESTClient
  client = ObsidianRESTClient(api_url, api_key)
  assert client.api_url == api_url
  ```

#### Task 44: Implement create_note method
- **Title**: Implement create_note method in ObsidianRESTClient with frontmatter support
- **Active Form**: Implementing create_note method in REST client
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#rest-api` `#create` `#frontmatter`
- **Dependencies**: Task 43 (Create client)
- **Acceptance Criteria**:
  - create_note(path, content, frontmatter) method implemented
  - Frontmatter formatted as YAML with --- delimiters
  - Full content = frontmatter + "\n\n" + content
  - POST request to /vault/{path}
  - Returns response JSON or raises exception
- **Verification**:
  ```python
  result = client.create_note("test.md", "Hello", {"tags": ["test"]})
  # Check Obsidian for test.md file
  ```

#### Task 45: Implement read_note method
- **Title**: Implement read_note method in ObsidianRESTClient
- **Active Form**: Implementing read_note method in REST client
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#rest-api` `#read` `#retrieval`
- **Dependencies**: Task 43 (Create client)
- **Acceptance Criteria**:
  - read_note(path) method implemented
  - GET request to /vault/{path}
  - Returns note content as string
  - Raises FileNotFoundError if note doesn't exist
- **Verification**:
  ```python
  content = client.read_note("test.md")
  assert "Hello" in content
  ```

#### Task 46: Implement update and delete methods
- **Title**: Implement update_note method in ObsidianRESTClient
- **Active Form**: Implementing update_note method in REST client
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#rest-api` `#update` `#delete`
- **Dependencies**: Task 43 (Create client)
- **Acceptance Criteria**:
  - update_note(path, content) method implemented
  - PUT request to /vault/{path}
  - delete_note(path) method implemented
  - DELETE request to /vault/{path}
  - Both methods handle errors gracefully
- **Verification**:
  ```python
  client.update_note("test.md", "Updated content")
  client.delete_note("test.md")
  # Verify in Obsidian
  ```

#### Task 47: Implement list and patch methods
- **Title**: Implement list_notes and patch_note_section methods in ObsidianRESTClient
- **Active Form**: Implementing list_notes and patch_note_section methods
- **Due Date**: 2025-10-23
- **Priority**: ⏫ High
- **Tags**: `#day-2` `#mcp-server` `#rest-api` `#list` `#patch`
- **Dependencies**: Task 43 (Create client)
- **Acceptance Criteria**:
  - list_notes(pattern) method with optional glob pattern
  - Returns list of file paths
  - patch_note_section(path, heading, content) for section updates
  - PATCH request to /vault/{path}
- **Verification**:
  ```python
  notes = client.list_notes("*.md")
  assert len(notes) > 0
  ```

#### Task 48: Test REST API client CRUD operations
- **Title**: Test REST API client CRUD operations: create, read, update, delete test note
- **Active Form**: Testing REST API client CRUD operations
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#rest-api` `#testing` `#crud`
- **Dependencies**: Tasks 44-47 (All methods)
- **Acceptance Criteria**:
  - Test script creates, reads, updates, deletes note
  - All operations succeed without errors
  - Note appears/disappears in Obsidian as expected
  - Test cleanup leaves no artifacts
- **Verification**:
  ```bash
  python tests/test_obsidian_client.py
  # All tests pass
  ```

### FastAPI MCP Server (6 tasks)

#### Task 49: Create FastAPI server with health endpoint
- **Title**: Create FastAPI server in server.py with health endpoint
- **Active Form**: Creating FastAPI server with health endpoint
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#fastapi` `#health-check` `#api`
- **Dependencies**: Task 43 (ObsidianRESTClient)
- **Acceptance Criteria**:
  - FastAPI app created in server.py
  - Health endpoint at GET /health returns {"status": "ok"}
  - ObsidianRESTClient initialized from env vars
  - Server imports successful
- **Verification**:
  ```python
  from server import app
  # Run: uvicorn server:app
  ```

#### Task 50: Add MCP create and read endpoints
- **Title**: Add MCP endpoints to FastAPI server: create_note, read_note, update_note, delete_note, list_notes
- **Active Form**: Adding MCP endpoints to FastAPI server
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#fastapi` `#endpoints` `#crud`
- **Dependencies**: Task 49 (Create server)
- **Acceptance Criteria**:
  - POST /mcp/create_note endpoint implemented
  - GET /mcp/read_note endpoint implemented
  - PUT /mcp/update_note endpoint implemented
  - DELETE /mcp/delete_note endpoint implemented
  - GET /mcp/list_notes endpoint implemented
  - All endpoints call ObsidianRESTClient methods
- **Verification**: Check FastAPI auto-generated docs at /docs

#### Task 51: Start MCP server
- **Title**: Start MCP server with uvicorn and verify health endpoint responds
- **Active Form**: Starting MCP server and verifying health endpoint
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#uvicorn` `#deployment` `#startup`
- **Dependencies**: Task 50 (Add endpoints)
- **Acceptance Criteria**:
  - Server starts on port 8000 without errors
  - Health endpoint returns 200 OK
  - Auto-reload enabled for development
  - Server logs show all routes registered
- **Verification**:
  ```bash
  uvicorn server:app --reload --host 0.0.0.0 --port 8000
  curl http://localhost:8000/health
  # Response: {"status": "ok"}
  ```

#### Task 52: Test MCP endpoints with curl
- **Title**: Test all MCP endpoints with curl commands
- **Active Form**: Testing MCP endpoints with curl
- **Due Date**: 2025-10-23
- **Priority**: 🔴 Critical
- **Tags**: `#day-2` `#mcp-server` `#testing` `#curl` `#integration`
- **Dependencies**: Task 51 (Start server)
- **Acceptance Criteria**:
  - Test create_note with curl POST
  - Test read_note with curl GET
  - Test update_note with curl PUT
  - Test delete_note with curl DELETE
  - Test list_notes with curl GET
  - All return expected responses
- **Verification**:
  ```bash
  # Create
  curl -X POST "http://localhost:8000/mcp/create_note?path=test.md" \
    -H "Content-Type: application/json" \
    -d '{"content": "Test", "frontmatter": {"tags": ["test"]}}'

  # Read
  curl "http://localhost:8000/mcp/read_note?path=test.md"

  # Update
  curl -X PUT "http://localhost:8000/mcp/update_note?path=test.md" \
    -H "Content-Type: application/json" \
    -d '{"content": "Updated"}'

  # List
  curl "http://localhost:8000/mcp/list_notes"

  # Delete
  curl -X DELETE "http://localhost:8000/mcp/delete_note?path=test.md"
  ```

#### Task 53: Add error handling to MCP endpoints
- **Title**: Add comprehensive error handling to MCP endpoints
- **Active Form**: Adding error handling to MCP endpoints
- **Due Date**: 2025-10-23
- **Priority**: ⏫ High
- **Tags**: `#day-2` `#mcp-server` `#error-handling` `#fastapi` `#resilience`
- **Dependencies**: Task 50 (Add endpoints)
- **Acceptance Criteria**:
  - HTTPException raised for client errors (400, 404)
  - Try-except blocks around Obsidian API calls
  - Proper status codes returned (200, 201, 204, 400, 404, 500)
  - Error responses include descriptive messages
  - Logging for all errors
- **Verification**:
  ```bash
  # Test 404
  curl "http://localhost:8000/mcp/read_note?path=nonexistent.md"
  # Should return 404 with error message
  ```

#### Task 54: Document MCP API endpoints
- **Title**: Document MCP API endpoints in FastAPI (docstrings and examples)
- **Active Form**: Documenting MCP API endpoints
- **Due Date**: 2025-10-23
- **Priority**: 🔽 Medium
- **Tags**: `#day-2` `#mcp-server` `#documentation` `#api-docs` `#openapi`
- **Dependencies**: Task 50 (Add endpoints)
- **Acceptance Criteria**:
  - Docstrings added to all endpoint functions
  - Request/response examples in docstrings
  - Pydantic models for request/response bodies
  - OpenAPI docs auto-generated at /docs
  - Examples visible in Swagger UI
- **Verification**: Navigate to http://localhost:8000/docs and verify docs

---

## Day 3 (2025-10-24): MCP Sync Consumer + Shadow Cache (10 tasks)

### MCP Sync Consumer (4 tasks)

#### Task 55: Create MCP Sync Consumer
- **Title**: Create MCP Sync Consumer in consumers/mcp_sync.py to subscribe to mcp_sync queue
- **Active Form**: Creating MCP Sync Consumer
- **Due Date**: 2025-10-24
- **Priority**: 🔴 Critical
- **Tags**: `#day-3` `#mcp-sync` `#consumer` `#rabbitmq` `#integration`
- **Dependencies**: Task 42 (File watcher working)
- **Acceptance Criteria**:
  - MCPSyncConsumer class created
  - Subscribes to mcp_sync queue via pika
  - Callback function processes messages
  - Consumer runs in blocking mode
  - Graceful shutdown on SIGINT/SIGTERM
- **Verification**:
  ```bash
  python consumers/mcp_sync.py
  # Should print "Listening to mcp_sync queue..."
  ```

#### Task 56: Implement event processing
- **Title**: Implement vault.file.* event processing in MCP sync consumer
- **Active Form**: Implementing event processing in MCP sync consumer
- **Due Date**: 2025-10-24
- **Priority**: 🔴 Critical
- **Tags**: `#day-3` `#mcp-sync` `#event-processing` `#routing` `#logic`
- **Dependencies**: Task 55 (Create consumer)
- **Acceptance Criteria**:
  - Processes vault.file.created events
  - Processes vault.file.updated events
  - Processes vault.file.deleted events
  - Extracts file_path, frontmatter from event payload
  - Parses event JSON correctly
- **Verification**: Publish test event and verify consumer processes it

#### Task 57: Create ShadowCache with SQLite
- **Title**: Create ShadowCache class in utils/shadow_cache.py with SQLite database
- **Active Form**: Creating ShadowCache class with SQLite
- **Due Date**: 2025-10-24
- **Priority**: 🔴 Critical
- **Tags**: `#day-3` `#shadow-cache` `#sqlite` `#database` `#persistence`
- **Dependencies**: None (parallel to Task 55)
- **Acceptance Criteria**:
  - ShadowCache class created
  - SQLite connection managed properly
  - Database file at .obsidian/plugins/weave-nn/metadata.db
  - Connection pooling for concurrent access
  - Automatic table creation on init
- **Verification**:
  ```python
  from utils.shadow_cache import ShadowCache
  cache = ShadowCache()
  # Check database file exists
  ```

#### Task 58: Implement database schema
- **Title**: Implement database schema for nodes table in shadow cache
- **Active Form**: Implementing database schema in shadow cache
- **Due Date**: 2025-10-24
- **Priority**: 🔴 Critical
- **Tags**: `#day-3` `#shadow-cache` `#schema` `#database` `#sqlite`
- **Dependencies**: Task 57 (Create cache)
- **Acceptance Criteria**:
  - nodes table created with columns:
    - file_path (TEXT PRIMARY KEY)
    - node_type (TEXT)
    - frontmatter (TEXT/JSON)
    - tags (TEXT/JSON)
    - links (TEXT/JSON)
    - headings (TEXT/JSON)
    - updated_at (TIMESTAMP)
  - Indexes on tags and updated_at
  - Schema validated
- **Verification**:
  ```bash
  sqlite3 .obsidian/plugins/weave-nn/metadata.db ".schema"
  # Should show nodes table
  ```

#### Task 59: Implement cache methods
- **Title**: Implement upsert_node and query_by_tag methods in shadow cache
- **Active Form**: Implementing cache methods in shadow cache
- **Due Date**: 2025-10-24
- **Priority**: 🔴 Critical
- **Tags**: `#day-3` `#shadow-cache` `#methods` `#crud` `#queries`
- **Dependencies**: Task 58 (Schema)
- **Acceptance Criteria**:
  - upsert_node(file_path, node_type, frontmatter, tags, links, headings)
  - query_by_tag(tag) returns matching nodes
  - query_by_type(node_type) returns matching nodes
  - get_node(file_path) returns single node
  - delete_node(file_path) removes node
  - All methods handle edge cases
- **Verification**:
  ```python
  cache.upsert_node("test.md", "note", {}, ["test"], [], [])
  nodes = cache.query_by_tag("test")
  assert len(nodes) > 0
  ```

#### Task 60: Add error handling to consumer
- **Title**: Add error handling to MCP sync consumer with DLQ routing
- **Active Form**: Adding error handling to MCP sync consumer
- **Due Date**: 2025-10-24
- **Priority**: ⏫ High
- **Tags**: `#day-3` `#mcp-sync` `#error-handling` `#dlq` `#resilience`
- **Dependencies**: Task 56 (Event processing)
- **Acceptance Criteria**:
  - Try-except around message processing
  - Failed messages sent to DLQ
  - Error logged with full context
  - Message acknowledged even on failure
  - No infinite retry loops
- **Verification**: Send malformed event and verify DLQ routing

#### Task 61: Test MCP sync integration
- **Title**: Test MCP sync by creating note and verifying SQLite cache update
- **Active Form**: Testing MCP sync and cache update
- **Due Date**: 2025-10-24
- **Priority**: 🔴 Critical
- **Tags**: `#day-3` `#mcp-sync` `#testing` `#integration` `#end-to-end`
- **Dependencies**: Tasks 59, 60 (Cache + error handling)
- **Acceptance Criteria**:
  - Start file watcher and MCP sync consumer
  - Create note in Obsidian with frontmatter
  - Event published to RabbitMQ
  - Consumer processes event
  - SQLite database updated within 2 seconds
  - Query cache returns new note
- **Verification**:
  ```bash
  # Terminal 1
  python publishers/file_watcher.py

  # Terminal 2
  python consumers/mcp_sync.py

  # Terminal 3 - Create note in Obsidian, then:
  sqlite3 .obsidian/plugins/weave-nn/metadata.db \
    "SELECT * FROM nodes WHERE file_path='test.md';"
  ```

### Claude-Flow Memory Sync (3 tasks)

#### Task 62: Create Claude-Flow Memory Client
- **Title**: Create Claude-Flow Memory Client in utils/claude_flow_client.py
- **Active Form**: Creating Claude-Flow Memory Client
- **Due Date**: 2025-10-24
- **Priority**: ⏫ High
- **Tags**: `#day-3` `#claude-flow` `#memory` `#client` `#integration`
- **Dependencies**: None
- **Acceptance Criteria**:
  - ClaudeFlowClient class created
  - Connects to Claude-Flow SQLite database
  - Methods: store_memory(), query_memory(), delete_memory()
  - Schema compatible with Claude-Flow
  - Connection pooling implemented
- **Verification**:
  ```python
  from utils.claude_flow_client import ClaudeFlowClient
  cf = ClaudeFlowClient()
  cf.store_memory("test", {"content": "test"})
  ```

#### Task 63: Implement memory storage in sync consumer
- **Title**: Implement memory storage on file create/update in MCP sync consumer
- **Active Form**: Implementing memory storage in sync consumer
- **Due Date**: 2025-10-24
- **Priority**: ⏫ High
- **Tags**: `#day-3` `#claude-flow` `#memory` `#storage` `#sync`
- **Dependencies**: Task 62 (CF client)
- **Acceptance Criteria**:
  - On vault.file.created → Store memory in Claude-Flow
  - On vault.file.updated → Update memory in Claude-Flow
  - Memory includes: file content, frontmatter, wikilinks
  - Relationship graph updated for wikilinks
  - Async/background task for memory storage (non-blocking)
- **Verification**: Create note with wikilinks and check CF database

#### Task 64: Implement memory deletion
- **Title**: Implement memory deletion marking on file delete events
- **Active Form**: Implementing memory deletion in sync consumer
- **Due Date**: 2025-10-24
- **Priority**: ⏫ High
- **Tags**: `#day-3` `#claude-flow` `#memory` `#deletion` `#cleanup`
- **Dependencies**: Task 62 (CF client)
- **Acceptance Criteria**:
  - On vault.file.deleted → Mark memory as deleted (soft delete)
  - Don't permanently delete (keep for audit trail)
  - Update relationship graph to remove links
  - Deleted memories excluded from queries
- **Verification**: Delete note and verify memory marked deleted in CF DB

#### Task 65: Test memory sync with wikilinks
- **Title**: Test memory sync by creating note with wikilinks and verifying Claude-Flow DB entry
- **Active Form**: Testing memory sync with wikilinks
- **Due Date**: 2025-10-24
- **Priority**: ⏫ High
- **Tags**: `#day-3` `#claude-flow` `#memory` `#testing` `#wikilinks`
- **Dependencies**: Tasks 63, 64 (Memory storage + deletion)
- **Acceptance Criteria**:
  - Create note with 3+ wikilinks in Obsidian
  - Memory stored in Claude-Flow within 2 seconds
  - Query CF database shows memory entry
  - Wikilinks parsed and stored in relationship table
  - Can query memory by wikilink
- **Verification**:
  ```bash
  # Create note with wikilinks, then check CF DB
  sqlite3 path/to/claude-flow.db \
    "SELECT * FROM memories WHERE file_path='test.md';"
  ```

---

## Day 4 (2025-10-25): Agent Rules (8 tasks)

### Agent Rule Implementation (6 tasks)

#### Task 66: Create AgentRules class
- **Title**: Create AgentRules class in agents/rules.py with initialization
- **Active Form**: Creating AgentRules class
- **Due Date**: 2025-10-25
- **Priority**: 🔴 Critical
- **Tags**: `#day-4` `#agents` `#rules` `#class` `#initialization`
- **Dependencies**: Tasks 48, 59 (REST client + cache)
- **Acceptance Criteria**:
  - AgentRules class created in agents/rules.py
  - __init__ accepts obsidian_client, shadow_cache, claude_flow_client
  - All dependencies injected properly
  - Base methods for all 6 rules stubbed
- **Verification**:
  ```python
  from agents.rules import AgentRules
  rules = AgentRules(obsidian, cache, cf)
  ```

#### Task 67: Implement memory_sync rule
- **Title**: Implement memory_sync rule - Bidirectional sync (Obsidian ↔ Claude-Flow)
- **Active Form**: Implementing memory_sync rule
- **Due Date**: 2025-10-25
- **Priority**: 🔴 Critical
- **Tags**: `#day-4` `#agents` `#memory-sync` `#bidirectional` `#sync`
- **Dependencies**: Task 66 (AgentRules class)
- **Acceptance Criteria**:
  - memory_sync(file_path) method implemented
  - Syncs Obsidian → Claude-Flow
  - Syncs Claude-Flow → Obsidian (if memory updated externally)
  - Conflict resolution strategy (Obsidian takes precedence)
  - Incremental sync (only changed fields)
- **Verification**: Update memory in CF DB, trigger sync, verify Obsidian updated

#### Task 68: Implement node_creation rule
- **Title**: Implement node_creation rule - Auto-create nodes from agent intents
- **Active Form**: Implementing node_creation rule
- **Due Date**: 2025-10-25
- **Priority**: ⏫ High
- **Tags**: `#day-4` `#agents` `#node-creation` `#automation` `#intents`
- **Dependencies**: Task 66 (AgentRules class)
- **Acceptance Criteria**:
  - node_creation(intent) method implemented
  - Parses agent intent (JSON format)
  - Extracts node type, title, frontmatter
  - Creates note in Obsidian via REST API
  - Returns created node path
- **Verification**: Call with test intent and verify note created

#### Task 69: Implement update_propagation rule
- **Title**: Implement update_propagation rule - Propagate changes to related nodes
- **Active Form**: Implementing update_propagation rule
- **Due Date**: 2025-10-25
- **Priority**: ⏫ High
- **Tags**: `#day-4` `#agents` `#update-propagation` `#relationships` `#sync`
- **Dependencies**: Task 66 (AgentRules class)
- **Acceptance Criteria**:
  - update_propagation(file_path, changes) method
  - Finds related nodes via wikilinks
  - Updates backlinks in related nodes
  - Updates aggregate fields (e.g., task counts in parent)
  - Batch updates for efficiency
- **Verification**: Update note and verify related notes updated

#### Task 70: Implement schema_validation rule
- **Title**: Implement schema_validation rule - Validate YAML frontmatter
- **Active Form**: Implementing schema_validation rule
- **Due Date**: 2025-10-25
- **Priority**: ⏫ High
- **Tags**: `#day-4` `#agents` `#schema-validation` `#yaml` `#validation`
- **Dependencies**: Task 66 (AgentRules class)
- **Acceptance Criteria**:
  - schema_validation(file_path, frontmatter) method
  - Validates against node type schema
  - Required fields check
  - Data type validation (string, array, date, etc.)
  - Returns validation errors or empty list
- **Verification**: Test with valid and invalid frontmatter

#### Task 71: Implement auto_linking rule
- **Title**: Implement auto_linking rule - Suggest wikilinks based on content
- **Active Form**: Implementing auto_linking rule
- **Due Date**: 2025-10-25
- **Priority**: ⏫ High
- **Tags**: `#day-4` `#agents` `#auto-linking` `#wikilinks` `#suggestions`
- **Dependencies**: Task 66 (AgentRules class)
- **Acceptance Criteria**:
  - auto_linking(file_path, content) method
  - Extracts keywords from content (TF-IDF or simple regex)
  - Queries shadow cache for matching nodes
  - Returns suggestions with confidence scores
  - Suggests top 5 links maximum
- **Verification**:
  ```python
  suggestions = rules.auto_linking("test.md", "This is about Python programming")
  # Should suggest links to Python-related notes
  ```

#### Task 72: Implement auto_tagging rule
- **Title**: Implement auto_tagging rule - Suggest tags based on content
- **Active Form**: Implementing auto_tagging rule
- **Due Date**: 2025-10-25
- **Priority**: ⏫ High
- **Tags**: `#day-4` `#agents` `#auto-tagging` `#tags` `#suggestions`
- **Dependencies**: Task 66 (AgentRules class)
- **Acceptance Criteria**:
  - auto_tagging(file_path, frontmatter, content) method
  - Uses Claude API to extract tags from content
  - Returns 5 relevant tags
  - Tags follow existing vault tag taxonomy
  - Caches frequent tags for efficiency
- **Verification**:
  ```python
  tags = rules.auto_tagging("test.md", {}, "This note is about Python programming and web development")
  # Should return tags like: python, programming, web-development
  ```

### Agent Integration & Testing (2 tasks)

#### Task 73: Create Agent Task Consumer
- **Title**: Create Agent Task Consumer in consumers/agent_tasks.py
- **Active Form**: Creating Agent Task Consumer
- **Due Date**: 2025-10-25
- **Priority**: 🔴 Critical
- **Tags**: `#day-4` `#agents` `#consumer` `#rabbitmq` `#tasks`
- **Dependencies**: Task 72 (All rules implemented)
- **Acceptance Criteria**:
  - AgentTaskConsumer class created
  - Subscribes to agent_tasks queue
  - Routes task.* events to appropriate rule
  - Callback processes events and calls rule methods
  - Results published back to result queue (optional)
- **Verification**:
  ```bash
  python consumers/agent_tasks.py
  # Should print "Listening to agent_tasks queue..."
  ```

#### Task 74: End-to-end agent integration test
- **Title**: End-to-end test: Create note → File watcher → MCP sync → Agent suggests links/tags
- **Active Form**: Running end-to-end agent integration test
- **Due Date**: 2025-10-25
- **Priority**: 🔴 Critical
- **Tags**: `#day-4` `#agents` `#testing` `#integration` `#end-to-end`
- **Dependencies**: Task 73 (Agent consumer)
- **Acceptance Criteria**:
  - All services running (file watcher, MCP sync, agent consumer)
  - Create note in Obsidian without tags/links
  - File watcher publishes event
  - MCP sync updates cache
  - Agent receives task event
  - Agent suggests tags and links
  - Suggestions logged or returned via API
  - Full pipeline completes within 5 seconds
- **Verification**:
  ```bash
  # Terminal 1
  python publishers/file_watcher.py

  # Terminal 2
  python consumers/mcp_sync.py

  # Terminal 3
  python consumers/agent_tasks.py

  # Terminal 4 - Create note in Obsidian, check logs for suggestions
  tail -f logs/agent_tasks.log
  ```

---

## Day 5 (2025-10-26): Git Integration + Auto-Commit (8 tasks)

### Git Auto-Commit (4 tasks)

#### Task 75: Create GitClient class
- **Title**: Create GitClient class in utils/git_client.py with initialization
- **Active Form**: Creating GitClient class
- **Due Date**: 2025-10-26
- **Priority**: 🔴 Critical
- **Tags**: `#day-5` `#git` `#client` `#automation` `#version-control`
- **Dependencies**: Task 14 (gitpython installed)
- **Acceptance Criteria**:
  - GitClient class created
  - __init__ accepts vault_path
  - git.Repo instance created
  - Validates vault is a git repository
  - Raises error if not initialized
- **Verification**:
  ```python
  from utils.git_client import GitClient
  git = GitClient("/path/to/vault")
  ```

#### Task 76: Implement auto_commit method
- **Title**: Implement auto_commit method in GitClient
- **Active Form**: Implementing auto_commit method
- **Due Date**: 2025-10-26
- **Priority**: 🔴 Critical
- **Tags**: `#day-5` `#git` `#auto-commit` `#automation` `#commits`
- **Dependencies**: Task 75 (GitClient class)
- **Acceptance Criteria**:
  - auto_commit(message=None) method implemented
  - Stages all .md files (repo.index.add(['**/*.md']))
  - Generates commit message if not provided
  - Single file: "Updated {filename}"
  - Multiple files: "Updated {count} notes"
  - Creates commit with gitpython
  - Returns commit SHA
- **Verification**:
  ```python
  sha = git.auto_commit()
  # Check: git log -1
  ```

#### Task 77: Implement pre-commit validation
- **Title**: Implement validate_pre_commit method in GitClient
- **Active Form**: Implementing pre-commit validation
- **Due Date**: 2025-10-26
- **Priority**: ⏫ High
- **Tags**: `#day-5` `#git` `#validation` `#pre-commit` `#checks`
- **Dependencies**: Task 75 (GitClient class)
- **Acceptance Criteria**:
  - validate_pre_commit() method implemented
  - Checks for broken wikilinks
  - Validates YAML frontmatter syntax
  - Checks for merge conflicts
  - Returns list of validation errors or empty list
  - Blocks commit if critical errors found
- **Verification**:
  ```python
  errors = git.validate_pre_commit()
  assert len(errors) == 0
  ```

#### Task 78: Create Git Auto-Commit Consumer
- **Title**: Create Git Auto-Commit Consumer in consumers/git_auto_commit.py
- **Active Form**: Creating Git Auto-Commit Consumer
- **Due Date**: 2025-10-26
- **Priority**: 🔴 Critical
- **Tags**: `#day-5` `#git` `#consumer` `#rabbitmq` `#automation`
- **Dependencies**: Task 76 (auto_commit method)
- **Acceptance Criteria**:
  - GitAutoCommitConsumer class created
  - Subscribes to git_auto_commit queue
  - Debounces events (5 second window)
  - Processes vault.file.updated events
  - Calls GitClient.auto_commit()
  - Handles errors gracefully
- **Verification**:
  ```bash
  python consumers/git_auto_commit.py
  # Should print "Listening to git_auto_commit queue..."
  ```

#### Task 79: Implement debouncing logic
- **Title**: Implement debouncing logic in Git Auto-Commit Consumer (5 seconds)
- **Active Form**: Implementing debouncing logic
- **Due Date**: 2025-10-26
- **Priority**: 🔴 Critical
- **Tags**: `#day-5` `#git` `#debouncing` `#optimization` `#performance`
- **Dependencies**: Task 78 (Consumer created)
- **Acceptance Criteria**:
  - Debounce window set to 5 seconds
  - Multiple events within 5s trigger single commit
  - Timer reset on each new event
  - Commit created after 5s of inactivity
  - Uses threading.Timer or similar
- **Verification**: Edit 3 files rapidly, verify single commit after 5s

#### Task 80: Test Git auto-commit
- **Title**: Test Git auto-commit by editing note and verifying commit created
- **Active Form**: Testing Git auto-commit functionality
- **Due Date**: 2025-10-26
- **Priority**: 🔴 Critical
- **Tags**: `#day-5` `#git` `#testing` `#auto-commit` `#verification`
- **Dependencies**: Task 79 (Debouncing)
- **Acceptance Criteria**:
  - Start file watcher and git consumer
  - Edit note in Obsidian
  - Wait 5 seconds
  - Verify commit created: git log -1
  - Commit message includes filename
  - Only .md files committed
- **Verification**:
  ```bash
  # Terminal 1
  python publishers/file_watcher.py

  # Terminal 2
  python consumers/git_auto_commit.py

  # Edit note in Obsidian, wait 5s, then:
  git log -1 --oneline
  # Should show: "Updated test.md" or similar
  ```

### Workspace.json Watcher (4 tasks)

#### Task 81: Create Workspace Watcher class
- **Title**: Create WorkspaceWatcher class in publishers/workspace_watcher.py
- **Active Form**: Creating WorkspaceWatcher class
- **Due Date**: 2025-10-26
- **Priority**: ⏫ High
- **Tags**: `#day-5` `#workspace` `#watcher` `#obsidian` `#events`
- **Dependencies**: Task 38 (File watcher as template)
- **Acceptance Criteria**:
  - WorkspaceWatcher class extends FileSystemEventHandler
  - Watches .obsidian/workspace.json specifically
  - Ignores other files in .obsidian/
  - RabbitMQ publisher injected
  - Debouncing for rapid changes
- **Verification**:
  ```python
  from publishers.workspace_watcher import WorkspaceWatcher
  watcher = WorkspaceWatcher(publisher, vault_path)
  ```

#### Task 82: Implement workspace change detection
- **Title**: Implement workspace.json change detection with debouncing
- **Active Form**: Implementing workspace change detection
- **Due Date**: 2025-10-26
- **Priority**: ⏫ High
- **Tags**: `#day-5` `#workspace` `#detection` `#debouncing` `#events`
- **Dependencies**: Task 81 (Workspace watcher)
- **Acceptance Criteria**:
  - on_modified(event) method implemented
  - Checks if src_path == workspace.json
  - Debouncing: Only trigger if 5s since last change
  - Stores last_modified timestamp
  - Publishes vault.workspace.updated event
- **Verification**: Close note in Obsidian (triggers workspace.json save)

#### Task 83: Integrate workspace watcher with file watcher
- **Title**: Integrate workspace watcher with file watcher service
- **Active Form**: Integrating workspace watcher with file watcher
- **Due Date**: 2025-10-26
- **Priority**: ⏫ High
- **Tags**: `#day-5` `#workspace` `#integration` `#file-watcher` `#combined`
- **Dependencies**: Task 82 (Change detection)
- **Acceptance Criteria**:
  - Both watchers run in same process
  - Shared RabbitMQ publisher
  - watchdog Observer manages both
  - Separate event handlers for files vs workspace
  - Graceful shutdown for both
- **Verification**:
  ```bash
  python publishers/file_watcher.py
  # Should print: "Watching vault files and workspace.json"
  ```

#### Task 84: Test workspace-triggered commits
- **Title**: Test workspace-triggered commits: Edit note → Close → Wait → Verify commit
- **Active Form**: Testing workspace-triggered commits
- **Due Date**: 2025-10-26
- **Priority**: ⏫ High
- **Tags**: `#day-5` `#workspace` `#testing` `#git` `#end-to-end`
- **Dependencies**: Task 83 (Integration complete)
- **Acceptance Criteria**:
  - Edit note in Obsidian
  - Close note (triggers workspace.json update)
  - Wait 5 seconds
  - Verify commit created
  - Commit includes edited note
  - Workspace.json NOT committed (excluded)
- **Verification**:
  ```bash
  # Edit and close note, wait 5s
  git log -1 --stat
  # Should show .md file, not workspace.json
  ```

---

## Summary Statistics

**Total Tasks**: 84
- Day 0 (Prerequisites): 18 tasks
- Day 1 (RabbitMQ + File Watcher): 15 tasks
- Day 2 (MCP Server): 11 tasks
- Day 3 (MCP Sync + Shadow Cache): 10 tasks
- Day 4 (Agent Rules): 8 tasks
- Day 5 (Git Integration): 8 tasks

**Priority Breakdown**:
- 🔴 Critical: 54 tasks (64%)
- ⏫ High: 25 tasks (30%)
- 🔽 Medium: 5 tasks (6%)

**Tag Categories**:
- Infrastructure: docker, rabbitmq, gcp, firewall
- Development: python, obsidian-plugins, fastapi, git
- Integration: mcp-sync, file-watcher, agents, memory
- Quality: testing, verification, error-handling, validation

**Critical Path**:
1. Day 0: Install all plugins + dev environment
2. Day 1: RabbitMQ operational + File watcher publishing
3. Day 2: MCP server REST API working
4. Day 3: Shadow cache syncing on file changes
5. Day 4: Agents suggesting links/tags
6. Day 5: Git auto-commits working

**Verification Commands Summary**:
- Docker: `docker ps`, `docker logs rabbitmq`
- RabbitMQ: `curl http://localhost:15672`, `rabbitmqadmin list queues`
- Python: `source .venv/bin/activate`, `pip list`
- MCP Server: `curl http://localhost:8000/health`
- SQLite: `sqlite3 metadata.db ".schema"`
- Git: `git log -1`, `git status`

---

## Notes

- All tasks include specific acceptance criteria with measurable outcomes
- Verification commands provided for infrastructure and integration tasks
- Dependencies clearly mapped to enable parallel work where possible
- Error handling and testing emphasized throughout
- Documentation tasks marked as lower priority (can be deferred if time-constrained)
- Critical path ensures core functionality delivered even if some tasks slip

## Related Documents

### Related Files
- [[MVP-PYTHON-STACK-HUB.md]] - Parent hub

