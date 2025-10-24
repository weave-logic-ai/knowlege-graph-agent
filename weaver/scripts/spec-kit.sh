#!/bin/bash
# Spec-Kit Helper Script
# Automates the complete spec-kit workflow

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Phase ID required${NC}"
    echo ""
    echo "Usage: $0 <phase-id>"
    echo ""
    echo "Examples:"
    echo "  $0 phase-6-vault-initialization"
    echo "  $0 phase-7-mcp-server"
    echo ""
    exit 1
fi

PHASE_ID=$1
WEAVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}🚀 Spec-Kit Workflow${NC}"
echo -e "${BLUE}==================${NC}"
echo ""
echo "Phase: $PHASE_ID"
echo "Weaver: $WEAVER_DIR"
echo ""

# Step 1: Generate initial specs
echo -e "${GREEN}Step 1: Generating initial specifications${NC}"
cd "$WEAVER_DIR"
bun run generate-spec "$PHASE_ID"

# Check if generation succeeded
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate specifications${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 Next Step: Spawn Agents in Claude Code${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Copy the 4 Task() commands shown above and paste them in a"
echo "SINGLE message in Claude Code to spawn all agents concurrently."
echo ""
echo "After all agents complete, run:"
echo -e "${GREEN}  bun run sync-tasks-simple ${PHASE_ID/phase-/}${NC}"
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
