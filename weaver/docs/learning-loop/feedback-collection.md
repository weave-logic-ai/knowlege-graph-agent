# Feedback Collection System

## Overview

The Feedback Collection System is a core component of Weaver's learning loop. It combines autonomous AI analysis with human feedback to create high-confidence learning signals that drive continuous improvement.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Reflection System                       │
│                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ Autonomous   │───▶│   User       │───▶│ Synthesis  │ │
│  │ Analysis     │    │   Feedback   │    │ & Storage  │ │
│  └──────────────┘    └──────────────┘    └────────────┘ │
│         │                    │                    │       │
│         ▼                    ▼                    ▼       │
│   AI Approaches        User Choice         Enhanced      │
│   Improvements         Satisfaction        Lessons       │
│   Metrics             Preferences          Confidence    │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### 1. FeedbackCollector

Beautiful CLI-based feedback collection with inquirer.

**Features:**
- 5-star satisfaction rating
- A/B testing between approaches
- Improvement suggestions
- Preference signal extraction
- Minimal mode for quick feedback

**Example:**

```typescript
import { FeedbackCollector } from '@weave-nn/weaver/learning-loop';

const collector = new FeedbackCollector({
  skipOnHighSatisfaction: true
});

const feedback = await collector.collect({
  sopId: 'create_api',
  executionId: 'exec_001',
  result: { success: true },
  approaches: [
    {
      id: 'tdd',
      name: 'Test-Driven Development',
      description: 'Write tests first',
      pros: ['High quality', 'Catch bugs early'],
      cons: ['Slower initial development']
    },
    {
      id: 'rapid',
      name: 'Rapid Prototyping',
      description: 'Build quickly, test later',
      pros: ['Very fast', 'Quick feedback'],
      cons: ['Lower quality', 'More bugs']
    }
  ]
});
```

### 2. FeedbackStorage

Persistent storage with claude-flow memory integration.

**Features:**
- Store/retrieve feedback
- Analytics and trends
- Approach preferences
- Satisfaction tracking
- Improvement analysis

**Example:**

```typescript
import { FeedbackStorage } from '@weave-nn/weaver/learning-loop';

const storage = new FeedbackStorage();

// Store feedback
await storage.store(feedback);

// Get analytics
const analytics = await storage.getAnalytics('create_api');
console.log(`Average satisfaction: ${analytics.averageSatisfaction}/5.0`);
console.log(`Trend: ${analytics.satisfactionTrend.join(' → ')}`);

// Get approach preferences
const preferences = await storage.getApproachPreferences('create_api');
preferences.forEach((count, approach) => {
  console.log(`${approach}: ${count} votes`);
});
```

### 3. ReflectionSystem

Combines autonomous analysis with user feedback.

**Features:**
- 4-phase reflection workflow
- Confidence scoring
- Weight calculation
- Recommendation synthesis
- Historical analysis

**Example:**

```typescript
import { reflectionSystem } from '@weave-nn/weaver/learning-loop';

const execution = {
  id: 'exec_001',
  sop: 'create_api',
  success: true,
  duration: 45000,
  errorCount: 0,
  result: { files: ['api.ts', 'api.test.ts'] }
};

// Full reflection with user feedback
const lessons = await reflectionSystem.reflect(execution);

console.log(`User satisfaction: ${lessons.userSatisfaction}/5`);
console.log(`Confidence: ${lessons.confidenceScore}`);
console.log(`Weight: ${lessons.weight}`);
console.log('Recommendations:', lessons.synthesizedRecommendations);
```

## Feedback Flow

### Phase 1: Autonomous Analysis

The AI analyzes the execution and generates:

1. **Multiple Approaches** - Different strategies with pros/cons
2. **Recommended Approach** - Based on execution metrics
3. **Potential Improvements** - Identified optimization opportunities

```typescript
{
  approaches: [
    { id: 'speed_optimized', name: 'Speed Optimized', ... },
    { id: 'quality_optimized', name: 'Quality Optimized', ... },
    { id: 'balanced', name: 'Balanced', ... }
  ],
  recommendedApproach: 'balanced',
  potentialImprovements: [
    'Optimize execution speed',
    'Add more comprehensive error handling'
  ]
}
```

