#!/bin/bash
#
# Knowledge Graph Analysis Runner
# Executes complete graph analysis pipeline
#

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="${1:-/home/aepod/dev/weave-nn/weave-nn}"
OUTPUT_DIR="${SCRIPT_DIR}/output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🚀 Starting Knowledge Graph Analysis"
echo "======================================"
echo "Base Directory: $BASE_DIR"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Step 1: Analyze graph
echo "📊 Step 1/4: Analyzing graph structure..."
bun x tsx "$SCRIPT_DIR/analyze-graph.ts" "$BASE_DIR" > "$OUTPUT_DIR/report.json" 2>&1 || true
# Filter out stderr from JSON
if ! jq empty "$OUTPUT_DIR/report.json" 2>/dev/null; then
  echo "⚠️  Extracting JSON from mixed output..."
  grep -A 999999 '^{$' "$OUTPUT_DIR/report.json" > "$OUTPUT_DIR/report.tmp.json" && mv "$OUTPUT_DIR/report.tmp.json" "$OUTPUT_DIR/report.json"
fi
if [ $? -eq 0 ]; then
  echo "✅ Graph analysis complete"
else
  echo "❌ Graph analysis failed"
  exit 1
fi
echo ""

# Step 2: Find orphans
echo "🔍 Step 2/4: Finding orphaned files..."
bun x tsx "$SCRIPT_DIR/find-orphans.ts" "$OUTPUT_DIR/report.json" > "$OUTPUT_DIR/orphans.json" 2>&1 || true
grep -A 999999 '^{$' "$OUTPUT_DIR/orphans.json" > "$OUTPUT_DIR/orphans.tmp.json" && sed -n '1,/^}$/p' "$OUTPUT_DIR/orphans.tmp.json" | head -n -1 > "$OUTPUT_DIR/orphans.json" && echo "}" >> "$OUTPUT_DIR/orphans.json" && rm -f "$OUTPUT_DIR/orphans.tmp.json"
if [ $? -eq 0 ]; then
  echo "✅ Orphan detection complete"
else
  echo "❌ Orphan detection failed"
  exit 1
fi
echo ""

# Step 3: Generate connection suggestions
echo "🔗 Step 3/4: Generating connection suggestions..."
bun x tsx "$SCRIPT_DIR/suggest-connections.ts" "$OUTPUT_DIR/report.json" > "$OUTPUT_DIR/suggestions.json" 2>&1 || true
grep -A 999999 '^{$' "$OUTPUT_DIR/suggestions.json" > "$OUTPUT_DIR/suggestions.tmp.json" && sed -n '1,/^}$/p' "$OUTPUT_DIR/suggestions.tmp.json" | head -n -1 > "$OUTPUT_DIR/suggestions.json" && echo "}" >> "$OUTPUT_DIR/suggestions.json" && rm -f "$OUTPUT_DIR/suggestions.tmp.json"
if [ $? -eq 0 ]; then
  echo "✅ Connection suggestions generated"
else
  echo "❌ Connection suggestion failed"
  exit 1
fi
echo ""

# Step 4: Generate visualization
echo "📈 Step 4/4: Generating graph visualization..."
bun x tsx "$SCRIPT_DIR/visualize-graph.ts" "$OUTPUT_DIR/report.json" "$BASE_DIR/docs/GRAPH-VISUALIZATION.md" 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Visualization generated"
else
  echo "❌ Visualization failed"
  exit 1
fi
echo ""

# Summary
echo "======================================"
echo "✅ Analysis Complete!"
echo ""
echo "📂 Output Files:"
echo "  - $OUTPUT_DIR/report.json"
echo "  - $OUTPUT_DIR/orphans.json"
echo "  - $OUTPUT_DIR/suggestions.json"
echo "  - $BASE_DIR/docs/GRAPH-VISUALIZATION.md"
echo ""
echo "📊 Quick Stats:"
jq -r '"\(.metrics.totalFiles) files, \(.metrics.totalLinks) links, \(.metrics.orphanedFiles) orphans"' "$OUTPUT_DIR/report.json"
echo ""
echo "💡 Next Steps:"
echo "  1. Review orphans.json for priority orphans"
echo "  2. Review suggestions.json for high-confidence connections"
echo "  3. View GRAPH-VISUALIZATION.md in a Mermaid-compatible viewer"
echo "======================================"
