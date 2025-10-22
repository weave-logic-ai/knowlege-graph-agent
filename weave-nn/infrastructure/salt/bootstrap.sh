#!/bin/bash
#
# Weave-NN Developer Environment Bootstrap
#
# Automated setup for new developers
# Supports: Ubuntu, Debian, Fedora, Arch Linux
#
# Usage: sudo bash bootstrap.sh
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SALT_VERSION="3006"
WEAVE_NN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SALT_DIR="${WEAVE_NN_DIR}/infrastructure/salt"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        log_error "Cannot detect OS. /etc/os-release not found."
        exit 1
    fi

    log_info "Detected OS: $OS $OS_VERSION"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

install_salt() {
    log_info "Installing SaltStack..."

    case "$OS" in
        ubuntu|debian)
            # Install Salt on Debian/Ubuntu
            curl -fsSL https://packages.broadcom.com/artifactory/api/security/keypair/SaltProjectKey/public | gpg --dearmor > /usr/share/keyrings/salt-archive-keyring.gpg

            echo "deb [signed-by=/usr/share/keyrings/salt-archive-keyring.gpg arch=amd64] https://packages.broadcom.com/artifactory/saltproject-deb/ stable main" | tee /etc/apt/sources.list.d/salt.list

            apt-get update
            apt-get install -y salt-minion salt-call
            ;;
        fedora)
            # Install Salt on Fedora
            dnf install -y salt-minion
            ;;
        arch)
            # Install Salt on Arch Linux
            pacman -Sy --noconfirm salt
            ;;
        *)
            log_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac

    log_info "SaltStack installed successfully"
}

setup_salt_environment() {
    log_info "Setting up Salt environment..."

    # Create Salt directories if they don't exist
    mkdir -p /srv/salt
    mkdir -p /srv/pillar

    # Symlink our Salt states and pillars
    if [ ! -L /srv/salt/weave-nn ]; then
        ln -sf "${SALT_DIR}/states" /srv/salt/weave-nn
    fi

    if [ ! -L /srv/pillar/weave-nn ]; then
        ln -sf "${SALT_DIR}/pillar" /srv/pillar/weave-nn
    fi

    # Copy top files
    cp "${SALT_DIR}/top.sls" /srv/salt/top.sls
    cp "${SALT_DIR}/pillar/top.sls" /srv/pillar/top.sls

    log_info "Salt environment configured"
}

run_salt_states() {
    log_info "Running Salt states to provision environment..."
    log_info "This may take 10-15 minutes depending on your internet speed..."

    # Run Salt in masterless mode
    salt-call --local state.apply --state-output=mixed

    if [ $? -eq 0 ]; then
        log_info "Salt provisioning completed successfully!"
    else
        log_error "Salt provisioning failed. Check logs above."
        exit 1
    fi
}

verify_installation() {
    log_info "Verifying installation..."

    bash "${SALT_DIR}/scripts/verify-install.sh"

    if [ $? -eq 0 ]; then
        log_info "All components verified successfully!"
    else
        log_warn "Some components failed verification. Please check manually."
    fi
}

show_next_steps() {
    echo ""
    echo "=========================================="
    echo "  Weave-NN Environment Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Log out and log back in (to apply group changes)"
    echo ""
    echo "2. Configure your environment:"
    echo "   cd ~/weave-nn"
    echo "   cp .env.template .env"
    echo "   # Edit .env with your API keys"
    echo ""
    echo "3. Open Obsidian:"
    echo "   ~/Obsidian.AppImage"
    echo "   # Open vault: ~/weave-nn/"
    echo ""
    echo "4. Install Obsidian plugins (manual step):"
    echo "   Settings → Community Plugins → Browse"
    echo "   - Install: Tasks, Local REST API, Mehrmaid, Advanced URI"
    echo ""
    echo "5. Start RabbitMQ:"
    echo "   docker start rabbitmq"
    echo ""
    echo "6. Start N8N:"
    echo "   docker start n8n"
    echo "   # Access: http://localhost:5678"
    echo ""
    echo "7. Activate Python environment:"
    echo "   cd ~/weave-nn"
    echo "   source .venv/bin/activate"
    echo ""
    echo "8. Start development:"
    echo "   See: ~/weave-nn/_planning/phases/phase-5-mvp-week-1.md"
    echo ""
    echo "For help: cat ~/weave-nn/infrastructure/developer-onboarding.md"
    echo ""
}

# Main execution
main() {
    log_info "Starting Weave-NN Developer Environment Bootstrap"

    check_root
    detect_os
    install_salt
    setup_salt_environment
    run_salt_states
    verify_installation
    show_next_steps

    log_info "Bootstrap complete!"
}

main "$@"
