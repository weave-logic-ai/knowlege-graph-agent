# Git configuration for Weave-NN development

# Set Git config (if not already set)
{% for config_key, config_value in [
    ('user.name', 'Weave-NN Developer'),
    ('core.editor', 'vim'),
    ('init.defaultBranch', 'main'),
    ('pull.rebase', 'false'),
] %}
git_config_{{ config_key|replace('.', '_') }}:
  git.config_set:
    - name: {{ config_key }}
    - value: {{ config_value }}
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - global: True
    - require:
      - pkg: base_packages
{% endfor %}

# Install pre-commit hook
git_pre_commit_hook:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.git/hooks/pre-commit
    - source: salt://weave-nn/files/git-hooks/pre-commit
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 755
    - makedirs: True
    - require:
      - cmd: git_init_vault
