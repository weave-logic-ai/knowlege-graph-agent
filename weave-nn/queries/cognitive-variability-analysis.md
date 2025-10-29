---
title: Cognitive Variability Analysis - Dataview Queries
type: documentation
status: in-progress
tags:
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:06.160Z'
keywords:
  - overview
  - prerequisites
  - 'query 1: pattern frequency distribution'
  - 'query 2: pattern timeline'
  - 'query 3: pattern switching detection'
  - 'query 4: date range filter'
  - 'query 5: cognitive variability score'
  - 'query 6: pattern co-occurrence'
  - 'query 7: weekly pattern trends'
  - 'query 8: pattern density by folder'
---
# Cognitive Variability Analysis - Dataview Queries

## Overview

This file contains Dataview queries for analyzing cognitive patterns across your knowledge graph. These queries help identify thinking pattern frequencies, track cognitive variability over time, and detect pattern switching behavior.

## Prerequisites

- Obsidian with Dataview plugin installed and enabled
- Notes tagged with `thinking-pattern` property in YAML frontmatter
- Valid thinking pattern values: `convergent`, `divergent`, `lateral`, `systems`, `critical`, `abstract`

## Query 1: Pattern Frequency Distribution

Shows the frequency of each thinking pattern across all notes.

```dataview
TABLE WITHOUT ID
  thinking-pattern as "Pattern",
  length(rows) as "Count",
  round((length(rows) / length(file.lists)) * 100, 1) + "%" as "Percentage"
FROM ""
WHERE thinking-pattern
GROUP BY thinking-pattern
SORT length(rows) DESC
```

**Usage**: Copy and paste into any note in reading mode to see pattern distribution.

**Example Output**:
```
Pattern      | Count | Percentage
-------------|-------|------------
systems      | 45    | 28.5%
divergent    | 38    | 24.1%
convergent   | 32    | 20.3%
lateral      | 24    | 15.2%
critical     | 15    | 9.5%
abstract     | 4     | 2.5%
```

## Query 2: Pattern Timeline

Displays thinking patterns chronologically to visualize pattern evolution.

```dataview
TABLE WITHOUT ID
  file.link as "Note",
  thinking-pattern as "Pattern",
  dateformat(file.ctime, "yyyy-MM-dd") as "Created",
  dateformat(file.mtime, "yyyy-MM-dd") as "Modified"
FROM ""
WHERE thinking-pattern
SORT file.ctime DESC
LIMIT 50
```

**Usage**: Shows most recent 50 notes with thinking patterns. Adjust LIMIT as needed.

## Query 3: Pattern Switching Detection

Identifies notes where cognitive patterns may have shifted based on modification patterns.

```dataview
TABLE WITHOUT ID
  file.link as "Note",
  thinking-pattern as "Current Pattern",
  dateformat(file.ctime, "yyyy-MM-dd") as "Created",
  dateformat(file.mtime, "yyyy-MM-dd") as "Last Modified",
  round((file.mtime - file.ctime) / (1000 * 60 * 60 * 24), 1) as "Days Since Creation"
FROM ""
WHERE thinking-pattern
  AND file.mtime > file.ctime + dur(1 day)
SORT file.mtime DESC
```

**Interpretation**: Notes modified more than 1 day after creation may indicate pattern evolution or refinement.

## Query 4: Date Range Filter

Analyze patterns within specific time periods.

```dataview
TABLE WITHOUT ID
  file.link as "Note",
  thinking-pattern as "Pattern",
  dateformat(file.ctime, "yyyy-MM-dd") as "Created"
FROM ""
WHERE thinking-pattern
  AND file.ctime >= date("2025-01-01")
  AND file.ctime <= date("2025-12-31")
SORT file.ctime DESC
```

**Customization**: Modify date ranges in WHERE clause:
- `file.ctime >= date("YYYY-MM-DD")` - Start date
- `file.ctime <= date("YYYY-MM-DD")` - End date

## Query 5: Cognitive Variability Score

Calculates diversity of thinking patterns in recent activity.

```dataview
TABLE WITHOUT ID
  "Last 30 Days" as "Period",
  length(rows.thinking-pattern) as "Total Notes",
  length(rows.file.etags) as "Unique Patterns",
  round(length(rows.file.etags) / length(rows.thinking-pattern) * 100, 1) as "Variability %"
FROM ""
WHERE thinking-pattern
  AND file.ctime >= date(today) - dur(30 days)
```

**Interpretation**:
- **Variability < 30%**: Low cognitive diversity (pattern repetition)
- **Variability 30-60%**: Moderate diversity (balanced thinking)
- **Variability > 60%**: High diversity (frequent pattern switching)

## Query 6: Pattern Co-occurrence

Identifies which patterns appear in notes with specific tags or folders.

```dataview
TABLE WITHOUT ID
  thinking-pattern as "Pattern",
  file.folder as "Folder",
  length(rows) as "Count"
FROM ""
WHERE thinking-pattern
GROUP BY thinking-pattern, file.folder
SORT length(rows) DESC
```

**Use Case**: Discover if certain thinking patterns cluster in specific areas of your vault.

## Query 7: Weekly Pattern Trends

Shows thinking pattern usage by week for trend analysis.

