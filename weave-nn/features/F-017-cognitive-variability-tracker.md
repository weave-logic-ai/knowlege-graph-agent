---
type: feature
feature_id: F-017
status: proposed
priority: medium
tags:
  - cognitive-science
  - monitoring
  - productivity
  - meta-learning
related:
  - "[[cognitive-variability]]"
  - "[[graph-topology-analysis]]"
  - "[[F-016-graph-topology-analyzer]]"
  - "[[F-018-semantic-bridge-builder]]"
created: 2025-10-23
effort_estimate: 10-14 hours
---

# F-017: Cognitive Variability Tracker

## Overview

Real-time system for detecting and monitoring cognitive work phases (feeding, parking, exploration, assembly) based on knowledge graph activity patterns. Provides phase-aware UI adaptations, intervention suggestions, and productivity insights.

## Research Foundation

**Based on**:
- Zettelkasten cognitive workflow (Luhmann, Henrik, Jeannel)
- InfraNodus structural variability analysis
- Ecological diversity principles
- Meta-cognition research

**Key Insights**:
- Cognitive phases follow predictable structural patterns
- Convergent thinking → High clustering coefficient (>0.6)
- Divergent thinking → High betweenness changes (>0.2)
- Optimal productivity requires phase balance (all 4 phases in 30 days)

## User Stories

1. **As a knowledge worker**, I want to know my current cognitive phase so I can choose appropriate activities
2. **As a researcher**, I want alerts when I'm stuck in one phase too long so I can shift modes
3. **As a productivity coach**, I want historical phase data to identify patterns and optimize workflows
4. **As an AI assistant**, I want phase context to adapt retrieval and suggestion strategies

## Functional Requirements

### Phase Detection

**FR-1: Real-Time Phase Classification**
```python
cognitive_phases = {
    'feeding': {
        'indicators': {
            'new_nodes_rate': '>0.2',  # Many new notes
            'new_connections_rate': '<0.1',  # Few links
            'clustering_coefficient': '<0.4',  # Low organization
            'edit_frequency': 'high',
            'session_duration': 'short (30-60 min)'
        },
        'description': 'Rapid knowledge capture, research, reading'
    },

    'parking': {
        'indicators': {
            'new_nodes_rate': '<0.05',  # Few new notes
            'new_connections_rate': '0.1-0.3',  # Moderate linking
            'clustering_coefficient': '0.4-0.6',  # Stable
            'edit_frequency': 'low',
            'session_duration': 'short (15-30 min)'
        },
        'description': 'Notes accessible but not actively worked'
    },

    'exploration': {
        'indicators': {
            'new_nodes_rate': '<0.1',  # Few new notes
            'betweenness_change': '>0.2',  # Many cross-links
            'new_connections_rate': '>0.3',  # High linking
            'graph_distance_traversed': 'high',  # Jumping between clusters
            'session_duration': 'medium (45-90 min)'
        },
        'description': 'Discovering latent connections, bridging gaps'
    },

    'assembly': {
        'indicators': {
            'new_nodes_rate': '<0.05',  # Very few new notes
            'clustering_coefficient': '>0.6',  # High local density
            'hub_formation_rate': 'increasing',  # Creating MOCs
            'edit_depth': 'high',  # Refining existing notes
            'session_duration': 'long (90-180 min)'
        },
        'description': 'Organizing for output, creating structure'
    }
}
```

**FR-2: Multi-Modal Activity Detection**
- Track note creation/edit events
- Monitor link creation patterns
- Analyze session duration and frequency
- Detect navigation patterns (local vs. global jumps)
- **Sampling Rate**: Every 5 minutes during active session

**FR-3: Phase Transition Detection**
```python
def detect_phase_transition(current_metrics, window_size=7):
    # Compare current state to 7-day historical baseline
    baseline = get_baseline_metrics(window_size)

    transitions = []
    if current_metrics['new_nodes_rate'] > baseline['new_nodes_rate'] * 1.5:
        transitions.append('entering_feeding_phase')

    if current_metrics['betweenness_delta'] > 0.2:
        transitions.append('entering_exploration_phase')

    if current_metrics['clustering'] > 0.6 and \
       current_metrics['edit_depth'] > baseline['edit_depth'] * 1.3:
        transitions.append('entering_assembly_phase')

    return transitions
```

### Monitoring and Analytics

