# Claude Code CLI installation for Weave-NN

{% if pillar['weave_nn']['claude_code']['install_method'] == 'npm' %}

claude_code_npm:
  npm.installed:
    - name: '@anthropic-ai/claude-code'
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - require:
      - pkg: nodejs_packages

{% else %}

# Alternative: Install via curl (standalone binary)
claude_code_binary:
  cmd.run:
    - name: curl -fsSL https://claude.ai/download/cli | sh
    - creates: /usr/local/bin/claude
    - require:
      - pkg: base_packages

{% endif %}

# Create Claude Code config directory
claude_code_config_dir:
  file.directory:
    - name: {{ pillar['weave_nn']['user']['home'] }}/.claude
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 700
    - makedirs: True

# Placeholder for API key (user must add manually)
claude_code_env_notice:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/.claude/API-KEY-REQUIRED.txt
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 600
    - contents: |
        # Claude Code API Key Required

        To use Claude Code CLI, you need to authenticate with your Anthropic API key.

        ## Setup:

        1. Get API key from: https://console.anthropic.com/settings/keys

        2. Set environment variable:
           export ANTHROPIC_API_KEY="your-api-key-here"

        3. Or create config file:
           echo "ANTHROPIC_API_KEY=your-api-key-here" > ~/.claude/credentials

        4. Test: claude --version

        See: https://docs.claude.com/en/docs/claude-code
    - require:
      - file: claude_code_config_dir
