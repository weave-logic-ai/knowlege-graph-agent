#!/bin/bash
# Weaver build script with optional hard rebuild

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEAVER_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$WEAVER_ROOT"

# Parse flags
HARD_REBUILD=false
LINK=false
QUIET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --hard|-h)
      HARD_REBUILD=true
      shift
      ;;
    --link|-l)
      LINK=true
      shift
      ;;
    --quiet|-q)
      QUIET=true
      shift
      ;;
    --help)
      echo "Usage: bin/build.sh [options]"
      echo ""
      echo "Options:"
      echo "  --hard, -h     Hard rebuild (clean dist first)"
      echo "  --link, -l     Run npm link after build"
      echo "  --quiet, -q    Suppress output"
      echo "  --help         Show this help"
      echo ""
      echo "Examples:"
      echo "  bin/build.sh              # Normal build"
      echo "  bin/build.sh --hard       # Clean and rebuild"
      echo "  bin/build.sh --hard --link # Clean, rebuild, and link globally"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Build function
build() {
  if [ "$HARD_REBUILD" = true ]; then
    echo -e "${BLUE}🧹 Hard rebuild: Cleaning dist/...${NC}"
    rm -rf dist
  fi
  
  echo -e "${BLUE}🔨 Building weaver CLI...${NC}"
  
  if [ "$QUIET" = true ]; then
    npm run build:cli > /dev/null 2>&1
  else
    npm run build:cli
  fi
  
  echo -e "${GREEN}✓ Build complete${NC}"
}

# Link function
link() {
  echo -e "${BLUE}🔗 Linking globally...${NC}"
  npm link
  echo -e "${GREEN}✓ Linked: weaver v$(node -p "require('./package.json').version")${NC}"
}

# Verify function
verify() {
  echo -e "${BLUE}🔍 Verifying build...${NC}"
  
  # Check if dist/cli/bin.js exists
  if [ ! -f "dist/cli/bin.js" ]; then
    echo -e "${RED}✗ dist/cli/bin.js not found${NC}"
    exit 1
  fi
  
  # Check if executable
  if [ ! -x "dist/cli/bin.js" ]; then
    echo -e "${YELLOW}⚠ dist/cli/bin.js not executable${NC}"
    chmod +x dist/cli/bin.js
    echo -e "${GREEN}✓ Fixed permissions${NC}"
  fi
  
  # Check if schema.sql was copied
  if [ ! -f "dist/shadow-cache/schema.sql" ]; then
    echo -e "${YELLOW}⚠ schema.sql not found in dist/${NC}"
  else
    echo -e "${GREEN}✓ schema.sql copied${NC}"
  fi
  
  echo -e "${GREEN}✓ Build verified${NC}"
}

# Main execution
echo ""
echo -e "${BLUE}╔══════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                  ║${NC}"
echo -e "${BLUE}║   🧵 Weaver Build Script        ║${NC}"
echo -e "${BLUE}║                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════╝${NC}"
echo ""

# Run build
build

# Verify build
verify

# Link if requested
if [ "$LINK" = true ]; then
  link
fi

# Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                  ║${NC}"
echo -e "${GREEN}║   ✅ Build Successful            ║${NC}"
echo -e "${GREEN}║                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════╝${NC}"
echo ""

if [ "$LINK" = false ]; then
  echo -e "${YELLOW}Tip: Run 'bin/build.sh --link' to link globally${NC}"
  echo -e "${YELLOW}Or manually: npm link${NC}"
fi

echo ""
