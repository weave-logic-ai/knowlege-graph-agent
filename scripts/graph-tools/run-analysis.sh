#!/bin/bash
# Knowledge Graph Analysis Runner
# Executes all analysis tools and generates comprehensive report

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Knowledge Graph Analysis Suite                          ║"
echo "║   Hive Mind Collective Intelligence                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed"
    echo "   Install from: https://bun.sh"
    exit 1
fi

cd "$SCRIPT_DIR"

echo "📊 Step 1/2: Analyzing link structure..."
echo "────────────────────────────────────────────────────────────"
bun run analyze-links.ts
echo ""

echo "🔍 Step 2/2: Finding semantic connections..."
echo "────────────────────────────────────────────────────────────"
bun run find-connections.ts
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Analysis Complete!                                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📂 Reports saved to:"
echo "   $SCRIPT_DIR/reports/"
echo ""
echo "📖 Next steps:"
echo "   1. Review JSON reports for connection suggestions"
echo "   2. Implement high-confidence links manually"
echo "   3. Add frontmatter metadata to files"
echo "   4. Re-run analysis to validate improvements"
echo ""
echo "📚 Full strategy: /docs/hive-mind/reconnection-strategy.md"
echo ""
