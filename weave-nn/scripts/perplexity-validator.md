# Perplexity Validator

## Overview

This guide provides methodology for measuring and validating perplexity in markdown documents to ensure optimal chunking and semantic coherence for knowledge graphs.

## What is Perplexity?

Perplexity measures how well a probability model predicts a sample. In the context of markdown documents, it indicates:
- **Low perplexity (5-15)**: Too uniform, potentially oversimplified content
- **Optimal perplexity (15-25)**: Good balance of structure and complexity
- **High perplexity (25+)**: Too complex or poorly structured content

## Formula

```
perplexity = exp(cross-entropy)

where:
cross-entropy = -Σ P(x) * log(Q(x))
P(x) = actual probability distribution
Q(x) = predicted probability distribution
```

## Measurement Methodology

### 1. Document Tokenization

Break document into semantic units:
- Sentences
- Paragraphs
- Heading sections
- Code blocks
- List items

### 2. Calculate Word-Level Perplexity

```python
import math
from collections import Counter

def calculate_perplexity(text, model_probabilities):
    """
    Calculate perplexity for a text segment.

    Args:
        text: String of text to analyze
        model_probabilities: Dict of word probabilities from language model

    Returns:
        float: Perplexity score
    """
    words = text.lower().split()
    n = len(words)

    if n == 0:
        return 0

    # Calculate cross-entropy
    cross_entropy = 0
    for word in words:
        prob = model_probabilities.get(word, 1e-10)  # Small epsilon for unseen words
        cross_entropy -= math.log(prob)

    cross_entropy /= n

    # Calculate perplexity
    perplexity = math.exp(cross_entropy)

    return perplexity
```

### 3. Markdown-Specific Calculations

#### Heading Structure Perplexity

```python
def heading_structure_perplexity(markdown_text):
    """
    Measure perplexity of heading hierarchy.
    Lower values indicate more predictable structure.
    """
    import re

    headings = re.findall(r'^(#{1,6})\s+(.+)$', markdown_text, re.MULTILINE)

    if not headings:
        return 0

    # Extract heading levels
    levels = [len(h[0]) for h in headings]

    # Calculate level transition probabilities
    transitions = {}
    for i in range(len(levels) - 1):
        current = levels[i]
        next_level = levels[i + 1]
        key = (current, next_level)
        transitions[key] = transitions.get(key, 0) + 1

    # Normalize to probabilities
    total_transitions = len(levels) - 1
    transition_probs = {k: v/total_transitions for k, v in transitions.items()}

    # Calculate entropy
    entropy = -sum(p * math.log(p) for p in transition_probs.values() if p > 0)

    # Return perplexity
    return math.exp(entropy)
```

#### Chunk-Level Perplexity

```python
def chunk_perplexity(chunk_text, vocabulary_distribution):
    """
    Calculate perplexity for a document chunk.

    Args:
        chunk_text: Text content of chunk
        vocabulary_distribution: Expected word frequency distribution

    Returns:
        float: Chunk perplexity score
    """
    words = chunk_text.lower().split()
    word_counts = Counter(words)

    # Calculate observed vs expected distribution divergence
    cross_entropy = 0
    total_words = len(words)

    for word, count in word_counts.items():
        observed_prob = count / total_words
        expected_prob = vocabulary_distribution.get(word, 1e-10)
        cross_entropy -= observed_prob * math.log(expected_prob)

    return math.exp(cross_entropy)
```

## Example Calculations

### Example 1: Well-Structured Document (Target Range)

```markdown
# Main Topic

## Subtopic A
Content about subtopic A with clear focus.

## Subtopic B
Related content maintaining consistent complexity.
```

**Expected Perplexity**: 18-22
- Predictable heading structure
- Consistent vocabulary
- Clear semantic boundaries

### Example 2: Over-Simplified Document (Too Low)

```markdown
# Title

Text. Text. Text.

## Section

Text. Text. Text.
```

**Expected Perplexity**: 8-12
- Too repetitive
- Lacks semantic variation
- Poor information density

### Example 3: Over-Complex Document (Too High)

```markdown
# Advanced Quantum Cryptography

Discussing eigenstate superposition within non-Hermitian Hamiltonians...

#### Random Subsection
Completely different topic about cooking recipes...
```

**Expected Perplexity**: 30-40
- Inconsistent topic focus
- Unpredictable structure
- High vocabulary variation

## Validation Checklist

### Heading Structure Validation