**FR-4: Phase Distribution Dashboard**
```yaml
dashboard:
  - widget: phase_timeline
    shows: 30-day calendar with color-coded phases
    colors:
      feeding: orange
      parking: gray
      exploration: blue
      assembly: green

  - widget: phase_balance_pie
    shows: Percentage of time in each phase
    alerts:
      - condition: any_phase > 60%
        message: "Imbalance detected: {phase} dominates"

  - widget: productivity_curve
    shows: Output correlation with phase patterns
    metrics:
      - notes_created
      - connections_made
      - projects_completed

  - widget: cognitive_health_score
    formula: diversity_score * balance_score * transition_smoothness
    target: ">0.7"
```

**FR-5: Historical Pattern Analysis**
```python
def analyze_cognitive_patterns(user_id, days=90):
    sessions = get_user_sessions(user_id, days)

    patterns = {
        'preferred_phase': most_common_phase(sessions),
        'phase_duration_avg': avg_time_per_phase(sessions),
        'transition_frequency': count_transitions(sessions),
        'productive_patterns': correlate_output_with_phases(sessions),
        'anti_patterns': detect_stuck_phases(sessions)
    }

    return patterns
```

**FR-6: Intervention Recommendations**
```python
interventions = {
    'stuck_in_feeding': {
        'condition': 'feeding_phase > 7 days',
        'suggestions': [
            'Start linking: Connect 5 recent notes to existing concepts',
            'Create an organizing MOC for your recent captures',
            'Switch to exploration: Review your structural gap report'
        ],
        'priority': 'HIGH'
    },

    'stuck_in_parking': {
        'condition': 'parking_phase > 14 days AND new_notes_queue > 20',
        'suggestions': [
            'Process backlog: Review oldest 10 unlinked notes',
            'Start new project: Pick a topic for assembly phase'
        ],
        'priority': 'MEDIUM'
    },

    'stuck_in_exploration': {
        'condition': 'exploration_phase > 10 days AND clustering < 0.4',
        'suggestions': [
            'Time to consolidate: Create MOCs for discovered clusters',
            'Move to assembly: Pick strongest cluster for organization'
        ],
        'priority': 'HIGH'
    },

    'stuck_in_assembly': {
        'condition': 'assembly_phase > 14 days AND new_nodes_rate < 0.01',
        'suggestions': [
            'Refresh inputs: Schedule feeding phase session',
            'Explore new areas: Review gap detection for unexplored topics'
        ],
        'priority': 'MEDIUM'
    },

    'phase_imbalance': {
        'condition': 'max(phase_distribution) > 0.6 in 30 days',
        'suggestions': [
            'Balance your workflow: Schedule time for underrepresented phases',
            'Review cognitive health score trends'
        ],
        'priority': 'LOW'
    }
}
```

### Adaptive UI and AI Integration

**FR-7: Phase-Aware UI Modes**
```javascript
ui_adaptations = {
    feeding: {
        view: 'quick_capture',
        features_enabled: [
            'rapid_note_creation',
            'web_clipper',
            'reading_mode',
            'minimal_distraction'
        ],
        suggestions_disabled: true,  // Don't interrupt flow
        search_behavior: 'broad_semantic'
    },

    exploration: {
        view: 'graph_view',
        features_enabled: [
            'gap_detection_highlights',
            'cross_cluster_navigation',
            'betweenness_visualization',
            'related_concepts_sidebar'
        ],
        suggestions_enabled: true,  // Show bridge suggestions
        search_behavior: 'structural_traversal'
    },

    assembly: {
        view: 'outliner',
        features_enabled: [
            'hierarchical_organization',
            'MOC_creation_wizard',
            'bulk_linking_tools',
            'outline_export'
        ],
        suggestions_enabled: true,  // Show organization suggestions
        search_behavior: 'precise_local'
    },

    parking: {
        view: 'dashboard',
        features_enabled: [
            'unprocessed_notes_queue',
            'review_reminders',
            'maintenance_tasks'
        ],
        suggestions_enabled: false,
        search_behavior: 'maintenance_focused'
    }
}
```

**FR-8: AI Retrieval Strategy Adaptation**
```python
def adapt_retrieval_strategy(phase, query):
    if phase == 'feeding':
        # Broad semantic search, don't filter too aggressively
        return semantic_search(query, top_k=20, threshold=0.5)

    elif phase == 'exploration':
        # Graph traversal + Semantic similarity
        semantic_results = semantic_search(query, top_k=10)
        graph_results = graph_traversal(semantic_results, hops=2)
        return merge_and_rank(semantic_results, graph_results)

    elif phase == 'assembly':
        # Precise local search within active cluster
        active_cluster = detect_active_cluster()
        return semantic_search(
            query,
            top_k=10,
            filter_by_cluster=active_cluster,
            threshold=0.7
        )

    elif phase == 'parking':
        # Maintenance-focused: unlinked notes, orphans, outdated
        return {
            'unlinked_notes': find_unlinked_notes(),
            'orphan_clusters': find_isolated_components(),
            'needs_review': find_outdated_notes(days=180)
        }
```

