---
type: feature
feature_id: F-019
status: proposed
priority: medium
tags:
  - meta-learning
  - pattern-library
  - continual-learning
  - knowledge-transfer
related:
  - "[[sparse-memory-finetuning]]"
  - "[[cognitive-variability]]"
  - "[[F-016-graph-topology-analyzer]]"
  - "[[F-018-semantic-bridge-builder]]"
created: 2025-10-23
effort_estimate: 14-18 hours
---

# F-019: Pattern Library Plasticity

## Overview

Adaptive system for extracting, consolidating, and transferring reusable patterns across projects using sparse memory fine-tuning and meta-learning techniques. Implements Elastic Weight Consolidation (EWC) to preserve critical patterns while enabling plasticity for project-specific adaptations.

## Research Foundation

**Based on**:
- Elastic Weight Consolidation (Kirkpatrick et al., PNAS 2017)
- Meta-learning (MAML - Finn et al., ICML 2017)
- Case-Based Reasoning (Shepperd, 2003)
- Transfer learning for knowledge graphs (Hu et al., ICLR 2020)

**Key Insights**:
- Fisher Information identifies reusable vs. project-specific patterns
- 70-80% retention achievable across 5+ sequential projects
- High-betweenness patterns → High Fisher importance (preserve)
- Meta-learning enables 60-70% performance with 5-10 examples

## User Stories

1. **As a consultant**, I want patterns from past projects automatically suggested in new projects to reduce duplicated effort
2. **As a knowledge architect**, I want to identify which patterns are universally applicable vs. domain-specific
3. **As a project manager**, I want to measure pattern reuse rates to quantify efficiency gains
4. **As a researcher**, I want the system to learn from successes and failures, improving recommendations over time

## Functional Requirements

### Pattern Extraction and Consolidation

**FR-1: Automatic Pattern Detection**
```python
def extract_patterns_from_project(project_graph, embeddings):
    """
    Identify reusable patterns in completed project
    """
    candidates = []

    # 1. High-betweenness subgraphs (bridge patterns)
    bc = nx.betweenness_centrality(project_graph)
    high_bc_nodes = [n for n, score in bc.items() if score > 0.2]

    for node in high_bc_nodes:
        subgraph = extract_k_hop_subgraph(project_graph, node, k=2)
        pattern = {
            'type': 'bridge_pattern',
            'core_concept': node,
            'subgraph': subgraph,
            'betweenness': bc[node],
            'domain_tags': get_domain_tags(subgraph),
            'structural_signature': compute_graph_signature(subgraph)
        }
        candidates.append(pattern)

    # 2. High-clustering subgraphs (specialized patterns)
    communities = detect_communities(project_graph)
    for community in communities:
        if len(community) >= 5:  # Minimum size
            clustering = nx.average_clustering(
                project_graph.subgraph(community)
            )
            if clustering > 0.6:
                pattern = {
                    'type': 'cluster_pattern',
                    'concepts': community,
                    'clustering': clustering,
                    'domain_tags': get_domain_tags(community),
                    'common_theme': infer_theme(community, embeddings)
                }
                candidates.append(pattern)

    # 3. Recurring motifs (structural patterns)
    motifs = find_frequent_motifs(project_graph, min_frequency=3)
    for motif in motifs:
        pattern = {
            'type': 'motif_pattern',
            'structure': motif['structure'],
            'frequency': motif['frequency'],
            'instances': motif['instances'],
            'abstraction': abstract_motif(motif, embeddings)
        }
        candidates.append(pattern)

    return candidates
```

