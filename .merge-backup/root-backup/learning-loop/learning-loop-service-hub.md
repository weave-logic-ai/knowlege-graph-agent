# Learning Loop - Feedback Collection System

## 🎯 Overview

The Learning Loop Feedback Collection System is a production-ready module that enables Weaver to learn from user feedback and continuously improve SOP execution quality.

## 🚀 Quick Start

```typescript
import { reflectionSystem } from '@weave-nn/weaver/learning-loop';

// Execute your SOP
const execution = {
  id: 'exec_001',
  sop: 'create_rest_api',
  success: true,
  duration: 45000,
  errorCount: 0,
  result: { files: ['api.ts', 'api.test.ts'] }
};

// Reflect and collect feedback
const lessons = await reflectionSystem.reflect(execution);

console.log(`User satisfaction: ${lessons.userSatisfaction}/5`);
console.log(`Confidence: ${lessons.confidenceScore}`);
console.log('Recommendations:', lessons.synthesizedRecommendations);
```

## 📦 Installation

The module is part of Weaver and requires:

- **inquirer** ✅ Already installed (v12.3.0)
- **@types/inquirer** ✅ Already installed (v9.0.7)
- **claude-flow** - For memory persistence

## 🏗️ Architecture

```
/home/aepod/dev/weave-nn/weaver/src/learning-loop/
├── feedback-types.ts        # TypeScript type definitions
├── feedback-collector.ts    # CLI-based feedback collection
├── feedback-storage.ts      # Persistent storage with claude-flow
├── reflection.ts            # Main reflection system
├── index.ts                # Module exports
├── example-usage.ts        # Usage examples
└── README.md               # This file
```

## 📚 Key Features

### 1. Beautiful CLI Feedback Collection

- ⭐ 5-star satisfaction rating
- 🔀 A/B testing between approaches
- 💡 Improvement suggestions with AI assistance
- 🎯 Automatic preference signal extraction
- ⚡ Minimal mode for quick feedback

### 2. Intelligent Analysis

- 🤖 Autonomous AI analysis
- 👤 Human feedback collection
- 🔄 Synthesis of AI + human insights
- 📊 Confidence scoring
- ⚖️ Weighted learning signals

### 3. Persistent Storage

- 💾 claude-flow memory integration
- 📈 Satisfaction trend tracking
- 🏆 Approach preference analysis
- 📊 Comprehensive analytics
- 🔍 Searchable feedback history

## 🎨 Components

### FeedbackCollector

Collects user feedback through beautiful CLI prompts.

```typescript
import { FeedbackCollector } from '@weave-nn/weaver/learning-loop';

const collector = new FeedbackCollector({
  skipOnHighSatisfaction: true
});

const feedback = await collector.collect({
  sopId: 'create_api',
  executionId: 'exec_001',
  result: { success: true },
  approaches: [/* approach options */],
  suggestedImprovements: [/* AI suggestions */]
});
```

### FeedbackStorage

Persists and retrieves feedback with analytics.

```typescript
import { FeedbackStorage } from '@weave-nn/weaver/learning-loop';

const storage = new FeedbackStorage();

// Store feedback
await storage.store(feedback);

// Get analytics
const analytics = await storage.getAnalytics('create_api');

// Get satisfaction trend
const trend = await storage.getSatisfactionTrend('create_api');
```

### ReflectionSystem

Main system that combines autonomous analysis with user feedback.

```typescript
import { reflectionSystem } from '@weave-nn/weaver/learning-loop';

// Full reflection with user feedback
const lessons = await reflectionSystem.reflect(execution);

// Autonomous only (no user feedback)
const autonomousLessons = await reflectionSystem.reflectAutonomous(execution);

// Get analytics
const analytics = await reflectionSystem.getAnalytics('create_api');
```

## 📊 Feedback Workflow

### Phase 1: Autonomous Analysis

AI analyzes execution and generates:
- Multiple approach options
- Recommended approach
- Potential improvements

### Phase 2: User Feedback

Beautiful CLI prompts collect:
- Satisfaction rating (1-5 stars)
- Approach preference (when applicable)
- Improvement suggestions

### Phase 3: Storage

Feedback is persisted in claude-flow memory:
- Namespace: `weaver_feedback`
- Searchable by SOP
- Aggregatable for analytics

### Phase 4: Synthesis

System combines AI + human insights:
- Calculate confidence score
- Compute learning weight
- Generate recommendations

## 🎯 Usage Examples

### Basic Reflection

```typescript
const execution = {
  id: 'exec_001',
  sop: 'create_component',
  success: true,
  duration: 30000,
  errorCount: 0,
  result: { component: 'Button.tsx' }
};

const lessons = await reflectionSystem.reflect(execution);
```

### Minimal Feedback Mode

```typescript
const collector = new FeedbackCollector({ minimal: true });
const feedback = await collector.collectMinimal(context);
// Only asks for satisfaction rating
```

### Analytics