## Technical Architecture

### Components

**1. Activity Monitor** (`/src/cognitive/monitor.py`)
```python
class CognitiveActivityMonitor:
    def __init__(self):
        self.event_buffer = []
        self.metrics_cache = MetricsCache()

    def on_note_created(self, event):
        self.event_buffer.append({
            'type': 'note_created',
            'timestamp': event.timestamp,
            'note_id': event.note_id
        })
        self.update_metrics()

    def on_link_created(self, event):
        self.event_buffer.append({
            'type': 'link_created',
            'timestamp': event.timestamp,
            'source': event.source_id,
            'target': event.target_id,
            'distance': self.compute_graph_distance(
                event.source_id,
                event.target_id
            )
        })
        self.update_metrics()

    def update_metrics(self):
        # Aggregate events over 5-minute window
        window = self.get_recent_events(minutes=5)
        metrics = self.compute_activity_metrics(window)
        self.metrics_cache.store(metrics)
```

**2. Phase Classifier** (`/src/cognitive/classifier.py`)
```python
class PhaseClassifier:
    def __init__(self, model_path=None):
        self.rules = load_phase_rules()
        self.ml_model = load_model(model_path) if model_path else None

    def classify_phase(self, metrics):
        # Rule-based classification
        rule_scores = {
            phase: self.compute_rule_score(phase, metrics)
            for phase in ['feeding', 'parking', 'exploration', 'assembly']
        }

        # If ML model available, ensemble
        if self.ml_model:
            ml_scores = self.ml_model.predict_proba(metrics)
            final_scores = self.ensemble(rule_scores, ml_scores)
        else:
            final_scores = rule_scores

        # Return phase with highest score + confidence
        phase = max(final_scores, key=final_scores.get)
        confidence = final_scores[phase]

        return {
            'phase': phase,
            'confidence': confidence,
            'scores': final_scores
        }
```

**3. Pattern Analyzer** (`/src/cognitive/analyzer.py`)
```python
class CognitivePatternAnalyzer:
    def analyze_patterns(self, user_id, days=90):
        # Retrieve historical phase data
        history = self.db.get_phase_history(user_id, days)

        # Compute pattern metrics
        patterns = {
            'phase_distribution': self.compute_distribution(history),
            'transition_matrix': self.compute_transitions(history),
            'productivity_correlation': self.correlate_with_output(history),
            'temporal_patterns': self.detect_temporal_patterns(history),
            'anomalies': self.detect_anomalies(history)
        }

        return patterns

    def compute_transitions(self, history):
        # Build Markov transition matrix
        transitions = np.zeros((4, 4))  # 4 phases
        phase_to_idx = {'feeding': 0, 'parking': 1, 'exploration': 2, 'assembly': 3}

        for i in range(len(history) - 1):
            from_phase = history[i]['phase']
            to_phase = history[i+1]['phase']
            transitions[phase_to_idx[from_phase]][phase_to_idx[to_phase]] += 1

        # Normalize to probabilities
        row_sums = transitions.sum(axis=1, keepdims=True)
        transitions = transitions / row_sums

        return transitions
```

**4. Intervention Engine** (`/src/cognitive/intervene.py`)
```python
class CognitiveInterventionEngine:
    def check_interventions(self, user_id):
        current_phase = self.get_current_phase(user_id)
        phase_duration = self.get_phase_duration(user_id, current_phase)
        patterns = self.analyzer.analyze_patterns(user_id, days=30)

        interventions = []

        # Check stuck-in-phase conditions
        for condition, intervention in self.intervention_rules.items():
            if self.evaluate_condition(condition, phase_duration, patterns):
                interventions.append(intervention)

        # Prioritize by urgency
        return sorted(interventions, key=lambda x: x['priority'], reverse=True)
```

### Data Models

**Phase Session**:
```typescript
interface PhaseSession {
  session_id: string;
  user_id: string;
  start_time: Date;
  end_time: Date;
  phase: 'feeding' | 'parking' | 'exploration' | 'assembly';
  confidence: number;
  metrics: {
    new_nodes: number;
    new_links: number;
    edits: number;
    graph_distance_traveled: number;
    clustering_coefficient: number;
    betweenness_delta: number;
  };
  transitions: PhaseTransition[];
}
```

**Cognitive Pattern**:
```typescript
interface CognitivePattern {
  user_id: string;
  analysis_period: { start: Date; end: Date };
  phase_distribution: Record<Phase, number>;  // Percentages
  transition_matrix: number[][];
  productivity_scores: Record<Phase, number>;
  health_score: number;
  recommendations: Intervention[];
}
```