**FR-2: Pattern Abstraction and Generalization**
```python
def abstract_pattern(pattern, llm):
    """
    Convert project-specific pattern to reusable template
    """
    # Extract domain-independent structure
    structure = pattern['subgraph']

    # Generate abstraction using LLM
    prompt = f"""
    I have a pattern from a {pattern['domain']} project:

    Core concept: {pattern['core_concept']}
    Related concepts: {pattern['related_concepts']}
    Relationships: {pattern['relationships']}

    Create a domain-independent template:
    1. Abstract concept names (replace specific terms with placeholders)
    2. Identify invariant relationships (always present)
    3. Identify optional components (context-dependent)
    4. Provide applicability conditions (when to use this pattern)
    """

    abstracted = llm.generate(prompt)

    return {
        **pattern,
        'abstraction': abstracted,
        'placeholders': extract_placeholders(abstracted),
        'invariants': identify_invariants(pattern),
        'optionals': identify_optionals(pattern)
    }
```

**FR-3: Pattern Library Organization**
```python
class PatternLibrary:
    def __init__(self):
        self.patterns = {
            'universal': [],  # High Fisher, high betweenness
            'domain_specific': {},  # Indexed by domain
            'deprecated': [],  # Low usage, outdated
            'experimental': []  # Recently added, not validated
        }

        self.fisher_importance = {}  # Pattern ID → Fisher score
        self.usage_stats = {}  # Pattern ID → reuse count

    def add_pattern(self, pattern, source_project):
        # Compute Fisher importance (if embeddings available)
        if self.has_embeddings():
            fisher_score = self.compute_fisher_importance(pattern)
            self.fisher_importance[pattern['id']] = fisher_score

            # Classify by Fisher score and betweenness
            if fisher_score > 0.5 and pattern.get('betweenness', 0) > 0.2:
                category = 'universal'
            else:
                category = 'domain_specific'
                domain = pattern['domain_tags'][0]
                if domain not in self.patterns['domain_specific']:
                    self.patterns['domain_specific'][domain] = []
                self.patterns['domain_specific'][domain].append(pattern)
        else:
            # Fallback: use experimental category
            category = 'experimental'

        self.patterns[category].append(pattern)

    def compute_fisher_importance(self, pattern):
        """
        Fisher Information for pattern embeddings
        Measures how critical pattern is for past projects
        """
        # Get embedding for pattern concept
        embedding = self.get_pattern_embedding(pattern)

        # Compute Fisher diagonal approximation
        # F_i = E[(∂log P(x|θ) / ∂θ_i)²]
        fisher_diagonal = self.fisher_approximation(embedding)

        return np.mean(fisher_diagonal)
```

### Sparse Memory Fine-Tuning

**FR-4: Fisher Information Tracking**
```python
class FisherTracker:
    def __init__(self):
        self.fisher_matrices = {}  # Project ID → Fisher matrix
        self.optimal_params = {}  # Project ID → optimal embeddings

    def compute_fisher_after_project(self, project_id, model, data):
        """
        Compute Fisher Information Matrix after project completion
        """
        # Accumulate gradients
        fisher_diagonal = torch.zeros_like(list(model.parameters())[0])

        model.eval()
        for batch in data:
            model.zero_grad()
            output = model(batch)
            loss = F.cross_entropy(output, batch.labels)

            # Compute gradients
            loss.backward()

            # Accumulate squared gradients (Fisher diagonal)
            for param in model.parameters():
                fisher_diagonal += param.grad.data ** 2

        # Normalize
        fisher_diagonal /= len(data)

        # Store
        self.fisher_matrices[project_id] = fisher_diagonal
        self.optimal_params[project_id] = {
            name: param.clone().detach()
            for name, param in model.named_parameters()
        }

    def apply_ewc_penalty(self, model, lambda_ewc=1000):
        """
        Apply EWC regularization during new project training
        """
        ewc_loss = 0

        for project_id, fisher in self.fisher_matrices.items():
            optimal = self.optimal_params[project_id]

            for name, param in model.named_parameters():
                ewc_loss += (fisher * (param - optimal[name]) ** 2).sum()

        return lambda_ewc * ewc_loss
```