### Phase 2: User Feedback

The system collects human feedback through beautiful CLI prompts:

**1. Satisfaction Rating (Required)**
```
? How satisfied are you with this outcome?
  ⭐⭐⭐⭐⭐ (5) Excellent
  ⭐⭐⭐⭐☆ (4) Good
  ⭐⭐⭐☆☆ (3) Okay
  ⭐⭐☆☆☆ (2) Poor
  ⭐☆☆☆☆ (1) Very Poor
```

**2. Approach Selection (When Multiple Options)**
```
🔀 Approach Comparison

We generated multiple approaches:

A. Test-Driven Development
   Write tests first, then implementation
   Pros: High quality, Good coverage, Catch bugs early
   Cons: Slower initial development, Learning curve
   Effort: 20 minutes

B. Rapid Prototyping
   Build quickly, test later
   Pros: Very fast, Quick feedback, Easy to iterate
   Cons: Lower quality, More bugs, Technical debt
   Effort: 5 minutes

? Which approach worked best?
```

**3. Improvement Suggestions (Optional)**
```
AI suggested improvements:
  1. Add more comprehensive error handling
  2. Improve logging for debugging
  3. Add performance monitoring

? Would you like to suggest improvements? (Y/n)
? Improvement 1 (or press Enter to finish):
```

### Phase 3: Storage

Feedback is stored in claude-flow memory with:
- Full context preservation
- Searchable by SOP
- Aggregatable for analytics
- Preference signal extraction

### Phase 4: Synthesis

The system combines AI + human insights:

**Confidence Calculation:**
```typescript
// High confidence when user agrees with AI
if (user.selectedApproach === ai.recommendedApproach) {
  confidence = 0.95;
} else {
  confidence = 0.6;
}

// Boost for high satisfaction
if (user.satisfactionRating >= 4) confidence += 0.05;

// Reduce for low satisfaction
if (user.satisfactionRating <= 2) confidence -= 0.1;
```

**Weight Calculation:**
```typescript
// User feedback gets 2x weight vs autonomous
const baseWeight = 1.0;
const userMultiplier = 2.0;
const satisfactionMultiplier = rating / 5;

weight = baseWeight * userMultiplier * satisfactionMultiplier;
```

## Preference Signals

The system automatically extracts preference signals from feedback:

| Signal Category | Trigger | Action |
|----------------|---------|--------|
| `approach_preference` | Selected approach with high satisfaction | Prioritize this approach |
| `detail_level` | "more detail", "more concise" | Adjust verbosity |
| `speed_preference` | "faster", "quicker" | Prioritize execution speed |
| `quality_preference` | "quality", "thorough" | Prioritize code quality |
| `testing_preference` | "test", "coverage" | Increase test coverage |
| `documentation_preference` | "document", "comment" | Improve documentation |

## Analytics

### Satisfaction Trends

```typescript
const trend = await storage.getSatisfactionTrend('create_api');
// [3, 4, 4, 5] - showing improvement over time
```

### Top Approaches

```typescript
const analytics = await storage.getAnalytics('create_api');
analytics.topApproaches.forEach(approach => {
  console.log(`${approach.id}: ${approach.count}x (avg: ${approach.avgSatisfaction})`);
});
```

### Common Improvements

```typescript
analytics.commonImprovements.forEach(improvement => {
  console.log(`"${improvement.text}" - requested ${improvement.frequency}x`);
});
```

### Improvement Rate

```typescript
const rate = await storage.getImprovementRate('create_api', 5);
console.log(`Improvement over last 5 executions: ${rate.toFixed(1)}%`);
```

## Integration with SOPs

