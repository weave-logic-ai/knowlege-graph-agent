---
type: feature
feature_id: F-018
status: proposed
priority: high
tags:
  - automation
  - ai-assisted
  - gap-filling
  - link-prediction
related:
  - "[[structural-gap-detection]]"
  - "[[betweenness-centrality]]"
  - "[[F-016-graph-topology-analyzer]]"
  - "[[F-017-cognitive-variability-tracker]]"
created: 2025-10-23
effort_estimate: 12-16 hours
---

# F-018: Semantic Bridge Builder

## Overview

AI-powered system for automatically detecting structural gaps in knowledge graphs and suggesting high-quality semantic bridges (concepts or links) to fill them. Combines graph topology analysis with semantic similarity to generate actionable, context-aware recommendations.

## Research Foundation

**Based on**:
- Structural gap detection (InfraNodus)
- Link prediction in knowledge graphs (Liben-Nowell & Kleinberg)
- Kleinberg's inverse-square navigability
- Semantic similarity via embeddings (GraphSAGE, RotatE)

**Key Insights**:
- Bridge gaps (isolated communities) have highest impact
- Shortcut gaps follow inverse-square distribution (r=2)
- Semantic similarity + Structural benefit = Optimal gap score
- User acceptance rate: 60%+ for high-scored suggestions

## User Stories

1. **As a knowledge worker**, I want automatic suggestions for missing connections so I don't have to manually hunt for gaps
2. **As a researcher**, I want high-value bridge concepts identified so I can prioritize which gaps to fill first
3. **As a curator**, I want gap-filling recommendations validated against semantic coherence so I avoid spurious links
4. **As an explorer**, I want discovery of latent relationships between distant concepts that I might have missed

## Functional Requirements

### Gap Detection and Scoring

**FR-1: Multi-Type Gap Detection**
```python
gap_types = {
    'bridge_gap': {
        'detector': detect_bridge_gaps,
        'priority_weight': 0.4,
        'description': 'Isolated communities needing connection'
    },
    'shortcut_gap': {
        'detector': detect_shortcut_gaps,
        'priority_weight': 0.3,
        'description': 'Long paths needing shortcuts'
    },
    'hierarchy_gap': {
        'detector': detect_hierarchy_gaps,
        'priority_weight': 0.2,
        'description': 'Missing intermediate abstractions'
    },
    'orphan_gap': {
        'detector': detect_orphan_gaps,
        'priority_weight': 0.1,
        'description': 'Disconnected components'
    }
}
```

**FR-2: Comprehensive Gap Scoring**
```python
def score_gap(gap, graph, user_context):
    # Structural impact (40%)
    betweenness_increase = estimate_betweenness_potential(gap, graph)
    path_reduction = estimate_path_length_improvement(gap, graph)
    structural_score = 0.6 * betweenness_increase + 0.4 * path_reduction

    # Semantic quality (30%)
    semantic_similarity = compute_semantic_similarity(
        gap['source'], gap['target'], embeddings
    )
    topic_coherence = assess_topic_coherence(gap, graph)
    semantic_score = 0.7 * semantic_similarity + 0.3 * topic_coherence

    # Feasibility (20%)
    creation_effort = estimate_creation_effort(gap)
    user_expertise = assess_user_expertise_match(gap, user_context)
    feasibility_score = (1 - creation_effort) * 0.5 + user_expertise * 0.5

    # Novelty (10%)
    cross_domain_span = measure_cross_domain_degree(gap, graph)
    novelty_score = cross_domain_span

    total_score = (
        0.4 * structural_score +
        0.3 * semantic_score +
        0.2 * feasibility_score +
        0.1 * novelty_score
    )

    return {
        'total_score': total_score,
        'structural': structural_score,
        'semantic': semantic_score,
        'feasibility': feasibility_score,
        'novelty': novelty_score
    }
```

**FR-3: Dynamic Priority Tiers**
```yaml
priority_tiers:
  critical:  # Score > 0.8
    action: "Create within 1 week"
    notification: immediate
    ui_prominence: high_visibility_banner

  high:  # Score 0.6-0.8
    action: "Create within 1 month"
    notification: weekly_digest
    ui_prominence: sidebar_suggestion

  medium:  # Score 0.4-0.6
    action: "Create when working in area (3 months)"
    notification: monthly_report
    ui_prominence: context_menu

  low:  # Score < 0.4
    action: "Defer or archive"
    notification: quarterly_review
    ui_prominence: hidden_by_default
```

### Bridge Suggestion Generation