**FR-5: Stability-Plasticity Balance**
```python
def compute_stability_plasticity_scores(pattern, usage_history):
    """
    Determine how much to preserve (stability) vs. adapt (plasticity)
    """
    # Stability factors
    fisher_importance = pattern.get('fisher_score', 0)
    betweenness = pattern.get('betweenness', 0)
    reuse_frequency = usage_history.get(pattern['id'], 0)
    successful_transfers = count_successful_transfers(pattern)

    stability_score = (
        0.4 * fisher_importance +
        0.3 * betweenness +
        0.2 * (reuse_frequency / max_reuse) +
        0.1 * (successful_transfers / total_attempts)
    )

    # Plasticity factors
    domain_specificity = measure_domain_specificity(pattern)
    recent_failures = count_recent_failures(pattern, days=30)
    context_variability = measure_context_variability(pattern)

    plasticity_score = (
        0.5 * domain_specificity +
        0.3 * (recent_failures / total_recent_uses) +
        0.2 * context_variability
    )

    return {
        'stability': stability_score,
        'plasticity': plasticity_score,
        'preservation_weight': stability_score / (stability_score + plasticity_score)
    }
```

### Pattern Application and Adaptation

**FR-6: Context-Aware Pattern Matching**
```python
def match_patterns_to_new_project(new_project_context, pattern_library):
    """
    Find relevant patterns for new project based on context
    """
    candidates = []

    # Universal patterns always relevant
    candidates.extend(pattern_library.patterns['universal'])

    # Domain-specific patterns if domain matches
    project_domains = new_project_context['domains']
    for domain in project_domains:
        if domain in pattern_library.patterns['domain_specific']:
            candidates.extend(pattern_library.patterns['domain_specific'][domain])

    # Score each candidate
    scored = []
    for pattern in candidates:
        score = compute_relevance_score(pattern, new_project_context)
        scored.append({
            'pattern': pattern,
            'relevance_score': score,
            'adaptations_needed': identify_adaptations(pattern, new_project_context)
        })

    return sorted(scored, key=lambda x: x['relevance_score'], reverse=True)
```

**FR-7: Pattern Instantiation**
```python
def instantiate_pattern(pattern, project_context):
    """
    Apply pattern to new project with context-specific adaptations
    """
    # Fill placeholders
    instantiated = {
        'name': pattern['name'],
        'concepts': []
    }

    for placeholder, value in pattern['placeholders'].items():
        # Get project-specific value
        concrete_value = project_context.get(placeholder, None)

        if concrete_value:
            instantiated['concepts'].append({
                'placeholder': placeholder,
                'value': concrete_value,
                'confidence': 1.0
            })
        else:
            # Generate suggestion using LLM
            suggestion = generate_placeholder_value(
                placeholder,
                pattern,
                project_context
            )
            instantiated['concepts'].append({
                'placeholder': placeholder,
                'value': suggestion,
                'confidence': suggestion['confidence']
            })

    # Create notes and links
    notes = create_notes_from_template(pattern, instantiated)
    links = create_links_from_template(pattern, instantiated, project_context)

    return {
        'notes': notes,
        'links': links,
        'pattern_id': pattern['id'],
        'adaptations': instantiated['concepts']
    }
```

### Continuous Learning and Improvement

**FR-8: Usage Tracking and Feedback**
```python
class PatternUsageTracker:
    def track_pattern_application(self, pattern_id, project_id, outcome):
        record = {
            'pattern_id': pattern_id,
            'project_id': project_id,
            'timestamp': now(),
            'outcome': outcome,  # 'accepted', 'modified', 'rejected'
            'modifications': outcome.get('changes', []),
            'time_saved': outcome.get('time_saved_hours', None),
            'user_rating': outcome.get('rating', None)
        }

        self.db.store(record)

        # Update pattern statistics
        self.update_pattern_stats(pattern_id, outcome)

    def analyze_pattern_effectiveness(self, pattern_id):
        """
        Measure how well pattern performs across projects
        """
        history = self.db.get_pattern_history(pattern_id)

        metrics = {
            'acceptance_rate': sum(h['outcome'] == 'accepted' for h in history) / len(history),
            'avg_time_saved': np.mean([h['time_saved'] for h in history if h['time_saved']]),
            'avg_rating': np.mean([h['user_rating'] for h in history if h['user_rating']]),
            'modification_rate': sum(h['outcome'] == 'modified' for h in history) / len(history),
            'domain_diversity': len(set(h['project_domain'] for h in history))
        }

        return metrics
```

