# Claude-Flow v2.7 installation and agent rules setup

claude_flow_clone:
  git.latest:
    - name: {{ pillar['weave_nn']['claude_flow']['git_url'] }}
    - target: {{ pillar['weave_nn']['user']['home'] }}/claude-flow
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - branch: main
    - require:
      - pkg: base_packages

claude_flow_install:
  cmd.run:
    - name: {{ pillar['weave_nn']['python']['venv_path'] }}/bin/pip install -e {{ pillar['weave_nn']['user']['home'] }}/claude-flow
    - runas: {{ pillar['weave_nn']['user']['name'] }}
    - require:
      - git: claude_flow_clone
      - cmd: python_venv

# Create agent rules directory
claude_flow_rules_dir:
  file.directory:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.claude-flow/rules
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 755
    - makedirs: True
    - require:
      - file: weave_nn_directory

# Copy agent rules from infrastructure/salt/files/claude-flow-rules/
claude_flow_memory_sync:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.claude-flow/rules/memory_sync.yaml
    - source: salt://weave-nn/files/claude-flow-rules/memory_sync.yaml
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - require:
      - file: claude_flow_rules_dir

claude_flow_node_creation:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.claude-flow/rules/node_creation.yaml
    - source: salt://weave-nn/files/claude-flow-rules/node_creation.yaml
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - require:
      - file: claude_flow_rules_dir

claude_flow_auto_linking:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.claude-flow/rules/auto_linking.yaml
    - source: salt://weave-nn/files/claude-flow-rules/auto_linking.yaml
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - require:
      - file: claude_flow_rules_dir

claude_flow_auto_tagging:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.claude-flow/rules/auto_tagging.yaml
    - source: salt://weave-nn/files/claude-flow-rules/auto_tagging.yaml
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - require:
      - file: claude_flow_rules_dir

claude_flow_update_propagation:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.claude-flow/rules/update_propagation.yaml
    - source: salt://weave-nn/files/claude-flow-rules/update_propagation.yaml
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - require:
      - file: claude_flow_rules_dir

claude_flow_schema_validation:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.claude-flow/rules/schema_validation.yaml
    - source: salt://weave-nn/files/claude-flow-rules/schema_validation.yaml
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - require:
      - file: claude_flow_rules_dir