```typescript
async function executeSOP(sopId: string, sopLogic: () => Promise<any>) {
  const startTime = Date.now();
  let success = false;
  let errorCount = 0;
  let result: any;

  try {
    result = await sopLogic();
    success = true;
  } catch (error) {
    errorCount++;
    result = { error: String(error) };
  }

  const execution = {
    id: `exec_${Date.now()}`,
    sop: sopId,
    success,
    duration: Date.now() - startTime,
    errorCount,
    result
  };

  // Reflect and collect feedback
  const lessons = await reflectionSystem.reflect(execution);

  return { result, lessons };
}
```

## Configuration Options

### FeedbackPromptConfig

```typescript
interface FeedbackPromptConfig {
  minimal?: boolean;                    // Quick 1-2 questions
  skipOnHighSatisfaction?: boolean;     // Skip details if rating >= 4
  customQuestions?: Question[];         // Add custom questions
}
```

### Minimal Mode

For quick feedback collection:

```typescript
const collector = new FeedbackCollector({ minimal: true });
const feedback = await collector.collectMinimal(context);
// Only asks for satisfaction rating
```

## Best Practices

### 1. Always Collect Feedback

```typescript
// ❌ Don't skip reflection
const result = await executeSOP();

// ✅ Always reflect
const { result, lessons } = await executeSOP();
```

### 2. Provide Good Context

```typescript
// ✅ Include helpful context
const feedback = await collector.collect({
  sopId: 'create_api',
  executionId: 'exec_001',
  result: execution.result,
  approaches: generateApproaches(),      // Help user choose
  suggestedImprovements: analyzeIssues() // Guide improvements
});
```

### 3. Act on Feedback

```typescript
// Get top approaches
const preferences = await storage.getApproachPreferences(sopId);
const topApproach = Array.from(preferences.entries())
  .sort((a, b) => b[1] - a[1])[0][0];

// Use in next execution
const lessons = await reflectionSystem.reflect(execution);
if (lessons.userPreferredApproach) {
  // Prioritize user preference in next run
  config.defaultApproach = lessons.userPreferredApproach;
}
```

### 4. Monitor Trends

```typescript
// Check if satisfaction is improving
const trend = await storage.getSatisfactionTrend(sopId);
const recent = trend.slice(-5);
const improving = recent.every((val, idx) =>
  idx === 0 || val >= recent[idx - 1]
);

if (!improving) {
  console.warn('⚠ Satisfaction trend is declining - review needed');
}
```

## Error Handling

The system gracefully handles errors:

```typescript
try {
  const feedback = await collector.collect(context);
} catch (error) {
  if (error.message.includes('user canceled')) {
    // User pressed Ctrl+C
    console.log('Feedback collection canceled');
  } else {
    // Fall back to autonomous analysis
    const lessons = await reflectionSystem.reflectAutonomous(execution);
  }
}
```

## Testing

Run the test suite:

```bash
bun test tests/learning-loop/feedback-system.test.ts
```

Run examples:

```bash
bun run src/learning-loop/example-usage.ts
```

## Memory Storage

Feedback is stored in claude-flow memory:

**Namespace:** `weaver_feedback`

**Key Format:** `feedback_{timestamp}`

**Retrieval:**
```typescript
// By SOP
const feedback = await storage.getFeedbackForSOP('create_api');

// All feedback
const allFeedback = await storage.getAllFeedback();

// Recent feedback
const recent = await storage.getRecentFeedback('create_api', 5);
```

## Future Enhancements

- **Batch Feedback Collection** - Collect feedback for multiple executions
- **Comparative Analysis** - Compare different SOPs side-by-side
- **Automated A/B Testing** - Automatically test different approaches
- **Sentiment Analysis** - Analyze text feedback for deeper insights
- **Predictive Analytics** - Predict user satisfaction before execution
- **Collaborative Filtering** - Learn from other users' preferences

## Summary

The Feedback Collection System creates a powerful learning loop:

1. **AI generates** multiple approaches and suggestions
2. **Human validates** what actually worked
3. **System learns** from the combined insights
4. **Future executions** are automatically improved

This human-in-the-loop approach ensures Weaver continuously adapts to your preferences and delivers increasingly better results over time.