**FR-9: Pattern Evolution and Deprecation**
```python
def evolve_pattern_library(library, min_acceptance_rate=0.4):
    """
    Update patterns based on usage feedback
    """
    actions = []

    for pattern in library.get_all_patterns():
        effectiveness = library.analyze_pattern_effectiveness(pattern['id'])

        # Promote successful experimental patterns
        if pattern['category'] == 'experimental':
            if effectiveness['acceptance_rate'] > 0.6 and \
               effectiveness['usage_count'] > 5:
                actions.append({
                    'action': 'promote',
                    'pattern_id': pattern['id'],
                    'to_category': 'universal' if effectiveness['domain_diversity'] > 3
                                   else 'domain_specific'
                })

        # Deprecate low-performing patterns
        if effectiveness['acceptance_rate'] < min_acceptance_rate and \
           effectiveness['usage_count'] > 10:
            actions.append({
                'action': 'deprecate',
                'pattern_id': pattern['id'],
                'reason': f"Low acceptance rate: {effectiveness['acceptance_rate']:.2f}"
            })

        # Update patterns with common modifications
        if effectiveness['modification_rate'] > 0.5:
            common_mods = find_common_modifications(pattern['id'])
            actions.append({
                'action': 'update',
                'pattern_id': pattern['id'],
                'modifications': common_mods
            })

    return actions
```

**FR-10: Meta-Learning for Few-Shot Adaptation**
```python
def meta_train_pattern_adapter(historical_projects):
    """
    Train meta-learner for fast adaptation to new projects (MAML-style)
    """
    # Treat each project as one meta-learning task
    tasks = []
    for project in historical_projects:
        task = {
            'support_set': project['initial_requirements'][:10],  # Few-shot
            'query_set': project['final_patterns'],
            'context': project['domain_context']
        }
        tasks.append(task)

    # Meta-training loop
    meta_model = initialize_meta_model()

    for epoch in range(meta_epochs):
        batch_tasks = sample(tasks, batch_size)

        for task in batch_tasks:
            # Inner loop: Adapt to task with K gradient steps
            adapted_model = meta_model.clone()
            for k in range(K_adaptation_steps):
                support_loss = compute_loss(adapted_model, task['support_set'])
                adapted_model.update(support_loss, lr=inner_lr)

            # Outer loop: Meta-update using query set
            query_loss = compute_loss(adapted_model, task['query_set'])
            meta_model.meta_update(query_loss, lr=outer_lr)

    return meta_model
```

## Technical Architecture

### Components

**1. Pattern Extractor** (`/src/patterns/extractor.py`)
- Detect bridge patterns (high betweenness)
- Detect cluster patterns (high clustering)
- Detect motif patterns (recurring structures)
- Abstract to templates

**2. Fisher Tracker** (`/src/patterns/fisher.py`)
- Compute Fisher Information per project
- Track optimal parameters
- Apply EWC penalty during training
- Compute Fisher overlap between projects

**3. Pattern Library** (`/src/patterns/library.py`)
- Organize patterns (universal, domain-specific, deprecated)
- Vector search for pattern matching
- Usage statistics tracking
- Evolution management

**4. Pattern Matcher** (`/src/patterns/matcher.py`)
- Context-aware pattern search
- Relevance scoring
- Adaptation identification
- Instantiation logic

**5. Meta-Learner** (`/src/patterns/meta_learner.py`)
- MAML-style meta-training
- Few-shot adaptation
- Transfer learning across projects