**FR-4: Semantic Bridge Concept Generation**
```python
def generate_bridge_concepts(gap, graph, llm):
    """
    For bridge gaps between communities, generate intermediate concepts
    """
    comm_a, comm_b = gap['communities']

    # Extract representative concepts from each community
    concepts_a = sample_representative_concepts(comm_a, n=10)
    concepts_b = sample_representative_concepts(comm_b, n=10)

    # Generate bridge concept using LLM
    prompt = f"""
    I have two conceptual clusters in a knowledge graph:

    Cluster A (topics): {', '.join(concepts_a)}
    Cluster B (topics): {', '.join(concepts_b)}

    Suggest 3 intermediate concepts that naturally bridge these clusters.
    For each, provide:
    1. Concept name
    2. Brief description (1-2 sentences)
    3. How it connects to Cluster A
    4. How it connects to Cluster B
    5. Practical value/use case
    """

    suggestions = llm.generate(prompt, n=3)

    # Validate against semantic embeddings
    validated = []
    for suggestion in suggestions:
        similarity_a = avg_cosine_similarity(
            suggestion['embedding'], [get_embedding(c) for c in concepts_a]
        )
        similarity_b = avg_cosine_similarity(
            suggestion['embedding'], [get_embedding(c) for c in concepts_b]
        )

        # Good bridge: moderately similar to both (0.5-0.7)
        if 0.5 < similarity_a < 0.7 and 0.5 < similarity_b < 0.7:
            validated.append({
                **suggestion,
                'validation_score': (similarity_a + similarity_b) / 2
            })

    return sorted(validated, key=lambda x: x['validation_score'], reverse=True)
```

**FR-5: Link Suggestion Generation**
```python
def generate_link_suggestions(gap, graph):
    """
    For shortcut and orphan gaps, suggest direct links
    """
    source, target = gap['source'], gap['target']

    # Compute link score
    semantic_sim = compute_semantic_similarity(source, target)
    path_reduction = current_path_length - 1  # Direct link = 1 hop

    link_score = 0.6 * semantic_sim + 0.4 * (path_reduction / current_path_length)

    # Generate relationship label
    relationship = infer_relationship_type(source, target, graph)

    return {
        'type': 'direct_link',
        'source': source,
        'target': target,
        'relationship': relationship,
        'score': link_score,
        'impact': {
            'path_reduction': path_reduction,
            'paths_affected': count_affected_paths(source, target, graph)
        }
    }
```

**FR-6: Hierarchy MOC Suggestions**
```python
def generate_moc_suggestions(gap, graph):
    """
    For hierarchy gaps, suggest intermediate MOCs
    """
    parent, children_cluster = gap['parent'], gap['children']

    # Infer common topic from children
    topic = infer_common_topic(children_cluster, embeddings, llm)

    # Suggest MOC structure
    moc = {
        'type': 'intermediate_moc',
        'title': f"{topic} - Overview",
        'parent': parent,
        'children': children_cluster,
        'content_outline': generate_moc_outline(children_cluster, llm),
        'estimated_size': estimate_moc_complexity(children_cluster)
    }

    return moc
```

### User Interface and Interaction

**FR-7: Interactive Gap Browser**
```typescript
interface GapBrowserUI {
  filters: {
    gap_type: GapType[];
    priority_tier: PriorityTier[];
    domain: string[];
    min_score: number;
  };

  view_modes: {
    list: Gap[];  // Sorted by score
    graph: GapVisualization;  // Graph view with gaps highlighted
    matrix: CommunityMatrix;  // Cross-community connection heatmap
  };

  actions: {
    accept_suggestion: (gap_id: string) => void;
    reject_suggestion: (gap_id: string, reason: string) => void;
    defer_suggestion: (gap_id: string, until: Date) => void;
    modify_suggestion: (gap_id: string, modifications: any) => void;
  };
}
```

**FR-8: In-Context Suggestions**
```yaml
contextual_triggers:
  - trigger: user_viewing_note
    condition: note_in_isolated_cluster
    action: show_bridge_suggestions_to_main_graph

  - trigger: user_creating_link
    condition: link_distance > 3_hops
    action: suggest_intermediate_concepts

  - trigger: user_creating_moc
    condition: child_count > 15
    action: suggest_sub_moc_breakdown

  - trigger: exploration_phase_active
    condition: betweenness_changing
    action: highlight_gap_opportunities
```

