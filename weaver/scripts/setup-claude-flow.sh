#!/bin/bash
# Setup script for Weaver + Claude-Flow integration

set -e

echo "🧵 Setting up Weaver + Claude-Flow Integration"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEAVER_ROOT="$(dirname "$SCRIPT_DIR")"

# 1. Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

if ! command -v weaver &> /dev/null; then
    echo "⚠️  weaver command not found globally"
    echo "   Running npm link..."
    cd "$WEAVER_ROOT"
    npm link
fi
echo "✓ weaver command available: $(weaver --version)"

# Check if claude-flow is installed
if ! command -v claude-flow &> /dev/null; then
    echo "⚠️  claude-flow not found"
    read -p "Install claude-flow@alpha? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g @ruvnet/claude-flow@alpha
    fi
fi

# 2. Configure Claude Desktop MCP
echo ""
echo -e "${BLUE}Configuring Claude Desktop MCP...${NC}"

CLAUDE_CONFIG_DIR="$HOME/.config/claude-desktop"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/config.json"

# Create config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Backup existing config
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    echo "✓ Backed up existing config"
fi

# Ask for vault path
echo ""
read -p "Enter your vault path (or press Enter to skip MCP setup): " VAULT_PATH

if [ -n "$VAULT_PATH" ]; then
    # Expand tilde
    VAULT_PATH="${VAULT_PATH/#\~/$HOME}"
    
    # Get absolute path
    VAULT_PATH="$(cd "$VAULT_PATH" 2>/dev/null && pwd)" || VAULT_PATH="$VAULT_PATH"
    
    # Create MCP config
    MCP_CLI_PATH="$WEAVER_ROOT/dist/mcp-server/cli.js"
    
    cat > "$CLAUDE_CONFIG_FILE" <<EOF
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": ["$MCP_CLI_PATH"],
      "env": {
        "VAULT_PATH": "$VAULT_PATH",
        "SHADOW_CACHE_PATH": "$VAULT_PATH/.shadow-cache.db",
        "LOG_LEVEL": "info"
      }
    }
  }
}
EOF
    
    echo "✓ Created Claude Desktop MCP config at $CLAUDE_CONFIG_FILE"
    echo "  Vault: $VAULT_PATH"
else
    echo "⚠️  Skipped MCP configuration"
fi

# 3. Configure Claude-Flow
echo ""
echo -e "${BLUE}Configuring Claude-Flow...${NC}"

CLAUDE_FLOW_CONFIG_DIR="$HOME/.config/claude-flow"
mkdir -p "$CLAUDE_FLOW_CONFIG_DIR"

read -p "Configure Claude-Flow integration? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > "$CLAUDE_FLOW_CONFIG_DIR/weaver.json" <<EOF
{
  "name": "weaver",
  "type": "mcp-server",
  "enabled": true,
  "config": {
    "command": "node",
    "args": ["$MCP_CLI_PATH"],
    "env": {
      "VAULT_PATH": "${VAULT_PATH:-/path/to/vault}",
      "SHADOW_CACHE_PATH": "${VAULT_PATH:-/path/to/vault}/.shadow-cache.db",
      "LOG_LEVEL": "info"
    }
  },
  "tools": {
    "enabled": [
      "weaver_search_vault",
      "weaver_get_file",
      "weaver_update_metadata",
      "weaver_search_tags",
      "weaver_cultivate",
      "weaver_init_vault"
    ]
  },
  "rules": {
    "auto_cultivate": true,
    "auto_metadata": true,
    "auto_commit": false
  }
}
EOF
    echo "✓ Created Claude-Flow config at $CLAUDE_FLOW_CONFIG_DIR/weaver.json"
fi

# 4. Copy agent rules
echo ""
echo -e "${BLUE}Setting up agent rules...${NC}"

if [ -f "$WEAVER_ROOT/config/agent-rules.yaml" ]; then
    echo "✓ Agent rules available at $WEAVER_ROOT/config/agent-rules.yaml"
else
    echo "⚠️  agent-rules.yaml not found"
fi

# 5. Create .env file
echo ""
echo -e "${BLUE}Creating .env file...${NC}"

if [ ! -f "$WEAVER_ROOT/.env" ]; then
    cat > "$WEAVER_ROOT/.env" <<EOF
# Vault Configuration
VAULT_PATH=${VAULT_PATH:-/path/to/vault}
SHADOW_CACHE_PATH=${VAULT_PATH:-/path/to/vault}/.shadow-cache.db

# MCP Server
MCP_PORT=3000
MCP_HOST=localhost

# Logging
LOG_LEVEL=info
LOG_FILE=logs/weaver.log

# Claude-Flow Integration
CLAUDE_FLOW_ENABLED=true
CLAUDE_FLOW_AUTO_CULTIVATE=true
CLAUDE_FLOW_AUTO_COMMIT=false

# API Keys (optional - for AI features)
# ANTHROPIC_API_KEY=sk-ant-...
# TAVILY_API_KEY=tvly-...
EOF
    echo "✓ Created .env file at $WEAVER_ROOT/.env"
else
    echo "✓ .env file already exists"
fi

# 6. Test setup
echo ""
echo -e "${BLUE}Testing setup...${NC}"

# Test weaver command
if weaver --version > /dev/null 2>&1; then
    echo "✓ weaver CLI: $(weaver --version)"
else
    echo "❌ weaver CLI test failed"
fi

# Test MCP server
if [ -f "$MCP_CLI_PATH" ]; then
    echo "✓ MCP server binary exists: $MCP_CLI_PATH"
else
    echo "❌ MCP server binary not found at $MCP_CLI_PATH"
    echo "   Run: npm run build:cli"
fi

# Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║   ✅ Weaver + Claude-Flow Integration Setup Complete    ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Restart Claude Desktop to load MCP server"
echo "2. Test MCP integration:"
echo "   claude-flow mcp status weaver"
echo ""
echo "3. Start using weaver in Claude Desktop:"
echo "   \"Search my vault for notes about machine learning\""
echo ""
echo "4. Configure agent rules (optional):"
echo "   Edit: $WEAVER_ROOT/config/agent-rules.yaml"
echo ""
echo "5. Update .env with your API keys if using AI features:"
echo "   Edit: $WEAVER_ROOT/.env"
echo ""
echo -e "${GREEN}Happy weaving! 🧵${NC}"