- [ ] Heading hierarchy follows logical progression (H1 → H2 → H3)
- [ ] No heading level skips (e.g., H1 directly to H3)
- [ ] Consistent heading style and formatting
- [ ] Headings are descriptive and semantically meaningful
- [ ] Optimal heading density: 1 heading per 150-300 words

### Content Coherence Validation

- [ ] Each section has focused topic coverage
- [ ] Vocabulary complexity is consistent within sections
- [ ] Transitions between sections are logical
- [ ] Code blocks and lists are properly formatted
- [ ] No orphaned content without context

### Chunk Boundary Validation

- [ ] Chunks break at semantic boundaries (headings, paragraph breaks)
- [ ] Chunk size: 200-500 tokens (optimal for embedding)
- [ ] No mid-sentence or mid-paragraph breaks
- [ ] Related content stays together
- [ ] Chunks maintain context independence where possible

## Optimal Perplexity Guidelines

### Target Range: 15-25

**Characteristics**:
- Balanced vocabulary diversity
- Predictable but not repetitive structure
- Clear semantic boundaries
- Appropriate information density
- Good chunking potential

### When to Aim Higher (20-25)

- Technical documentation requiring precise terminology
- Academic or research content
- Multi-domain knowledge articles

### When to Aim Lower (15-20)

- Tutorial or how-to guides
- Reference documentation
- Procedural content

## Remediation Strategies

### If Perplexity < 15 (Too Low)

**Problem**: Content is too simple or repetitive

**Solutions**:
1. Add more descriptive detail
2. Introduce relevant examples
3. Expand vocabulary while maintaining clarity
4. Add subsections for better organization
5. Include related concepts and cross-references

### If Perplexity > 25 (Too High)

**Problem**: Content is too complex or poorly structured

**Solutions**:
1. Break into smaller, focused sections
2. Simplify heading structure
3. Reduce vocabulary variation within sections
4. Group related concepts together
5. Add transitional content between disparate topics
6. Consider splitting into multiple documents

### Structural Improvements

**Always**:
- Use consistent heading levels
- Maintain clear topic boundaries
- Keep related information together
- Use lists and code blocks appropriately
- Add context where needed

## Implementation Script

### Python Perplexity Validator