**FR-9: One-Click Gap Filling**
```python
def one_click_fill_gap(gap_id, suggestion_id, user):
    gap = get_gap(gap_id)
    suggestion = get_suggestion(suggestion_id)

    if suggestion['type'] == 'new_concept':
        # Create new note with template
        note = create_note_from_template(
            title=suggestion['title'],
            content=suggestion['content_outline'],
            tags=suggestion['tags'],
            links={
                'to_cluster_a': suggestion['cluster_a_links'],
                'to_cluster_b': suggestion['cluster_b_links']
            }
        )

        # Update graph
        graph.add_node(note.id)
        for link in suggestion['all_links']:
            graph.add_edge(note.id, link['target'])

    elif suggestion['type'] == 'direct_link':
        # Create wikilink between existing notes
        add_wikilink(suggestion['source'], suggestion['target'],
                     relationship=suggestion['relationship'])

    # Track outcome
    log_gap_fill_action(gap_id, suggestion_id, user, success=True)

    # Recompute gap scores (some gaps may be resolved)
    invalidate_gap_cache()
    recompute_impacted_gaps(gap)
```

### Validation and Learning

**FR-10: Suggestion Quality Tracking**
```python
def track_suggestion_quality(gap_id, suggestion_id, outcome):
    """
    Track user acceptance/rejection to improve future suggestions
    """
    record = {
        'gap_id': gap_id,
        'suggestion_id': suggestion_id,
        'outcome': outcome,  # 'accepted', 'rejected', 'modified', 'deferred'
        'timestamp': now(),
        'gap_scores': get_gap_scores(gap_id),
        'user_feedback': outcome.get('reason', None)
    }

    db.store(record)

    # Analyze patterns
    if db.count_records(days=30) > 100:
        analyze_acceptance_patterns()
        retrain_suggestion_model()
```

**FR-11: Impact Measurement**
```python
def measure_gap_fill_impact(gap_id, days_after=7):
    """
    Measure actual vs. predicted impact after gap filling
    """
    gap = get_historical_gap(gap_id)
    prediction = gap['predicted_impact']

    # Recompute metrics
    current_metrics = compute_topology_metrics(graph)

    actual_impact = {
        'betweenness_increase': (
            current_metrics['betweenness'][gap['filled_node']] -
            gap['baseline_metrics']['betweenness']
        ),
        'path_length_reduction': (
            gap['baseline_metrics']['avg_path_length'] -
            current_metrics['avg_path_length']
        ),
        'small_worldness_change': (
            current_metrics['small_worldness'] -
            gap['baseline_metrics']['small_worldness']
        )
    }

    # Compare prediction accuracy
    accuracy = {
        metric: abs(actual_impact[metric] - prediction[metric]) / prediction[metric]
        for metric in actual_impact
    }

    return {
        'actual': actual_impact,
        'predicted': prediction,
        'accuracy': accuracy
    }
```

## Technical Architecture

### Components

**1. Gap Detection Engine** (`/src/bridges/detector.py`)
```python
class GapDetector:
    def __init__(self, graph, embeddings):
        self.graph = graph
        self.embeddings = embeddings
        self.detectors = {
            'bridge': BridgeGapDetector(),
            'shortcut': ShortcutGapDetector(),
            'hierarchy': HierarchyGapDetector(),
            'orphan': OrphanGapDetector()
        }

    def detect_all_gaps(self):
        gaps = []
        for gap_type, detector in self.detectors.items():
            detected = detector.detect(self.graph, self.embeddings)
            for gap in detected:
                gap['type'] = gap_type
                gap['score'] = self.score_gap(gap)
            gaps.extend(detected)

        return sorted(gaps, key=lambda x: x['score'], reverse=True)
```

**2. Suggestion Generator** (`/src/bridges/generator.py`)
```python
class BridgeSuggestionGenerator:
    def __init__(self, llm, embeddings):
        self.llm = llm
        self.embeddings = embeddings

    def generate_suggestions(self, gap, graph, n=3):
        if gap['type'] == 'bridge_gap':
            return self.generate_bridge_concepts(gap, graph, n)
        elif gap['type'] == 'shortcut_gap':
            return self.generate_link_suggestions(gap, graph, n)
        elif gap['type'] == 'hierarchy_gap':
            return self.generate_moc_suggestions(gap, graph, n)
        elif gap['type'] == 'orphan_gap':
            return self.generate_orphan_connections(gap, graph, n)
```

