# DeepAgent GitHub Repository Analysis

**Repository**: https://github.com/RUC-NLPIR/DeepAgent
**Paper**: arXiv:2510.21618 (Hugging Face Daily Paper #1, October 2025)
**Datasets**: https://huggingface.co/datasets/lixiaoxi45/DeepAgent-Datasets
**Research Date**: 2025-11-01

---

## Executive Summary

DeepAgent is an end-to-end deep reasoning agent developed by RUC-NLPIR and Xiaohongshu Inc. that performs **autonomous thinking, tool discovery, and action execution** within a single coherent reasoning process. Key innovations include:

1. **Autonomous Memory Folding**: Brain-inspired mechanism compressing interaction history into episodic, working, and tool memories
2. **ToolPO Training**: End-to-end RL strategy with LLM-simulated APIs and tool-call advantage attribution
3. **Scalable Tool Discovery**: Dynamic retrieval from 16,000+ RapidAPIs using semantic search
4. **Unified Reasoning**: Single coherent thought stream instead of rigid workflows

---

## 1. Repository Structure

### Directory Layout

```
DeepAgent/
├── config/
│   └── base_config.yaml          # Central configuration
├── data/
│   ├── alfworld/                 # Embodied AI tasks
│   ├── api_bank/                 # API benchmarks
│   ├── gaia/                     # Research tasks
│   ├── hle/                      # Humanity's Last Exam
│   ├── restbench/                # REST API (TMDB/Spotify)
│   ├── toolbench/                # Tool-use benchmarks
│   ├── toolhop/                  # Tool composition
│   └── webshop/                  # Web navigation
├── figures/
│   ├── comparison.png            # Performance comparison
│   ├── framework.png             # Architecture diagram
│   └── overall_results.png       # Experimental results
├── src/
│   ├── envs/                     # Environment interfaces
│   ├── evaluate/                 # Evaluation framework
│   │   ├── evaluate_base.py      # Core metrics
│   │   ├── evaluate_toolbench.py # Tool benchmarks
│   │   ├── evaluate_alfworld.py  # Embodied AI
│   │   └── evaluate_*.py         # Domain-specific evals
│   ├── prompts/                  # Prompt engineering
│   │   ├── prompts_deepagent.py  # Main reasoning prompts
│   │   ├── prompts_react.py      # ReAct baseline
│   │   └── task_specific_prompts.py
│   ├── tools/                    # Tool implementations
│   │   ├── tool_manager.py       # Central orchestration
│   │   ├── tool_search.py        # Semantic retrieval
│   │   ├── python_executor.py    # Code execution
│   │   ├── multimodal_tools.py   # VQA integration
│   │   ├── rapid_api.py          # RapidAPI client
│   │   ├── google_search.py      # Web search
│   │   └── file_process.py       # File handling
│   ├── utils/                    # Helper functions
│   │   ├── math_equivalence.py   # Math validation
│   │   └── oas_utils.py          # OpenAPI utilities
│   ├── run_deep_agent.py         # Main entry point
│   └── run_tool_search_server.py # Tool retrieval server
├── LICENSE (MIT)
├── README.md
└── requirements.txt
```

### Architecture Overview

**Three-Model System**:
1. **Main Reasoning LLM**: Powers agentic decision-making (QwQ-32B, Qwen3 series)
2. **Auxiliary LLM**: Handles memory generation and tool selection (Qwen2.5/3-Instruct)
3. **VQA Model**: Vision-language understanding (Qwen2.5-VL-32B-Instruct)

**Supporting Components**:
- **Tool Retriever**: BGE embedding-based semantic search
- **Environment Interfaces**: ALFWorld, WebShop simulators
- **Caching System**: Web search cache, URL cache, tool index cache

### Tech Stack (from requirements.txt)

**Core Dependencies**:
- `vllm` - LLM serving
- `transformers` - Model inference
- `sentence-transformers` - Embedding generation
- `openai` - API client
- `fastapi` - Tool search server
- `aiohttp`, `requests` - HTTP clients
- `beautifulsoup4`, `lxml` - Web scraping
- `pandas`, `numpy`, `scipy` - Data processing
- `pyyaml` - Configuration
- `alfworld` - Embodied AI environment
- `spotipy` - Spotify API client

**Notable Absence**: No pinned versions (suggests active development or flexibility)

---

## 2. Tool Management Implementation

### Core Tool Manager (`src/tools/tool_manager.py`)

#### Tool Registration & Discovery

```python
class ToolManager:
    @classmethod
    async def create(cls, args, webshop_url_id=0):
        """Factory pattern initialization"""
        # Initializes dataset-specific callers:
        # - RapidAPI (ToolBench, ToolHop)
        # - ALFWorld environment
        # - WebShop simulator
        # - API-Bank structured APIs
        # - Local tools (GAIA, HLE)
```

**Tool Categories**:

1. **Environment-based**: ALFWorld, WebShop (stateful interaction)
2. **API-based**: ToolBench, ToolHop, API-Bank (HTTP calls)
3. **Local tools**: Web search, code execution, VQA, file processing

#### Tool Retrieval Pattern

```python
def retrieve_tools(self, query, top_k, executable_tools=None):
    """Dual-strategy retrieval"""

    # Strategy 1: Local retrieval (API-Bank datasets)
    if self.args.dataset_name == 'api_bank' and self.retriever:
        return local_semantic_search(query, top_k)

    # Strategy 2: Remote retrieval (external API)
    if self.args.tool_retriever_api_base:
        response = requests.post(
            f"{api_base}/retrieve_tools",
            json={"query": query, "top_k": top_k}
        )
        return response.json()["tools"]

    return []  # Graceful failure
```

**Retrieval Algorithm** (`src/tools/tool_search.py`):

```python
# Semantic search via embeddings
query_embedding = self.model.encode([query], ...)
hits = util.semantic_search(
    query_embedding,
    self.corpus_embeddings,
    top_k=top_k,
    score_function=util.cos_sim  # Cosine similarity
)

# Model-specific preprocessing:
# - E5 models: "query:" prefix for queries, "passage:" for corpus
# - BGE models: L2 normalization
# - Generic: unformatted text

# Caching: MD5 hash of (model_path + corpus_id)
```

#### Tool Execution Pattern

```python
async def call_tool(self, tool_name, tool_args, interactions):
    """Route execution based on dataset type"""

    try:
        # Environment-based execution
        if dataset in ['alfworld', 'webshop']:
            obs, reward, done, info = env.step(action)
            return {"observation": obs, "reward": reward}

        # API-based execution
        elif dataset in ['toolbench', 'toolhop']:
            response = await make_http_call(tool_name, tool_args)
            return response

        # Local tools (GAIA, HLE, BrowseComp)
        elif tool_name == 'web_search':
            return await google_search(query)
        elif tool_name == 'browse_pages':
            return await fetch_and_parse(url)
        elif tool_name == 'execute_code':
            return await python_executor.run(code)
        elif tool_name == 'visual_question_answering':
            return await vqa_client.query(image, question)
        elif tool_name in ['read_file', 'process_pdf', ...]:
            return await file_processor.handle(file_path)

    except Exception as e:
        return {"error": f"Tool execution failed: {str(e)}"}
```

#### Error Handling Patterns

1. **Graceful Degradation**: Return empty lists on retrieval failure
2. **Error Wrapping**: `{"error": "descriptive message"}` format
3. **Silent Failure**: Caching errors don't interrupt execution
4. **Timeout Protection**: `func_timeout` for code execution
5. **Validation**: Strict parameter checking before execution

#### Caching System

```python
# Web search cache (persistent)
def read_web_cache(self, query):
    cache_file = f"{cache_dir}/{hash(query)}.json"
    if os.path.exists(cache_file):
        return json.load(open(cache_file))
    return None

def update_web_cache(self, query, results):
    cache_file = f"{cache_dir}/{hash(query)}.json"
    with open(cache_file, 'w') as f:
        json.dump(results, f)

# URL cache with snippet extraction
def get_cached_url(self, url, extract_snippet=False):
    # Returns full content or extracted snippet
    # Reduces redundant web fetching
```

---

## 3. Memory Implementation

### Memory Folding Mechanism

**Trigger**: Agent emits `<fold_thought>` when reasoning becomes lengthy or unproductive

**Three Memory Types** (from `src/prompts/prompts_deepagent.py`):

#### 1. Episode Memory
**Purpose**: Long-term experience patterns

```python
# Prompt structure:
"""
Summarize the interaction history into Episode Memory focusing on:
- Major milestones achieved
- Subgoal completions
- Strategic decisions made
- Key insights discovered

Format: JSON with structured fields
"""

# Example output:
{
    "task_understanding": "User wants to find...",
    "milestones": ["Found API X", "Retrieved data Y"],
    "successful_strategies": ["Used tool A for pattern B"],
    "failed_approaches": ["Tool C didn't work because..."],
    "current_state": "Making progress on subgoal..."
}
```

#### 2. Working Memory
**Purpose**: Immediate context snapshot

```python
# Prompt structure:
"""
Extract current goals and immediate challenges from recent interactions.
Focus on:
- Current subgoal
- Active constraints
- Pending decisions
- Next logical steps

Exclude historical context.
"""

# Example output:
{
    "current_goal": "Search for restaurants in Paris",
    "constraints": ["Must have vegan options", "Within budget"],
    "next_steps": ["Call restaurant_search API", "Filter results"],
    "blocking_issues": []
}
```

#### 3. Tool Memory
**Purpose**: Tool usage patterns and learnings

```python
# Prompt structure:
"""
Synthesize tool usage patterns, tracking:
- Effective parameter combinations
- Common failure modes per tool
- Successful tool sequences
- Performance characteristics

Format: Per-tool summaries
"""

# Example output:
{
    "google_search": {
        "effective_queries": ["specific product names work better"],
        "failures": ["overly broad queries return noise"],
        "best_practices": ["Use quotes for exact match"]
    },
    "python_executor": {
        "working_patterns": ["numpy for math", "pandas for data"],
        "common_errors": ["import restrictions", "timeout on loops"]
    }
}
```

### Memory Integration Pattern

```python
# From run_deep_agent.py
if len(interactions) > FOLD_THRESHOLD or "<fold_thought>" in response:
    # Generate all three memory types in parallel
    episode_memory = await generate_memory(
        interactions,
        prompt="episode_memory_prompt"
    )
    working_memory = await generate_memory(
        interactions,
        prompt="working_memory_prompt"
    )
    tool_memory = await generate_memory(
        interactions,
        prompt="tool_memory_prompt"
    )

    # Compress interaction history
    interactions = [{
        "role": "system",
        "content": f"""
Memory of previous folded thoughts:

Episode Memory:
{episode_memory}

Working Memory:
{working_memory}

Tool Memory:
{tool_memory}
"""
    }]
```

### Memory Compression Benefits

1. **Prevents Context Explosion**: Compresses 10+ turns into structured summary
2. **Reduces Error Accumulation**: Fresh start with preserved learnings
3. **Strategic Reconsideration**: Enables pivoting without losing context
4. **Pattern Recognition**: Tool memory captures reusable insights

---

## 4. Metrics Collection & Evaluation

### Base Evaluation Framework (`src/evaluate/evaluate_base.py`)

#### Metrics Tracked

```python
final_metric = {
    "is_valid_answer": False,  # Answer extraction succeeded
    "acc": 0,                   # Substring/containment match
    "em": 0,                    # Exact match
    "f1": 0,                    # Token-level F1
    "math_equal": 0,            # Mathematical equivalence
    "llm_equal": 0              # LLM-judged equivalence
}
```

#### Evaluation Pipeline

**1. Answer Extraction**:
```python
# From agent output, extract final answer
answer = extract_answer(output, dataset_format)
# Handles formats: <answer>X</answer>, boxed{X}, etc.
```

**2. Normalization**:
```python
# Standardize for comparison
pred_normalized = normalize_answer(pred)
gold_normalized = normalize_answer(gold)

# Normalization steps:
# - Lowercase
# - Strip whitespace
# - Remove articles (a, an, the)
# - Remove punctuation
# - Math: wrap as \\boxed{X}
```

**3. Comparison Methods**:

```python
# Exact Match
em = (pred_normalized == gold_normalized)

# Accuracy (substring/containment)
acc = (pred_normalized in gold_normalized or
       gold_normalized in pred_normalized)

# F1 Score (token-level)
pred_tokens = tokenize(pred_normalized)
gold_tokens = tokenize(gold_normalized)
common = Counter(pred_tokens) & Counter(gold_tokens)
precision = sum(common.values()) / len(pred_tokens)
recall = sum(common.values()) / len(gold_tokens)
f1 = 2 * (precision * recall) / (precision + recall)

# Mathematical Equivalence
from utils.math_equivalence import is_equiv
math_equal = is_equiv(pred, gold)

# LLM-based Judgment (async)
async with semaphore:  # Max 50 concurrent
    llm_equal = await judge_equivalence(pred, gold, llm_client)
```

**4. Aggregation**:

```python
# Per-domain metrics
domain_metrics = defaultdict(list)
for item in results:
    domain = item.get("domain", "general")
    domain_metrics[domain].append(item["score"])

# Overall metrics
overall = {
    "mean_acc": float(np.mean([r["acc"] for r in results])),
    "mean_em": float(np.mean([r["em"] for r in results])),
    "mean_f1": float(np.mean([r["f1"] for r in results])),
    "valid_answers": sum([r["is_valid_answer"] for r in results]),
    "total": len(results)
}
```

#### Domain-Specific Evaluators

**ToolBench** (`evaluate_toolbench.py`):
- Success: Correct API identified and called
- Metrics: Precision/recall on API selection

**ALFWorld** (`evaluate_alfworld.py`):
- Success: Task completed (goal achieved)
- Metrics: Steps taken, efficiency

**WebShop** (`evaluate_webshop.py`):
- Success: Correct item purchased
- Metrics: Attribute match, option match, price

**GAIA/HLE** (`evaluate_base.py`):
- Multi-modal QA evaluation
- Math equivalence checking
- LLM-based judgment

### Runtime Metrics Collection

```python
# From run_deep_agent.py
results = [{
    **{k: v for k, v in item['item'].items()},  # Original task
    'output': item['output'],                    # Final answer
    'action_count': item['action_count'],        # Tool calls made
    'executed_tool_searches': item['executed_search_queries'],
    'executed_tool_calls': item['executed_tool_calls'],
    'interactions': item.get('interactions', []),  # Full trace
    'success': item.get('success', False),        # Task success
    'reward': item.get('reward', 0.0)             # RL reward
}]
```

### Logging Infrastructure

**Interaction Traces**:
- Every LLM call logged with prompt/response
- Tool searches and results recorded
- Tool calls with arguments/responses
- Memory folding events

**Performance Tracking**:
- Token counts (input/output)
- API call latency
- Success rates per dataset
- Error frequency and types

---

## 5. Training Pipeline (ToolPO)

### Training Data Collection

From **HuggingFace datasets** (lixiaoxi45/DeepAgent-Datasets):

```python
# Dataset structure (Parquet format)
dataset = {
    "question": "Task description",
    "answer": "Gold answer",
    "solution": ["Step 1", "Step 2", ...],  # Action sequence
    "tools_used": ["tool1", "tool2"],
    "metadata": {
        "annotator_time": 180,      # Seconds to solve
        "annotator_steps": 5,        # Number of steps
        "difficulty": "medium"
    },
    "subgoals": ["Subgoal 1", ...],
    "reasoning": "Thought process"
}
```

**Datasets for Training**:
1. **ToolBench**: Tool selection trajectories (16,000+ APIs)
2. **API-Bank**: Structured API interaction sequences
3. **ALFWorld**: Embodied AI navigation paths
4. **GAIA**: Research task decompositions
5. **ToolHop**: Multi-step tool composition

### ToolPO Implementation

**Key Concept**: End-to-end RL with tool-call advantage attribution

#### 1. LLM-Simulated APIs

```python
# From prompts_deepagent.py - RapidAPI Simulation Prompt
"""
You are simulating a RapidAPI endpoint.

Given:
- Tool name: {tool_name}
- Tool description: {tool_desc}
- Input arguments: {tool_args}

Generate a realistic JSON response that:
1. Matches the expected schema
2. Contains plausible data
3. Handles edge cases appropriately

Return only the JSON response.
"""

# Usage: When actual API unavailable during training
simulated_response = await aux_llm.complete(simulation_prompt)
```

**Benefits**:
- Training without API costs
- Consistent testing environment
- Coverage of unavailable APIs

#### 2. Reward Computation

**Task-Level Rewards**:
```python
# From evaluate modules
if task_completed_successfully:
    reward = 1.0
else:
    reward = 0.0

# Partial credit for some tasks
if correct_tool_sequence and wrong_final_answer:
    reward = 0.5  # Tool selection correct
```

**Step-Level Rewards** (inferred from paper):
```python
# Tool-call advantage attribution
# Credit assignment to specific tool invocation tokens

# Trajectory scoring
trajectory_value = 0.0
for step in trajectory:
    if step.tool_call_successful:
        trajectory_value += step_reward
    if step.leads_to_solution:
        trajectory_value += progress_reward

# Advantage calculation
advantage = trajectory_value - baseline_value

# Gradient focuses on tool call tokens
loss = -advantage * log_prob(tool_call_tokens)
```

#### 3. Training Loop (Conceptual)

```python
# Not explicit in repo, inferred from paper

for epoch in range(num_epochs):
    for batch in dataloader:
        # 1. Rollout with current policy
        trajectories = []
        for task in batch:
            trajectory = agent.solve(task)
            trajectories.append(trajectory)

        # 2. Evaluate trajectories
        rewards = [evaluate(t) for t in trajectories]

        # 3. Compute advantages (tool-call attribution)
        advantages = compute_advantages(trajectories, rewards)

        # 4. Update policy (focus on tool call tokens)
        loss = policy_gradient_loss(trajectories, advantages)
        optimizer.step(loss)

        # 5. Update value baseline
        baseline.update(trajectories, rewards)
```

### Fine-Tuning Strategy

**Models Fine-Tuned**:
- Main reasoning LLM (QwQ-32B, Qwen3 variants)
- Potentially auxiliary LLM for memory/selection

**Training Focus**:
1. **Tool Selection**: Which tool to use for given query
2. **Tool Invocation**: Correct parameter generation
3. **Memory Folding**: When to compress context
4. **Error Recovery**: How to handle failed calls

**Data Augmentation**:
- LLM-simulated API responses
- Synthetic error scenarios
- Multi-step tool compositions

---

## 6. Practical Code Patterns for Adoption

### Pattern 1: Semantic Tool Retrieval

**Python Implementation**:

```python
from sentence_transformers import SentenceTransformer, util
import numpy as np
import hashlib
import pickle

class ToolRetriever:
    def __init__(self, model_name="BAAI/bge-large-en-v1.5"):
        self.model = SentenceTransformer(model_name)
        self.corpus_embeddings = None
        self.corpus2tool = {}

    def index_tools(self, tools):
        """Build searchable tool index"""
        corpus = []
        for i, tool in enumerate(tools):
            # Create searchable description
            text = f"{tool['name']}: {tool['description']}"
            corpus.append(text)
            self.corpus2tool[i] = tool

        # Precompute embeddings
        self.corpus_embeddings = self.model.encode(
            corpus,
            normalize_embeddings=True,  # BGE models
            batch_size=32
        )

        # Cache to disk
        cache_id = hashlib.md5(
            f"{model_name}_{len(tools)}".encode()
        ).hexdigest()
        pickle.dump(
            self.corpus_embeddings,
            open(f"cache/{cache_id}.pkl", "wb")
        )

    def retrieve(self, query, top_k=5):
        """Semantic search for relevant tools"""
        query_emb = self.model.encode(
            [f"query: {query}"],  # E5/BGE prefix
            normalize_embeddings=True
        )

        hits = util.semantic_search(
            query_emb,
            self.corpus_embeddings,
            top_k=top_k,
            score_function=util.cos_sim
        )[0]

        return [
            {
                **self.corpus2tool[hit['corpus_id']],
                "relevance_score": hit['score']
            }
            for hit in hits
        ]
```

**TypeScript Equivalent**:

```typescript
import { pipeline } from '@xenova/transformers';

class ToolRetriever {
    private model: any;
    private corpusEmbeddings: number[][] = [];
    private corpus2tool: Map<number, Tool> = new Map();

    async initialize(modelName = "Xenova/bge-large-en-v1.5") {
        this.model = await pipeline(
            'feature-extraction',
            modelName
        );
    }

    async indexTools(tools: Tool[]) {
        const corpus = tools.map(t =>
            `${t.name}: ${t.description}`
        );

        this.corpusEmbeddings = await this.model(corpus, {
            pooling: 'mean',
            normalize: true
        });

        tools.forEach((tool, i) => this.corpus2tool.set(i, tool));
    }

    async retrieve(query: string, topK = 5): Promise<Tool[]> {
        const queryEmb = await this.model(`query: ${query}`, {
            pooling: 'mean',
            normalize: true
        });

        // Cosine similarity
        const scores = this.corpusEmbeddings.map((emb, i) => ({
            id: i,
            score: this.cosineSim(queryEmb, emb)
        }));

        scores.sort((a, b) => b.score - a.score);

        return scores.slice(0, topK).map(s =>
            this.corpus2tool.get(s.id)!
        );
    }

    private cosineSim(a: number[], b: number[]): number {
        return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }
}
```

### Pattern 2: Memory Folding System

**Python Implementation**:

```python
from dataclasses import dataclass
from typing import List, Dict
import asyncio

@dataclass
class Memory:
    episode: Dict  # Long-term patterns
    working: Dict  # Current context
    tool: Dict     # Tool usage patterns

class MemoryFolder:
    def __init__(self, llm_client, fold_threshold=10):
        self.llm_client = llm_client
        self.fold_threshold = fold_threshold

    async def should_fold(self, interactions: List) -> bool:
        """Check if folding needed"""
        # Length-based trigger
        if len(interactions) > self.fold_threshold:
            return True

        # Explicit trigger
        last_msg = interactions[-1]["content"]
        if "<fold_thought>" in last_msg:
            return True

        return False

    async def fold(self, interactions: List) -> Memory:
        """Generate all three memory types in parallel"""

        # Prepare prompts
        history = self._format_history(interactions)

        prompts = {
            "episode": self._episode_prompt(history),
            "working": self._working_prompt(history),
            "tool": self._tool_prompt(history)
        }

        # Generate in parallel
        results = await asyncio.gather(
            self.llm_client.complete(prompts["episode"]),
            self.llm_client.complete(prompts["working"]),
            self.llm_client.complete(prompts["tool"])
        )

        return Memory(
            episode=self._parse_json(results[0]),
            working=self._parse_json(results[1]),
            tool=self._parse_json(results[2])
        )

    def _episode_prompt(self, history):
        return f"""
Analyze this interaction history and extract Episode Memory.

Focus on:
- Major milestones achieved
- Subgoal completions
- Strategic decisions
- Key insights

History:
{history}

Return JSON with these fields:
{{
    "task_understanding": "...",
    "milestones": [...],
    "successful_strategies": [...],
    "failed_approaches": [...],
    "current_state": "..."
}}
"""

    def _working_prompt(self, history):
        return f"""
Extract Working Memory from recent interactions.

Focus on:
- Current immediate goal
- Active constraints
- Next logical steps
- Blocking issues

History (last 5 turns):
{history[-5:]}

Return JSON:
{{
    "current_goal": "...",
    "constraints": [...],
    "next_steps": [...],
    "blocking_issues": [...]
}}
"""

    def _tool_prompt(self, history):
        return f"""
Synthesize Tool Memory from usage patterns.

For each tool used, document:
- Effective parameter combinations
- Common failure modes
- Successful sequences
- Performance notes

History:
{history}

Return JSON:
{{
    "tool_name": {{
        "effective_patterns": [...],
        "failures": [...],
        "best_practices": [...]
    }},
    ...
}}
"""

    def compress_interactions(
        self,
        interactions: List,
        memory: Memory
    ) -> List:
        """Replace long history with memory summary"""
        return [{
            "role": "system",
            "content": f"""
Memory of previous interactions:

Episode Memory (long-term patterns):
{json.dumps(memory.episode, indent=2)}

Working Memory (current context):
{json.dumps(memory.working, indent=2)}

Tool Memory (usage patterns):
{json.dumps(memory.tool, indent=2)}
"""
        }]
```

**TypeScript Equivalent**:

```typescript
interface Memory {
    episode: EpisodeMemory;
    working: WorkingMemory;
    tool: ToolMemory;
}

class MemoryFolder {
    constructor(
        private llmClient: LLMClient,
        private foldThreshold = 10
    ) {}

    async shouldFold(interactions: Message[]): Promise<boolean> {
        if (interactions.length > this.foldThreshold) return true;

        const last = interactions[interactions.length - 1];
        return last.content.includes("<fold_thought>");
    }

    async fold(interactions: Message[]): Promise<Memory> {
        const history = this.formatHistory(interactions);

        const [episode, working, tool] = await Promise.all([
            this.llmClient.complete(this.episodePrompt(history)),
            this.llmClient.complete(this.workingPrompt(history)),
            this.llmClient.complete(this.toolPrompt(history))
        ]);

        return {
            episode: JSON.parse(episode),
            working: JSON.parse(working),
            tool: JSON.parse(tool)
        };
    }

    compressInteractions(
        interactions: Message[],
        memory: Memory
    ): Message[] {
        return [{
            role: "system",
            content: `
Memory of previous interactions:

Episode Memory: ${JSON.stringify(memory.episode, null, 2)}
Working Memory: ${JSON.stringify(memory.working, null, 2)}
Tool Memory: ${JSON.stringify(memory.tool, null, 2)}
`
        }];
    }
}
```

### Pattern 3: Sandboxed Code Execution

**Python Implementation**:

```python
import ast
import re
import asyncio
from func_timeout import func_timeout, FunctionTimedOut
import io
import sys

class PythonExecutor:
    UNSAFE_PATTERNS = [
        r'import\s+(os|sys|subprocess|shutil)',
        r'from\s+(os|sys|subprocess|shutil)\s+import',
        r'(?<!\w)(eval|exec|__import__)\s*\(',
        r'os\.(system|popen|fork|kill|remove)',
    ]

    def __init__(self, timeout=10, max_output=400):
        self.timeout = timeout
        self.max_output = max_output

    async def execute(self, code: str) -> dict:
        """Execute Python code with safety checks"""

        # Normalize code
        if isinstance(code, list):
            code = '\n'.join(code)
        code = code.strip()

        # Safety validation
        if not self._is_safe(code):
            return {
                "error": "Unsafe code detected",
                "status": "blocked"
            }

        try:
            # Run in thread with timeout
            result = await asyncio.to_thread(
                func_timeout,
                self.timeout,
                self._execute_sync,
                args=(code,)
            )

            return {
                "output": self._truncate(result),
                "status": "success"
            }

        except FunctionTimedOut:
            return {"error": "Execution timeout", "status": "timeout"}
        except Exception as e:
            return {"error": str(e), "status": "error"}

    def _is_safe(self, code: str) -> bool:
        """Check for unsafe patterns"""
        for pattern in self.UNSAFE_PATTERNS:
            if re.search(pattern, code):
                return False
        return True

    def _execute_sync(self, code: str):
        """Synchronous execution with stdout capture"""

        # Capture stdout
        old_stdout = sys.stdout
        sys.stdout = captured = io.StringIO()

        try:
            # Create isolated namespace
            namespace = {"__builtins__": __builtins__}

            # Try expression evaluation first
            try:
                result = eval(code, namespace)
                if result is not None:
                    return str(result)
            except SyntaxError:
                # Fall back to exec
                exec(code, namespace)

            # Return captured output
            output = captured.getvalue()
            return output if output else "Code executed successfully"

        finally:
            sys.stdout = old_stdout

    def _truncate(self, text: str, max_len=None) -> str:
        """Truncate with ellipsis in middle"""
        max_len = max_len or self.max_output
        if len(text) <= max_len:
            return text

        half = max_len // 2
        return f"{text[:half]}...{text[-half:]}"
```

**TypeScript Equivalent** (using vm2):

```typescript
import { VM } from 'vm2';

class PythonExecutor {
    private readonly UNSAFE_PATTERNS = [
        /require\s*\(/,
        /import\s*\(/,
        /eval\s*\(/,
        /Function\s*\(/,
        /process\./,
        /child_process/
    ];

    constructor(
        private timeout = 10000,
        private maxOutput = 400
    ) {}

    async execute(code: string): Promise<ExecutionResult> {
        // Safety check
        if (!this.isSafe(code)) {
            return {
                error: "Unsafe code detected",
                status: "blocked"
            };
        }

        try {
            const vm = new VM({
                timeout: this.timeout,
                sandbox: {
                    console: this.createConsole()
                }
            });

            const result = vm.run(code);

            return {
                output: this.truncate(String(result)),
                status: "success"
            };

        } catch (error) {
            if (error.message.includes('timeout')) {
                return { error: "Execution timeout", status: "timeout" };
            }
            return { error: error.message, status: "error" };
        }
    }

    private isSafe(code: string): boolean {
        return !this.UNSAFE_PATTERNS.some(pattern =>
            pattern.test(code)
        );
    }

    private createConsole() {
        const logs: string[] = [];
        return {
            log: (...args: any[]) => logs.push(args.join(' ')),
            error: (...args: any[]) => logs.push(args.join(' '))
        };
    }

    private truncate(text: string): string {
        if (text.length <= this.maxOutput) return text;

        const half = Math.floor(this.maxOutput / 2);
        return `${text.slice(0, half)}...${text.slice(-half)}`;
    }
}
```

### Pattern 4: Async Tool Orchestration

**Python Implementation**:

```python
import asyncio
from typing import List, Dict, Callable
from dataclasses import dataclass

@dataclass
class ToolCall:
    name: str
    args: Dict
    result: any = None
    error: str = None

class ToolOrchestrator:
    def __init__(self, max_concurrent=32):
        self.tools: Dict[str, Callable] = {}
        self.semaphore = asyncio.Semaphore(max_concurrent)

    def register(self, name: str, handler: Callable):
        """Register a tool handler"""
        self.tools[name] = handler

    async def execute_parallel(
        self,
        calls: List[ToolCall]
    ) -> List[ToolCall]:
        """Execute multiple tool calls in parallel"""

        tasks = [
            self._execute_one(call)
            for call in calls
        ]

        results = await asyncio.gather(
            *tasks,
            return_exceptions=True
        )

        # Update calls with results
        for call, result in zip(calls, results):
            if isinstance(result, Exception):
                call.error = str(result)
            else:
                call.result = result

        return calls

    async def _execute_one(self, call: ToolCall):
        """Execute single tool with concurrency limit"""
        async with self.semaphore:
            handler = self.tools.get(call.name)

            if not handler:
                raise ValueError(f"Unknown tool: {call.name}")

            try:
                # Call handler (may be sync or async)
                if asyncio.iscoroutinefunction(handler):
                    return await handler(**call.args)
                else:
                    return await asyncio.to_thread(
                        handler, **call.args
                    )
            except Exception as e:
                raise Exception(f"Tool {call.name} failed: {e}")

# Usage example
orchestrator = ToolOrchestrator(max_concurrent=32)

# Register tools
orchestrator.register("web_search", google_search)
orchestrator.register("execute_code", python_executor.execute)
orchestrator.register("vqa", vision_qa)

# Execute in parallel
calls = [
    ToolCall("web_search", {"query": "Python async"}),
    ToolCall("execute_code", {"code": "print(2+2)"}),
    ToolCall("vqa", {"image": "img.jpg", "question": "What?"})
]

results = await orchestrator.execute_parallel(calls)
```

### Pattern 5: Prompt Engineering for Tool Use

**From DeepAgent Prompts**:

```python
# Tool search prompt
TOOL_SEARCH_PROMPT = """
You are solving this task:
{task}

Current progress:
{progress}

You can search for tools using: <tool_search>your search query</tool_search>

Think about what capabilities you need and search for relevant tools.
"""

# Tool call prompt (after retrieval)
TOOL_CALL_PROMPT = """
Task: {task}

Available tools:
{tool_docs}

To use a tool, format as:
<tool_call>
{{
    "name": "tool_name",
    "arguments": {{
        "param1": "value1"
    }}
}}
</tool_call>

You will receive results in:
<tool_call_result>
{{result}}
</tool_call_result>

Continue reasoning and making tool calls until you can provide <answer>.
"""

# Memory folding trigger
MEMORY_TRIGGER = """
If your reasoning is getting too long or you're stuck, you can emit:
<fold_thought>

This will compress your interaction history into structured memory,
allowing you to continue with a fresh perspective while retaining
key insights.
"""
```

---

## 7. Videos and Documentation

### Demo Videos

DeepAgent provides **three demonstration videos** showing real-world capabilities:

#### 1. RapidAPI Demo (rapidapi.mp4)
**Showcases**: General agent tasks with 16,000+ RapidAPIs

**Key Capabilities**:
- Dynamic tool discovery from massive toolsets
- End-to-end agentic reasoning
- Scalability across diverse API ecosystems

**Note**: "API responses are LLM-simulated in this demo to show the system's normal functionality" (some APIs unavailable)

**Insight for Weave-NN**: Tool simulation during development/testing is viable

#### 2. ALFWorld Demo (alfworld.mp4)
**Showcases**: Embodied AI navigation tasks

**Key Capabilities**:
- Interactive environment execution
- Action sequences: move, look, take, put
- Goal-oriented household task completion

**Insight for Weave-NN**: Pattern applicable to stateful tool interactions

#### 3. Deep Research Demo (deep_research.mp4)
**Showcases**: Research assistant with specialized tools

**Tool Stack Demonstrated**:
- Web search (Google Serper)
- Web browsing and scraping
- Code execution (Python)
- Visual QA (image understanding)
- File processing (PDF, DOC, PPT)

**Insight for Weave-NN**: Multi-modal tool composition for complex tasks

### Documentation Resources

**Primary Documentation**:
1. **README.md**: Setup, configuration, usage examples
2. **Paper (arXiv:2510.21618)**: Architecture, algorithms, experiments
3. **HuggingFace Datasets**: Data structure and annotations
4. **Config YAML**: All settings with inline comments

**Architecture Diagrams** (in `/figures`):
- **framework.png**: System component overview
- **comparison.png**: Performance vs baselines
- **overall_results.png**: Benchmark results

**Related Projects** (linked in README):
- **ARPO**: Agentic RL with entropy balancing
- **HiRA**: Hierarchical planning/execution
- **Tool-Star**: Multi-tool RL interaction
- **WebThinker** (NeurIPS 2025): Deep research
- **Search-o1** (EMNLP 2025): Search-enhanced reasoning

---

## 8. Integration Strategies for Weave-NN

### Direct Adoptions

#### 1. Semantic Tool Retrieval
**Implementation**: Use sentence-transformers with BGE embeddings

```python
# In Weave-NN tool registry
from weave.tools import ToolRetriever

retriever = ToolRetriever(model="BAAI/bge-large-en-v1.5")
retriever.index_tools(all_available_tools)

# At runtime
relevant_tools = retriever.retrieve(
    query="I need to analyze code quality",
    top_k=5
)
```

**Benefits**:
- No manual tool mapping
- Scales to 1000+ tools
- Better than keyword matching

#### 2. Three-Tier Memory System
**Implementation**: Add to cultivation pipeline

```python
# In cultivation/memory_manager.py
class CultivationMemory:
    def __init__(self):
        self.episode = {}   # Long-term patterns
        self.working = {}   # Current context
        self.tool = {}      # Tool usage learnings

    async def fold_if_needed(self, interactions):
        if self.should_fold(interactions):
            memory = await self.fold(interactions)
            return self.compress(interactions, memory)
        return interactions
```

**Benefits**:
- Prevent context explosion in long sessions
- Learn from tool usage patterns
- Strategic pivoting without losing context

#### 3. Sandboxed Execution
**Implementation**: For code analysis and transformation

```python
# In weave/execution/sandbox.py
from weave.execution import SafePythonExecutor

executor = SafePythonExecutor(timeout=10)

result = await executor.execute("""
import ast
# Analyze code structure
tree = ast.parse(code)
# Extract patterns
""")
```

**Benefits**:
- Safe code execution during cultivation
- AST transformations without risk
- Timeout protection

### Design Patterns to Emulate

#### 1. Dataset-Agnostic Tool Manager
**From DeepAgent**: Single `ToolManager` handles 8+ datasets

**For Weave-NN**:
```python
class UniversalToolManager:
    """Handle all Obsidian interactions through single interface"""

    def __init__(self, vault_path):
        self.vault = ObsidianVault(vault_path)
        self.tools = {
            "search_notes": SearchTool(self.vault),
            "create_note": CreateNoteTool(self.vault),
            "link_notes": LinkTool(self.vault),
            "extract_patterns": PatternTool(self.vault),
            "generate_graph": GraphTool(self.vault)
        }

    async def execute(self, tool_name, args):
        tool = self.tools.get(tool_name)
        return await tool.execute(**args)
```

#### 2. Parallel Evaluation Framework
**From DeepAgent**: Concurrent metrics with semaphore control

**For Weave-NN**:
```python
class CultivationEvaluator:
    def __init__(self, max_concurrent=50):
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def evaluate_batch(self, seeds):
        tasks = [self.evaluate_one(seed) for seed in seeds]
        results = await asyncio.gather(*tasks)
        return self.aggregate_metrics(results)

    async def evaluate_one(self, seed):
        async with self.semaphore:
            # Quality check
            # Coherence check
            # Alignment check
            return metrics
```

#### 3. Prompt-Based Memory Generation
**From DeepAgent**: LLM-generated structured memories

**For Weave-NN**:
```python
class SeedMemory:
    """Track cultivation session insights"""

    async def generate_session_memory(self, session):
        prompts = {
            "patterns": self.pattern_extraction_prompt(session),
            "insights": self.insight_prompt(session),
            "improvements": self.improvement_prompt(session)
        }

        memories = await asyncio.gather(*[
            self.llm.complete(p) for p in prompts.values()
        ])

        return SessionMemory(
            patterns=memories[0],
            insights=memories[1],
            improvements=memories[2]
        )
```

### Metrics and Evaluation

**Adopt from DeepAgent**:

```python
# In weave/evaluation/metrics.py
class SeedQualityMetrics:
    def compute(self, seed, reference):
        return {
            "coherence_score": self.coherence(seed),
            "alignment_score": self.alignment(seed, reference),
            "primitive_coverage": self.coverage(seed),
            "llm_quality_score": await self.llm_judge(seed)
        }

    async def llm_judge(self, seed):
        """LLM-based quality assessment"""
        prompt = f"""
Rate this seed's quality on scale 1-10:

Seed: {seed}

Consider:
- Clarity of concepts
- Practical applicability
- Alignment with primitives
- Actionability

Return JSON: {{"score": X, "reasoning": "..."}}
"""
        return await self.llm.complete(prompt)
```

### Configuration Management

**Adopt YAML-based config** (from `base_config.yaml`):

```yaml
# weaver/config/cultivation_config.yaml
vault:
  path: "/path/to/vault"
  detection_method: ".obsidian"

models:
  main:
    name: "claude-3-5-sonnet-20241022"
    api_key: "${ANTHROPIC_API_KEY}"

  evaluator:
    name: "claude-3-5-haiku-20241022"
    api_key: "${ANTHROPIC_API_KEY}"

tools:
  retriever:
    model: "BAAI/bge-large-en-v1.5"
    cache_dir: ".cache/embeddings"

  executor:
    timeout: 10
    max_output: 400

cultivation:
  batch_size: 10
  max_concurrent: 5
  memory:
    fold_threshold: 10
    enable_episode: true
    enable_working: true
    enable_tool: true

evaluation:
  metrics:
    - coherence
    - alignment
    - coverage
    - llm_quality
  llm_judgment_enabled: true
  concurrency: 20
```

---

## Key Takeaways for Weave-NN

### 1. Tool Management
- **Semantic retrieval** scales better than keyword matching
- **Unified interface** for all tools simplifies orchestration
- **Caching** (embeddings, results) improves performance
- **Graceful failure** prevents cascade errors

### 2. Memory Architecture
- **Three-tier system** (episode/working/tool) prevents context explosion
- **LLM-generated** memories more useful than raw logs
- **Compression triggers** can be length-based or explicit
- **Parallel generation** of memories faster than sequential

### 3. Evaluation Framework
- **Multiple metrics** provide richer signal than single score
- **LLM-based judgment** captures nuanced quality
- **Async evaluation** with semaphore control enables scale
- **Domain-specific** evaluators better than one-size-fits-all

### 4. Prompt Engineering
- **Structured markers** (`<tool_search>`, `<tool_call>`) parse easier
- **Memory integration** in system prompts maintains context
- **Examples** in prompts improve format compliance
- **Explicit instructions** for triggers (folding, etc.)

### 5. Code Safety
- **Pattern-based blocking** catches most unsafe code
- **Timeout protection** prevents infinite loops
- **Output truncation** prevents memory issues
- **Namespace isolation** contains execution

### 6. Training & RL
- **Simulated tools** enable training without API costs
- **Tool-call attribution** focuses learning on relevant tokens
- **Trajectory data** from real usage valuable for RL
- **Metadata** (time, steps, tools) aids reward shaping

### 7. System Design
- **Async-first** architecture enables parallelism
- **Factory patterns** for complex initialization
- **Modular tools** allow independent development
- **Config-driven** setup improves flexibility

---

## Comparison: DeepAgent vs Weave-NN

| Aspect | DeepAgent | Weave-NN | Adaptation Strategy |
|--------|-----------|----------|---------------------|
| **Primary Goal** | General-purpose tool-use agent | Obsidian knowledge cultivation | Adapt tool patterns to vault operations |
| **Tool Scale** | 16,000+ APIs | ~10-20 vault tools | Semantic retrieval still useful for extensibility |
| **Memory** | Episode/Working/Tool | Session-based | Add three-tier memory to cultivation |
| **Execution** | API calls, code, env | File operations, graph analysis | Sandboxed execution for transformations |
| **Evaluation** | 8 benchmarks, multi-metric | Seed quality, alignment | Multi-metric evaluation with LLM judgment |
| **Training** | ToolPO RL | Prompt optimization | Collect usage data for future fine-tuning |
| **Tech Stack** | vLLM, transformers | Anthropic SDK, local tools | Compatible, add sentence-transformers |

---

## Implementation Roadmap for Weave-NN

### Phase 1: Tool Infrastructure (Week 1-2)
- [ ] Implement semantic tool retriever
- [ ] Create unified tool manager interface
- [ ] Add tool caching system
- [ ] Build tool registry with embeddings

### Phase 2: Memory System (Week 3-4)
- [ ] Design three-tier memory structure
- [ ] Implement memory folding logic
- [ ] Add compression triggers
- [ ] Integrate memory into cultivation loop

### Phase 3: Evaluation Framework (Week 5-6)
- [ ] Multi-metric evaluation system
- [ ] LLM-based quality judgment
- [ ] Async evaluation with concurrency control
- [ ] Metric aggregation and reporting

### Phase 4: Safety & Execution (Week 7)
- [ ] Sandboxed code executor
- [ ] Pattern-based safety checks
- [ ] Timeout and resource limits
- [ ] Error handling and recovery

### Phase 5: Optimization (Week 8)
- [ ] Parallel operation execution
- [ ] Caching strategies
- [ ] Configuration management
- [ ] Performance monitoring

---

## References

1. **GitHub Repository**: https://github.com/RUC-NLPIR/DeepAgent
2. **Paper**: https://arxiv.org/abs/2510.21618
3. **Datasets**: https://huggingface.co/datasets/lixiaoxi45/DeepAgent-Datasets
4. **Models**: QwQ-32B, Qwen2.5/3 series, BGE embeddings
5. **Related Work**: ARPO, HiRA, Tool-Star, WebThinker, Search-o1

---

## Appendix: Code Snippets Reference

### Tool Manager Core
- `src/tools/tool_manager.py` - Central orchestration
- `src/tools/tool_search.py` - Semantic retrieval
- `src/tools/python_executor.py` - Safe code execution
- `src/tools/multimodal_tools.py` - VQA integration

### Evaluation Framework
- `src/evaluate/evaluate_base.py` - Core metrics
- `src/evaluate/evaluate_toolbench.py` - Tool benchmarks
- `src/evaluate/evaluate_alfworld.py` - Embodied AI

### Prompts & Memory
- `src/prompts/prompts_deepagent.py` - Main prompts
- Memory folding prompts for episode/working/tool

### Main Execution
- `src/run_deep_agent.py` - Entry point and reasoning loop
- Async orchestration with semaphore control
- Memory folding integration

### Configuration
- `config/base_config.yaml` - All system settings
- Model configs, API keys, paths, parameters

---

**Analysis Complete**: This comprehensive analysis provides concrete implementation patterns from DeepAgent that can be directly adapted to enhance Weave-NN's tool management, memory systems, and evaluation capabilities.