### Data Models

**Pattern**:
```typescript
interface Pattern {
  id: string;
  name: string;
  type: 'bridge' | 'cluster' | 'motif';
  category: 'universal' | 'domain_specific' | 'experimental' | 'deprecated';

  // Structure
  subgraph: Graph;
  core_concept: string;
  related_concepts: string[];
  relationships: Relationship[];

  // Abstraction
  template: string;
  placeholders: Record<string, PlaceholderSpec>;
  invariants: string[];  // Always present components
  optionals: string[];   // Context-dependent components

  // Metrics
  fisher_score: number;
  betweenness: number;
  domain_specificity: number;

  // Usage
  usage_count: number;
  acceptance_rate: number;
  avg_time_saved: number;
  successful_transfers: number;

  // Provenance
  source_projects: string[];
  created: Date;
  last_updated: Date;
}
```

**Pattern Application**:
```typescript
interface PatternApplication {
  application_id: string;
  pattern_id: string;
  project_id: string;
  timestamp: Date;

  // Instantiation
  instantiated_concepts: Record<string, string>;
  adaptations_made: string[];

  // Outcome
  outcome: 'accepted' | 'modified' | 'rejected';
  time_saved_hours: number;
  user_rating: number;
  feedback: string;

  // Impact
  created_notes: string[];
  created_links: Link[];
}
```

### Integration Architecture

```
┌─────────────────┐
│  Completed      │
│  Project        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pattern        │
│  Extractor      │
│  (Detect)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Fisher Tracker │      │  Abstraction    │
│  (Importance)   │◄────►│  Engine (LLM)   │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Pattern        │
│  Library        │
│  (Store)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  New Project    │─────►│  Pattern        │
│  Context        │      │  Matcher        │
└─────────────────┘      └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Instantiation  │
                         │  Engine         │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Usage Tracker  │
                         │  (Feedback)     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Meta-Learner   │
                         │  (Improve)      │
                         └─────────────────┘
```

## Success Metrics

- **Pattern Reuse Rate**: >40% of patterns suggested are accepted by Project 10
- **Time Savings**: 30-50% reduction in setup time for new projects
- **Fisher Retention**: 70-80% pattern quality maintained across 5+ projects
- **Transfer Efficiency**: 60-70% performance with 5-10 examples (meta-learning)
- **Library Growth**: 10-15 new validated patterns per 5 projects

## Testing Strategy

### Unit Tests
- Fisher computation
- Pattern extraction algorithms
- Relevance scoring
- Instantiation logic

### Integration Tests
- Full lifecycle (extract → store → match → apply)
- EWC penalty application
- Meta-learning training loop

### Longitudinal Study
- Track pattern effectiveness over 10+ projects
- Measure time savings vs. manual approach
- Validate Fisher importance correlation with reuse

## Rollout Plan

### Phase 1: Extraction (Week 1-2)
- Pattern detection algorithms
- Fisher tracker implementation
- Basic library storage

### Phase 2: Matching (Week 3-4)
- Context-aware matching
- Relevance scoring
- Instantiation engine

### Phase 3: Learning (Week 5-6)
- Usage tracking
- Pattern evolution
- EWC integration

### Phase 4: Meta-Learning (Week 7-8)
- MAML-style meta-trainer
- Few-shot adaptation
- Transfer validation

## Related Features

- [[F-016-graph-topology-analyzer]] - Betweenness input for pattern detection
- [[F-017-cognitive-variability-tracker]] - Phase-aware pattern suggestions
- [[F-018-semantic-bridge-builder]] - Pattern-based bridge suggestions

## References

1. Kirkpatrick et al. (2017) - Elastic Weight Consolidation
2. Finn et al. (2017) - Model-Agnostic Meta-Learning (MAML)
3. Shepperd (2003) - Case-Based Reasoning in SE
4. Hu et al. (2020) - GNN Pre-training Strategies
