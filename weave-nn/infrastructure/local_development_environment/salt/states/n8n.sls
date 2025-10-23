# N8N Docker container setup for Weave-NN

# Create N8N data directory
n8n_data_dir:
  file.directory:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.n8n
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 755
    - makedirs: True
    - require:
      - file: weave_nn_directory

n8n_container:
  docker_container.running:
    - name: n8n
    - image: {{ pillar['weave_nn']['n8n']['docker_image'] }}
    - port_bindings:
      - {{ pillar['weave_nn']['n8n']['port'] }}:5678
    - restart_policy: always
    - environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER={{ pillar['weave_nn']['n8n']['basic_auth']['user'] }}
      - N8N_BASIC_AUTH_PASSWORD={{ pillar['weave_nn']['n8n']['basic_auth']['password'] }}
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
    - binds:
      - {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.n8n:/home/node/.n8n
    - require:
      - service: docker_service
      - file: n8n_data_dir

# Create N8N access notice
n8n_notice:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/N8N-ACCESS.txt
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - contents: |
        # N8N Workflow Automation

        URL: http://localhost:5678
        Username: {{ pillar['weave_nn']['n8n']['basic_auth']['user'] }}
        Password: {{ pillar['weave_nn']['n8n']['basic_auth']['password'] }}

        ## Workflows to Create:

        See: ~/weave-nn/features/n8n-workflow-automation.md

        1. Client Onboarding Workflow
        2. Weekly Report Generator
        3. Knowledge Extraction (on project completion)
        4. GitHub Issue Sync
        5. Meeting Notes → Tasks

        ## Webhook Endpoints:

        Base URL: http://localhost:5678/webhook/

        Examples:
        - POST /webhook/onboard-client
        - POST /webhook/extract-knowledge
        - POST /webhook/sync-github-issues

        ## Data Directory:

        {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.n8n

        ## Management:

        # Start:
        docker start n8n

        # Stop:
        docker stop n8n

        # Logs:
        docker logs -f n8n

        # Restart:
        docker restart n8n
    - require:
      - docker_container: n8n_container