```python
#!/usr/bin/env python3
"""
Markdown Perplexity Validator
Validates document structure and measures perplexity for optimal chunking.
"""

import re
import math
from collections import Counter
from pathlib import Path

class PerplexityValidator:
    def __init__(self, target_min=15, target_max=25):
        self.target_min = target_min
        self.target_max = target_max

    def validate_file(self, filepath):
        """Validate a markdown file's perplexity."""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        return self.validate_content(content)

    def validate_content(self, content):
        """Validate markdown content perplexity."""
        results = {
            'heading_structure': self._check_heading_structure(content),
            'content_perplexity': self._calculate_content_perplexity(content),
            'chunk_analysis': self._analyze_chunks(content),
            'recommendations': []
        }

        # Overall assessment
        perplexity = results['content_perplexity']
        results['in_target_range'] = self.target_min <= perplexity <= self.target_max

        # Generate recommendations
        if perplexity < self.target_min:
            results['recommendations'].extend([
                'Content may be too simple or repetitive',
                'Consider adding more detail and examples',
                'Expand vocabulary while maintaining clarity'
            ])
        elif perplexity > self.target_max:
            results['recommendations'].extend([
                'Content may be too complex or poorly structured',
                'Consider breaking into smaller focused sections',
                'Simplify heading structure',
                'Group related concepts together'
            ])

        if not results['heading_structure']['valid']:
            results['recommendations'].extend(
                results['heading_structure']['issues']
            )

        return results

    def _check_heading_structure(self, content):
        """Validate heading hierarchy and structure."""
        headings = re.findall(r'^(#{1,6})\s+(.+)$', content, re.MULTILINE)

        result = {
            'valid': True,
            'issues': [],
            'heading_count': len(headings),
            'structure_perplexity': 0
        }

        if not headings:
            result['valid'] = False
            result['issues'].append('No headings found')
            return result

        # Check for level skips
        levels = [len(h[0]) for h in headings]
        for i in range(len(levels) - 1):
            if levels[i + 1] > levels[i] + 1:
                result['valid'] = False
                result['issues'].append(
                    f'Heading level skip detected: H{levels[i]} to H{levels[i+1]}'
                )

        # Calculate heading structure perplexity
        if len(levels) > 1:
            transitions = Counter(zip(levels[:-1], levels[1:]))
            total = len(levels) - 1
            probs = [count/total for count in transitions.values()]
            entropy = -sum(p * math.log(p) for p in probs if p > 0)
            result['structure_perplexity'] = math.exp(entropy)

        return result

    def _calculate_content_perplexity(self, content):
        """Calculate overall content perplexity."""
        # Remove markdown syntax for cleaner analysis
        text = re.sub(r'#{1,6}\s+', '', content)
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        text = re.sub(r'`[^`]+`', '', text)

        words = text.lower().split()
        if not words:
            return 0

        # Calculate unigram language model
        word_counts = Counter(words)
        total_words = len(words)

        # Calculate perplexity using unigram model
        log_prob_sum = 0
        for word in words:
            prob = word_counts[word] / total_words
            log_prob_sum += math.log(prob)

        perplexity = math.exp(-log_prob_sum / total_words)
        return perplexity

    def _analyze_chunks(self, content):
        """Analyze potential chunk boundaries and quality."""
        # Split by headings
        chunks = re.split(r'^#{1,6}\s+.+$', content, flags=re.MULTILINE)
        chunks = [c.strip() for c in chunks if c.strip()]

        analysis = {
            'chunk_count': len(chunks),
            'avg_chunk_size': 0,
            'optimal_chunks': 0,
            'chunks_too_small': 0,
            'chunks_too_large': 0
        }

        if not chunks:
            return analysis

        chunk_sizes = [len(c.split()) for c in chunks]
        analysis['avg_chunk_size'] = sum(chunk_sizes) / len(chunk_sizes)

        for size in chunk_sizes:
            if 50 <= size <= 150:  # Optimal word count per chunk
                analysis['optimal_chunks'] += 1
            elif size < 50:
                analysis['chunks_too_small'] += 1
            else:
                analysis['chunks_too_large'] += 1

        return analysis

# Usage example
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print('Usage: python perplexity-validator.py <markdown-file>')
        sys.exit(1)

    validator = PerplexityValidator()
    results = validator.validate_file(sys.argv[1])

    print(f'\n=== Perplexity Validation Results ===\n')
    print(f'Content Perplexity: {results["content_perplexity"]:.2f}')
    print(f'Target Range: 15-25')
    print(f'In Range: {"✓" if results["in_target_range"] else "✗"}\n')

    print(f'Heading Structure: {"✓" if results["heading_structure"]["valid"] else "✗"}')
    print(f'Structure Perplexity: {results["heading_structure"]["structure_perplexity"]:.2f}')
    print(f'Heading Count: {results["heading_structure"]["heading_count"]}\n')

    print(f'Chunk Analysis:')
    print(f'  Total Chunks: {results["chunk_analysis"]["chunk_count"]}')
    print(f'  Avg Size: {results["chunk_analysis"]["avg_chunk_size"]:.0f} words')
    print(f'  Optimal: {results["chunk_analysis"]["optimal_chunks"]}')
    print(f'  Too Small: {results["chunk_analysis"]["chunks_too_small"]}')
    print(f'  Too Large: {results["chunk_analysis"]["chunks_too_large"]}\n')

    if results['recommendations']:
        print('Recommendations:')
        for rec in results['recommendations']:
            print(f'  • {rec}')
```

## Integration with Knowledge Graphs

### Pre-Processing Step

Before ingesting markdown into knowledge graph:
1. Run perplexity validation
2. Identify chunks outside target range
3. Apply remediation strategies
4. Re-validate
5. Proceed with graph ingestion

### Continuous Monitoring

- Track perplexity metrics over time
- Identify documents with degrading quality
- Flag for review when perplexity drifts
- Maintain quality baseline

## Best Practices

1. **Measure Early**: Validate perplexity during document creation
2. **Iterate**: Refine structure based on measurements
3. **Context Matters**: Adjust targets for document type
4. **Track Trends**: Monitor perplexity across document corpus
5. **Automate**: Integrate validation into CI/CD pipelines
6. **Document Decisions**: Record why perplexity targets were set

## Conclusion

Perplexity measurement provides quantitative guidance for markdown document quality and chunking optimization. By maintaining documents in the 15-25 range, you ensure:
- Optimal semantic granularity for knowledge graphs
- Balanced complexity and readability
- Effective chunk boundaries for embeddings
- Consistent quality across documentation corpus

Regular validation and remediation maintains high-quality knowledge graph inputs.