### Integration Architecture

```
┌─────────────────┐
│  Obsidian       │
│  Events         │
│  (Create/Edit)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Activity       │
│  Monitor        │
│  (Track)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Metrics        │      │  Graph Topology │
│  Aggregator     │◄─────┤  Analyzer       │
│                 │      │  (Structural)   │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Phase          │
│  Classifier     │
│  (Detect)       │
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  UI Adapter     │  │  Pattern        │
│  (Phase Views)  │  │  Analyzer       │
└─────────────────┘  └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Intervention   │
                     │  Engine         │
                     └─────────────────┘
```

## User Interface

### Dashboard Widgets

**1. Current Phase Indicator**
```
┌─────────────────────────────────────┐
│ Current Phase: EXPLORATION 🔵       │
│ Confidence: 87%                     │
│ Duration: 3 days                    │
│                                     │
│ You're bridging concepts across     │
│ clusters. Keep exploring!           │
└─────────────────────────────────────┘
```

**2. Phase Calendar (30-Day View)**
```
Oct 2025        Feeding | Parking | Exploration | Assembly
  M  T  W  T  F  S  S
  1  2  3  4  5  6  7
  🟠 🟠 🟠 🔵 🔵 🔵 🔵
  8  9 10 11 12 13 14
  🔵 ⚫ ⚫ ⚫ 🟢 🟢 🟢
 15 16 17 18 19 20 21
  🟢 🟢 🟠 🟠 🟠 🔵 🔵
```

**3. Cognitive Health Score**
```
┌─────────────────────────────────────┐
│ Cognitive Health: 0.78 / 1.0 ✅     │
│                                     │
│ ████████████████████░░░░░░░░        │
│                                     │
│ ✓ Good phase diversity              │
│ ✓ Smooth transitions                │
│ ⚠ Spending 62% in exploration       │
│   (Consider more assembly time)     │
└─────────────────────────────────────┘
```

**4. Intervention Alerts**
```
┌─────────────────────────────────────┐
│ 💡 Suggestion (MEDIUM Priority)     │
│                                     │
│ You've been exploring for 10 days.  │
│ Time to consolidate?                │
│                                     │
│ • Create MOCs for discovered gaps   │
│ • Move to assembly phase            │
│                                     │
│ [Dismiss] [Start Assembly]          │
└─────────────────────────────────────┘
```

### CLI Commands

```bash
# Check current phase
weave-nn cognitive status

# Historical analysis
weave-nn cognitive analyze --days 90

# Export patterns
weave-nn cognitive export --format json > patterns.json

# Manual phase override (testing)
weave-nn cognitive set-phase exploration
```

## Testing Strategy

### Unit Tests
- Phase classification accuracy (labeled test data)
- Metric computation correctness
- Intervention condition evaluation

### Integration Tests
- Full tracking pipeline (events → classification → UI)
- Phase transition detection
- Historical pattern analysis

### User Studies
- Validate phase detection with user self-reports (weekly surveys)
- Measure intervention acceptance rate
- Correlate cognitive health score with productivity

## Success Metrics

- **Classification Accuracy**: >80% agreement with user self-reported phases
- **Intervention Acceptance**: >50% of suggestions acted upon within 7 days
- **Cognitive Health Improvement**: 70%+ of users improve from <0.6 to >0.7 within 90 days
- **Phase Balance**: 60%+ of users maintain all 4 phases within 30-day windows

## Rollout Plan

### Phase 1: Tracking (Week 1-2)
- Activity monitoring system
- Basic metric computation
- Phase classification (rule-based)

### Phase 2: Analytics (Week 3-4)
- Historical pattern analysis
- Dashboard widgets
- CLI interface

### Phase 3: Interventions (Week 5-6)
- Intervention engine
- Alert system
- Recommendations

### Phase 4: Adaptive Features (Week 7-8)
- Phase-aware UI modes
- AI retrieval adaptation
- ML-based classification (optional)

## Privacy Considerations

- All cognitive data stored locally (SQLite)
- No cloud sync by default
- User opt-in for aggregated anonymized analytics
- Full data export capability

## Related Features

- [[F-016-graph-topology-analyzer]] - Structural metrics input
- [[F-018-semantic-bridge-builder]] - Exploration phase support
- [[F-019-pattern-library-plasticity]] - Pattern reuse tracking

## References

1. Luhmann (1992) - Zettelkasten Workflow
2. Henrik & Jeannel - PhD Case Studies
3. InfraNodus (2024) - Structural Variability
4. Csikszentmihalyi (1990) - Flow States