```typescript
const storage = new FeedbackStorage();

// Get comprehensive analytics
const analytics = await storage.getAnalytics('create_api');
console.log(`Average satisfaction: ${analytics.averageSatisfaction}/5`);
console.log(`Total feedback: ${analytics.totalFeedback}`);

// Get top approaches
analytics.topApproaches.forEach(approach => {
  console.log(`${approach.id}: ${approach.count}x (avg: ${approach.avgSatisfaction})`);
});

// Get satisfaction trend
const trend = await storage.getSatisfactionTrend('create_api');
console.log(`Trend: ${trend.join(' → ')}`);
```

### SOP Integration

```typescript
async function executeSOP(sopId: string, sopLogic: () => Promise<any>) {
  const startTime = Date.now();

  try {
    const result = await sopLogic();

    const execution = {
      id: `exec_${Date.now()}`,
      sop: sopId,
      success: true,
      duration: Date.now() - startTime,
      errorCount: 0,
      result
    };

    // Automatic reflection with feedback
    const lessons = await reflectionSystem.reflect(execution);

    return { result, lessons };
  } catch (error) {
    // Handle errors...
  }
}
```

## 📈 Preference Signals

The system automatically extracts preference signals:

| Category | Trigger | Action |
|----------|---------|--------|
| `approach_preference` | Selected approach | Prioritize in future |
| `detail_level` | "more detail" / "more concise" | Adjust verbosity |
| `speed_preference` | "faster" / "quicker" | Optimize for speed |
| `quality_preference` | "quality" / "thorough" | Optimize for quality |
| `testing_preference` | "test" / "coverage" | Increase testing |
| `documentation_preference` | "document" / "comment" | Improve docs |

## 🧪 Testing

Run the comprehensive test suite:

```bash
# All tests
bun test tests/learning-loop/feedback-system.test.ts

# With coverage
bun test --coverage tests/learning-loop/feedback-system.test.ts

# Run examples
bun run src/learning-loop/example-usage.ts
```

## 📖 Documentation

See [feedback-collection.md](../../docs/learning-loop/feedback-collection.md) for comprehensive documentation.

## 🔧 Configuration

### FeedbackPromptConfig

```typescript
interface FeedbackPromptConfig {
  minimal?: boolean;                    // Quick 1-2 questions
  skipOnHighSatisfaction?: boolean;     // Skip details if rating >= 4
  customQuestions?: Question[];         // Add custom questions
}
```

### Example Configuration

```typescript
const collector = new FeedbackCollector({
  minimal: false,                       // Full feedback mode
  skipOnHighSatisfaction: true,         // Skip details for high ratings
  customQuestions: [
    {
      type: 'confirm',
      name: 'deployable',
      message: 'Is this code production-ready?',
      when: (answers) => answers.satisfaction >= 4
    }
  ]
});
```

## 🎯 Best Practices

### 1. Always Collect Feedback

```typescript
// ❌ Don't skip reflection
const result = await executeSOP();

// ✅ Always reflect
const { result, lessons } = await executeSOPWithReflection();
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
if (topApproach) {
  config.defaultApproach = topApproach;
}
```

### 4. Monitor Trends

```typescript
const trend = await storage.getSatisfactionTrend(sopId);
const improving = trend.slice(-5).every((val, idx) =>
  idx === 0 || val >= trend[idx - 1]
);

if (!improving) {
  console.warn('⚠ Satisfaction declining - review needed');
}
```

## 🚨 Error Handling

The system gracefully handles errors:

```typescript
try {
  const feedback = await collector.collect(context);
} catch (error) {
  if (error.message.includes('user canceled')) {
    console.log('Feedback collection canceled');
  } else {
    // Fall back to autonomous analysis
    const lessons = await reflectionSystem.reflectAutonomous(execution);
  }
}
```

## 📊 Data Storage

Feedback is stored in claude-flow memory:

- **Namespace:** `weaver_feedback`
- **Key Format:** `feedback_{timestamp}`
- **TTL:** No expiration (manual cleanup available)

### Cleanup

```typescript
const storage = new FeedbackStorage();

// Delete feedback older than 90 days
const deletedCount = await storage.cleanupOldFeedback(90);
console.log(`Cleaned up ${deletedCount} old feedback entries`);
```

## 🔮 Future Enhancements

- [ ] Batch feedback collection
- [ ] Comparative analysis across SOPs
- [ ] Automated A/B testing
- [ ] Sentiment analysis
- [ ] Predictive analytics
- [ ] Collaborative filtering

## 🤝 Contributing

This module is part of Weaver's learning loop system. To contribute:

1. Write tests for new features
2. Follow TypeScript best practices
3. Update documentation
4. Ensure backward compatibility

## 📄 License

Part of the Weaver project.

## 🙏 Acknowledgments

Built with:
- **inquirer** - Beautiful CLI prompts
- **chalk** - Terminal styling
- **claude-flow** - Memory persistence

---

**Status:** ✅ Production Ready

**Last Updated:** 2025-01-27

**Maintainer:** Weaver Development Team
