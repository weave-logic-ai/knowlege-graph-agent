#!/bin/bash
#
# Weave-NN Installation Verification Script
#
# Verifies all components are installed and configured correctly
#

set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

check_command() {
    if command -v "$1" &> /dev/null; then
        version=$($1 --version 2>&1 | head -n 1 || echo "unknown")
        print_pass "$1 is installed ($version)"
        return 0
    else
        print_fail "$1 is NOT installed"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        print_pass "$1 exists"
        return 0
    else
        print_fail "$1 does NOT exist"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        print_pass "$1 exists"
        return 0
    else
        print_fail "$1 does NOT exist"
        return 1
    fi
}

check_docker_container() {
    if docker ps | grep -q "$1"; then
        print_pass "Docker container '$1' is running"
        return 0
    elif docker ps -a | grep -q "$1"; then
        print_warn "Docker container '$1' exists but is not running"
        return 1
    else
        print_fail "Docker container '$1' does NOT exist"
        return 1
    fi
}

# Main verification
print_header "Weave-NN Installation Verification"

# Check base tools
print_header "Base System Tools"
check_command "git"
check_command "curl"
check_command "wget"
check_command "jq"
check_command "sqlite3"

# Check Python
print_header "Python Environment"
check_command "python3.11"
check_command "pip3"

if [ -d "$HOME/weave-nn/.venv" ]; then
    print_pass "Python virtual environment exists"

    # Check venv packages
    if [ -f "$HOME/weave-nn/.venv/bin/pip" ]; then
        installed_packages=$($HOME/weave-nn/.venv/bin/pip list 2>/dev/null | tail -n +3)

        for pkg in fastapi uvicorn pika requests pyyaml watchdog gitpython; do
            if echo "$installed_packages" | grep -iq "^$pkg"; then
                print_pass "Python package '$pkg' is installed"
            else
                print_fail "Python package '$pkg' is NOT installed"
            fi
        done
    fi
else
    print_fail "Python virtual environment NOT found at $HOME/weave-nn/.venv"
fi

# Check Node.js
print_header "Node.js Environment"
check_command "node"
check_command "npm"

# Check Docker
print_header "Docker Environment"
check_command "docker"

if systemctl is-active --quiet docker 2>/dev/null; then
    print_pass "Docker service is running"
else
    print_fail "Docker service is NOT running"
fi

# Check Docker containers
print_header "Docker Containers"
check_docker_container "rabbitmq"
check_docker_container "n8n"

# Check RabbitMQ configuration
if docker ps | grep -q "rabbitmq"; then
    echo ""
    echo "Checking RabbitMQ configuration..."

    if docker exec rabbitmq rabbitmqadmin list exchanges 2>/dev/null | grep -q "weave-nn.events"; then
        print_pass "RabbitMQ exchange 'weave-nn.events' exists"
    else
        print_fail "RabbitMQ exchange 'weave-nn.events' NOT found"
    fi

    for queue in mcp_sync git_auto_commit n8n_workflows agent_rules knowledge_extraction; do
        if docker exec rabbitmq rabbitmqadmin list queues 2>/dev/null | grep -q "$queue"; then
            print_pass "RabbitMQ queue '$queue' exists"
        else
            print_fail "RabbitMQ queue '$queue' NOT found"
        fi
    done
fi

# Check Obsidian
print_header "Obsidian Desktop App"
check_file "$HOME/Obsidian.AppImage"

if [ -x "$HOME/Obsidian.AppImage" ]; then
    print_pass "Obsidian.AppImage is executable"
else
    print_fail "Obsidian.AppImage is NOT executable"
fi

# Check Obsidian vault structure
print_header "Obsidian Vault Structure"
check_dir "$HOME/weave-nn"
check_dir "$HOME/weave-nn/.obsidian"
check_dir "$HOME/weave-nn/_planning"
check_dir "$HOME/weave-nn/features"
check_dir "$HOME/weave-nn/architecture"

# Check configuration files
print_header "Configuration Files"
check_file "$HOME/weave-nn/.env"
check_file "$HOME/weave-nn/.env.template"
check_file "$HOME/weave-nn/.gitignore"

if [ -f "$HOME/weave-nn/.env" ]; then
    if grep -q "your-api-key-here" "$HOME/weave-nn/.env"; then
        print_warn ".env contains template values - update with real API keys"
    else
        print_pass ".env has been customized"
    fi
fi

# Check Git
print_header "Git Repository"
if [ -d "$HOME/weave-nn/.git" ]; then
    print_pass "Git repository initialized"

    if [ -f "$HOME/weave-nn/.git/hooks/pre-commit" ]; then
        print_pass "Git pre-commit hook installed"
    else
        print_fail "Git pre-commit hook NOT installed"
    fi
else
    print_fail "Git repository NOT initialized"
fi

# Check Claude-Flow
print_header "Claude-Flow Installation"
check_dir "$HOME/claude-flow"
check_dir "$HOME/weave-nn/.claude-flow/rules"

for rule in memory_sync node_creation auto_linking auto_tagging update_propagation schema_validation; do
    if [ -f "$HOME/weave-nn/.claude-flow/rules/${rule}.yaml" ]; then
        print_pass "Agent rule '${rule}.yaml' exists"
    else
        print_warn "Agent rule '${rule}.yaml' NOT found"
    fi
done

# Network checks
print_header "Network Services"

# Check RabbitMQ ports
if nc -z localhost 5672 2>/dev/null; then
    print_pass "RabbitMQ AMQP port (5672) is accessible"
else
    print_fail "RabbitMQ AMQP port (5672) is NOT accessible"
fi

if nc -z localhost 15672 2>/dev/null; then
    print_pass "RabbitMQ Management port (15672) is accessible"
else
    print_fail "RabbitMQ Management port (15672) is NOT accessible"
fi

# Check N8N port
if nc -z localhost 5678 2>/dev/null; then
    print_pass "N8N port (5678) is accessible"
else
    print_fail "N8N port (5678) is NOT accessible"
fi

# Summary
print_header "Verification Summary"

echo ""
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical components verified successfully!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some components failed verification. Review errors above.${NC}"
    echo ""
    exit 1
fi