```dataview
TABLE WITHOUT ID
  dateformat(file.ctime, "yyyy-'W'WW") as "Week",
  thinking-pattern as "Pattern",
  length(rows) as "Count"
FROM ""
WHERE thinking-pattern
  AND file.ctime >= date(today) - dur(12 weeks)
GROUP BY dateformat(file.ctime, "yyyy-'W'WW"), thinking-pattern
SORT dateformat(file.ctime, "yyyy-'W'WW") DESC
```

**Time Range**: Last 12 weeks. Adjust `dur(N weeks)` as needed.

## Query 8: Pattern Density by Folder

Analyzes which folders have highest cognitive pattern activity.

```dataview
TABLE WITHOUT ID
  file.folder as "Folder",
  length(rows) as "Pattern Notes",
  length(rows.thinking-pattern) as "Total Notes",
  round(length(rows) / length(rows.thinking-pattern) * 100, 1) + "%" as "Pattern Density"
FROM ""
WHERE thinking-pattern
GROUP BY file.folder
SORT length(rows) DESC
```

## Query 9: Recent Pattern Shifts

Detects potential cognitive pattern changes in recently modified notes.

```dataview
TABLE WITHOUT ID
  file.link as "Note",
  thinking-pattern as "Pattern",
  round((date(today) - file.mtime).days, 0) as "Days Since Edit"
FROM ""
WHERE thinking-pattern
  AND file.mtime >= date(today) - dur(7 days)
SORT file.mtime DESC
```

**Use Case**: Weekly review of pattern activity to identify cognitive shifts.

## Query 10: Pattern Maturity Indicator

Analyzes note age versus modification frequency to assess pattern stability.

```dataview
TABLE WITHOUT ID
  file.link as "Note",
  thinking-pattern as "Pattern",
  round((date(today) - file.ctime).days, 0) as "Age (days)",
  round((file.mtime - file.ctime).days, 0) as "Time to Last Edit",
  choice(
    (file.mtime - file.ctime).days < 1, "Fresh",
    (file.mtime - file.ctime).days < 7, "Active",
    (file.mtime - file.ctime).days < 30, "Maturing",
    "Stable"
  ) as "Maturity"
FROM ""
WHERE thinking-pattern
SORT file.ctime DESC
LIMIT 50
```

**Maturity Levels**:
- **Fresh**: Modified within 1 day of creation
- **Active**: Modified within 1 week
- **Maturing**: Modified within 1 month
- **Stable**: No modifications for 30+ days

## Advanced Usage

### Custom Dashboard

Create a note called `Cognitive Dashboard.md` with multiple queries:

```markdown
# Cognitive Pattern Dashboard

## Pattern Distribution
[Query 1 here]

## Recent Activity
[Query 2 here]

## Variability Score
[Query 5 here]

## Pattern Trends
[Query 7 here]
```

### Inline Queries

Use inline Dataview for quick stats in any note:

```markdown
I have used `= length(filter(file.lists, (x) => meta(x).thinking-pattern = "systems"))` systems thinking notes.
```

### DataviewJS for Advanced Analysis

For complex visualizations, use DataviewJS:

```dataviewjs
const pages = dv.pages('"').where(p => p["thinking-pattern"]);
const patterns = {};

for (let page of pages) {
    const pattern = page["thinking-pattern"];
    patterns[pattern] = (patterns[pattern] || 0) + 1;
}

dv.table(
    ["Pattern", "Count", "Bar"],
    Object.entries(patterns)
        .sort((a, b) => b[1] - a[1])
        .map(([pattern, count]) => [
            pattern,
            count,
            "▓".repeat(Math.floor(count / 2))
        ])
);
```

## Troubleshooting

### No Results Returned

**Check**:
1. Dataview plugin is installed and enabled
2. Notes have `thinking-pattern` in YAML frontmatter
3. Pattern values match expected options exactly (case-sensitive)

### Incorrect Counts

**Verify**:
1. YAML syntax is correct (no quotes unless needed)
2. Only one `thinking-pattern` per note
3. No typos in pattern names

### Slow Query Performance

**Optimize**:
1. Limit results with `LIMIT N`
2. Narrow scope with specific folder paths: `FROM "concepts"`
3. Cache results by creating dedicated dashboard notes

## Integration with Cognitive Variability Feature

These queries support the cognitive variability tracking system:

- **F-017**: Queries 1, 5, and 7 provide metrics for pattern diversity tracking
- **Pattern Switching**: Query 3 and 9 detect cognitive shifts
- **Time-Series Analysis**: Query 2 and 7 enable temporal pattern analysis
- **Cognitive Plasticity**: Query 10 measures pattern stability over time

## Example Workflow

1. **Daily Review**: Run Query 9 to see recent pattern activity
2. **Weekly Analysis**: Use Query 7 to track weekly trends
3. **Monthly Report**: Generate Query 5 for cognitive variability metrics
4. **Quarterly Deep Dive**: Combine Queries 1, 6, and 8 for comprehensive analysis

## References

- **Dataview Documentation**: https://blacksmithgu.github.io/obsidian-dataview/
- **Cognitive Variability Feature**: `/home/aepod/dev/weave-nn/weave-nn/features/F-017-cognitive-variability-tracker.md`
- **Thinking Pattern Concept**: `/home/aepod/dev/weave-nn/weave-nn/concepts/cognitive-variability.md`

---

**Last Updated**: 2025-10-23
**Version**: 1.0.0
**Status**: Production Ready

## Related Documents

### Related Files
- [[QUERIES-HUB.md]] - Parent hub

### Similar Content
- [[baseline-2025-10-23.md.md]] - Semantic similarity: 32.7%