**3. Quality Validator** (`/src/bridges/validator.py`)
```python
class SuggestionValidator:
    def validate(self, suggestion, gap, graph):
        checks = {
            'semantic_coherence': self.check_semantic_coherence(suggestion),
            'structural_validity': self.check_structural_validity(suggestion, graph),
            'novelty': self.check_novelty(suggestion, graph),
            'user_expertise_match': self.check_expertise_match(suggestion)
        }

        overall_quality = np.mean(list(checks.values()))

        return {
            'valid': overall_quality > 0.6,
            'quality_score': overall_quality,
            'checks': checks
        }
```

**4. Learning System** (`/src/bridges/learner.py`)
```python
class SuggestionLearner:
    def __init__(self):
        self.acceptance_model = None

    def train(self, historical_data):
        # Features: gap scores, suggestion properties, user context
        X = self.extract_features(historical_data)
        y = [record['outcome'] == 'accepted' for record in historical_data]

        # Train binary classifier
        self.acceptance_model = RandomForestClassifier()
        self.acceptance_model.fit(X, y)

    def predict_acceptance_probability(self, gap, suggestion, user_context):
        features = self.extract_features_single(gap, suggestion, user_context)
        prob = self.acceptance_model.predict_proba([features])[0][1]
        return prob
```

### Data Flow

```
┌─────────────────┐
│  Knowledge      │
│  Graph          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Gap Detector   │◄─────┤  Embeddings     │
│  (All Types)    │      │  (Semantic)     │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Gap Scorer     │
│  (Multi-Criteria)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Suggestion     │◄─────┤  LLM            │
│  Generator      │      │  (Bridge Concepts)
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Validator      │
│  (Quality Check)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  User Interface │      │  Learning       │
│  (Present)      │─────►│  System         │
└────────┬────────┘      │  (Feedback)     │
         │               └─────────────────┘
         ▼
┌─────────────────┐
│  Action         │
│  (Fill Gap)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Impact         │
│  Measurement    │
└─────────────────┘
```

## Integration Points

### With [[F-016-graph-topology-analyzer]]
- Consume topology metrics for gap detection
- Trigger gap detection on topology degradation alerts
- Share betweenness centrality data

### With [[F-017-cognitive-variability-tracker]]
- Suggest gaps during exploration phase
- Suppress suggestions during feeding phase
- Prioritize consolidation during assembly phase

### With [[F-019-pattern-library-plasticity]]
- Use high-betweenness patterns as bridge templates
- Track which pattern types fill gaps effectively
- Share gap-filling success data

## Performance Targets

| Graph Size | Gap Detection | Suggestion Generation | Validation | Total |
|------------|--------------|----------------------|------------|-------|
| <1000 | <10 sec | <5 sec | <2 sec | <20 sec |
| 1000-5000 | <45 sec | <15 sec | <5 sec | <70 sec |
| 5000-10000 | <3 min | <30 sec | <10 sec | <4 min |

## Success Metrics

- **Suggestion Acceptance Rate**: >60% for high-priority gaps (score >0.6)
- **Impact Prediction Accuracy**: <20% error on betweenness increase predictions
- **User Satisfaction**: >4.0/5.0 on suggestion quality surveys
- **Graph Health Improvement**: 80%+ of users see S increase by >0.5 within 90 days

## Testing Strategy

### Unit Tests
- Gap detection algorithms
- Scoring functions
- Suggestion generation
- Semantic validation

### Integration Tests
- Full pipeline (detect → score → suggest → validate)
- User action simulation
- Impact measurement

### A/B Testing
- Random vs. scored suggestion ordering
- LLM-generated vs. template-based concepts
- Acceptance rate by gap type

## Rollout Plan

### Phase 1: Detection (Week 1-2)
- Gap detection algorithms
- Scoring framework
- Basic CLI interface

### Phase 2: Suggestions (Week 3-4)
- LLM integration for concept generation
- Link suggestion logic
- MOC suggestions

### Phase 3: UI (Week 5-6)
- Gap browser interface
- In-context suggestions
- One-click filling

### Phase 4: Learning (Week 7-8)
- Quality tracking
- Impact measurement
- Acceptance model training

## Related Features

- [[F-016-graph-topology-analyzer]] - Gap detection input
- [[F-017-cognitive-variability-tracker]] - Phase-aware suggestions
- [[F-019-pattern-library-plasticity]] - Pattern-based bridges

## References

1. Liben-Nowell & Kleinberg (2007) - Link Prediction
2. Kleinberg (2000) - Navigability Theorem
3. InfraNodus (2024) - Structural Gap Analysis
4. GraphSAGE - Inductive Node Embeddings
