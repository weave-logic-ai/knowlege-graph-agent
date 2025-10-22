# Weave-NN vault structure and configuration

# Copy .env template
weave_nn_env_template:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.env.template
    - source: salt://weave-nn/files/.env.template
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - require:
      - file: weave_nn_directory

# Create .env if it doesn't exist
weave_nn_env:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.env
    - source: salt://weave-nn/files/.env.template
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 600
    - replace: False  # Don't overwrite if exists
    - require:
      - file: weave_nn_env_template

# Create vault structure directories
{% for dir in ['_planning', '_projects', 'features', 'architecture', 'concepts', 'knowledge-base', 'templates'] %}
vault_dir_{{ dir }}:
  file.directory:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/{{ dir }}
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 755
    - makedirs: True
    - require:
      - file: weave_nn_directory
{% endfor %}

# Initialize Git repository if not already initialized
git_init_vault:
  cmd.run:
    - name: git init
    - cwd: {{ pillar['weave_nn']['user']['home'] }}/weave-nn
    - runas: {{ pillar['weave_nn']['user']['name'] }}
    - unless: test -d {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.git
    - require:
      - file: weave_nn_directory

# Create .gitignore
vault_gitignore:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.gitignore
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - contents: |
        # Environment
        .env

        # Python
        .venv/
        __pycache__/
        *.pyc
        *.pyo
        *.egg-info/

        # Node
        node_modules/

        # Obsidian
        .obsidian/workspace.json
        .obsidian/workspace-mobile.json
        .obsidian/cache/

        # N8N
        .n8n/

        # Logs
        *.log

        # System
        .DS_Store
        Thumbs.db
    - require:
      - cmd: git_init_vault
