# GOAP Decision Engine Literature Review

## Academic Research Summary (2023-2025)

This document synthesizes findings from recent academic papers on AI planning algorithms, autonomous agents, and multi-agent coordination relevant to designing a Goal-Oriented Action Planning (GOAP) decision engine.

---

## 1. Foundation: Goal-Oriented Action Planning (GOAP)

### Classical GOAP Architecture
GOAP was developed by Jeff Orkin at Monolith Productions for F.E.A.R. (2005), adapting STRIPS planning for real-time AI.

**Core Components:**
- **State**: World state representation
- **Agents**: Autonomous actors
- **Goals**: Desired end states
- **Actions**: Operations with preconditions and effects
- **Planner**: A* search over action space

**Key Insight**: GOAP eliminates the need for complex finite state machines by allowing agents to dynamically plan action sequences based on current state and goals.

### Modern Implementations
- [GOAP in Go](https://github.com/kelindar/goap) - Game AI planning library
- [General Purpose GOAP](https://github.com/stolk/GPGOAP) - Domain-independent planner

---

## 2. LLM-Based Multi-Agent Systems for Software Engineering

### Key Paper: [LLM-Based Multi-Agent Systems for Software Engineering](https://arxiv.org/abs/2404.04834)
**Authors**: Multiple | **Date**: April 2024 (updated July 2025)

**Key Findings:**
- LMA (LLM Multi-Agent) systems enable autonomous problem-solving
- Two primary components: orchestration platform + LLM-based agents
- Improved robustness and scalable solutions for complex software projects
- Challenges remain with very complex tasks (e.g., ChatDev unable to build Tetris autonomously)

**Architecture Insights:**
- Orchestration platform manages interactions and information flow
- Agents can be specialized for different roles
- Communication patterns significantly impact effectiveness

### Key Paper: [A Survey on Large Language Model based Autonomous Agents](https://arxiv.org/abs/2308.11432)
**Authors**: Tsinghua University | **Date**: August 2023 (updated 2025)

**Unified Framework Components:**
1. **Planning**: Subgoal decomposition, handling complex tasks
2. **Memory**: Short-term and long-term storage
3. **Tool Use**: External API integration
4. **Action**: Execution and environment interaction

---

## 3. Planning Approaches for Code Generation

### 3.1 ReAct: Reasoning + Acting
**Paper**: [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)

**Approach:**
- Interleaved reasoning traces and task-specific actions
- Reasoning helps induce, track, and update action plans
- Actions gather information from external sources

**Extensions:**
- **Pre-Act** (2025): Multi-step planning before acting - 70% improvement in Action Recall
- **StateAct** (2024): State tracking for better planning
- **ReflAct** (2025): Goal-state reflection before action selection

### 3.2 Tree of Thoughts (ToT)
**Paper**: [Tree of Thoughts: Deliberate Problem Solving](https://arxiv.org/abs/2305.10601)
**Venue**: NeurIPS 2023

**Key Innovation:**
- Generalizes Chain of Thought to exploration over coherent thought units
- Enables deliberate decision making
- Supports backtracking and look-ahead
- Significantly enhances problem-solving on planning/search tasks

**Code Generation Extensions:**
- **RethinkMCTS** (2024): MCTS + thought refinement for code
- **Tree-of-Code** (2024): Self-expanding exploration tree for programs
- [Can GitHub Issues be Solved with ToT?](https://arxiv.org/html/2405.13057v1) - Applied ToT to SWE-bench

### 3.3 Monte Carlo Tree Search (MCTS) for Code

**Key Papers:**

| Paper | Contribution |
|-------|--------------|
| [GIF-MCTS](https://arxiv.org/abs/2405.15383) | Code World Models generation with MCTS |
| [RethinkMCTS](https://arxiv.org/html/2409.09584v1) | Refining erroneous thoughts in code gen |
| [SWE-Search](https://arxiv.org/html/2410.20285v2) | 23% improvement with MCTS for software agents |
| [VerMCTS](https://arxiv.org/abs/2402.08147) | MCTS + verifier for verified programs |

**SWE-Search Key Results:**
- 23% relative performance improvement across 5 models
- MCTS enables strategic search with iterative self-evaluation
- Performance scales with increased search depth

### 3.4 Hierarchical Task Network (HTN) Planning
**Paper**: [Structural Complexity Analysis of HTN Planning](https://arxiv.org/abs/2401.14174)

**HTN Advantages for GOAP:**
- Natural task decomposition (compound -> primitive tasks)
- Method-based flexibility
- Reusable task templates
- [GPT-HTN-Planner](https://github.com/DaemonIB/GPT-HTN-Planner) - LLM integration

**Algorithms:**
- Total-order Forward Decomposition (TFD)
- SHOP2 (University of Maryland)
- MCTS-HTN hybrid approaches

---

## 4. Multi-Agent Coordination Frameworks

### 4.1 AgentCoder
**Paper**: [AgentCoder: Multi-Agent Code Generation](https://arxiv.org/abs/2312.13010)

**Architecture:**
1. **Programmer Agent**: Code generation and refinement
2. **Test Designer Agent**: Test case generation
3. **Test Executor Agent**: Execution and feedback

**Results:**
- 96.3% pass@1 on HumanEval (GPT-4)
- 91.8% pass@1 on MBPP
- More token-efficient than ChatDev/MetaGPT

### 4.2 MetaGPT
**Paper**: [MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352)

**Key Innovation:**
- Encodes Standardized Operating Procedures (SOPs) into prompts
- Assembly line paradigm for role assignment
- Agents communicate via structured documents (not dialogue)
- Roles: Product Manager, Architect, Engineer, etc.

**Results:**
- 85.9% and 87.7% Pass@1 on benchmarks
- Better quality than ChatDev (3.9 vs 2.1 average score)

### 4.3 ChatDev
**Paper**: [ChatDev: Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924)

**Approach:**
- Chat-powered development via "chat chain"
- Communicative dehallucination
- Waterfall-style lifecycle phases
- Natural language dialogue between agents

### 4.4 Cross-Team Orchestration (Croto)
**Paper**: [Multi-Agent Collaboration via Cross-Team Orchestration](https://arxiv.org/abs/2406.08979)

**Innovation:**
- Scalable multi-team framework
- Teams propose solutions independently then collaborate
- Superior software quality vs single-team approaches

### 4.5 Coordination Strategies
**Paper**: [Multi-Agent Collaboration Mechanisms Survey](https://arxiv.org/html/2501.06322v1)

**Taxonomy:**
- **Actors**: Agents involved in collaboration
- **Type**: Cooperation, competition, or coopetition
- **Structure**: Peer-to-peer, centralized, distributed
- **Strategy**: Role-based, rule-based, model-based

**Planning Strategies:**
- CPDE: Centralized Planning, Decentralized Execution
- DPDE: Decentralized Planning, Decentralized Execution

---

## 5. Autonomous Coding Agents

### 5.1 SWE-agent
**Paper**: [SWE-agent: Agent-Computer Interfaces](https://arxiv.org/abs/2405.15793)
**Venue**: NeurIPS 2024

**Key Contribution:**
- Custom Agent-Computer Interface (ACI)
- Enhanced file creation/editing, repository navigation, test execution
- 12.5% pass@1 on SWE-bench (state-of-the-art at time)

### 5.2 Devin
- First AI "software engineer" (March 2024)
- End-to-end software task completion
- 13.86% resolve rate on SWE-bench
- Uses shell, browser, and IDE tools

### 5.3 Key Architectural Patterns
From [AI Agentic Programming Survey](https://arxiv.org/html/2508.11126v2):

1. **Autonomous Planning**: Multi-step reasoning before action
2. **Tool-Augmented Execution**: Compilers, debuggers, test runners
3. **Iterative Refinement**: Feedback-based improvement loops
4. **Full SDLC Coverage**: Requirements to deployment

---

## 6. World Models for Agent Planning

### Key Paper: [WebDreamer - LLMs as World Models](https://arxiv.org/abs/2411.06559)

**"Dreaming" Approach:**
- Agent imagines outcomes before committing to actions
- Simulates interaction sequences safely
- Model-based planning without live environment interaction

**Results:**
- Competitive with tree search while 4-5x more efficient
- Trained world model (Dreamer-7B) matches GPT-4o

### Global-Local World Models (GLoW)
**Paper**: [Dual-Scale World Models for LLM Agents](https://arxiv.org/html/2509.24116v1)

**Innovation:**
- Maintains world models at two scales
- Global: Overall task understanding
- Local: Immediate action context
- Enables effective exploration in hard problems

---

## 7. Reinforcement Learning for Code Generation

### Process Reward Models
**Paper**: [AgentPRM: Process Reward Models for LLM Agents](https://arxiv.org/html/2502.10325v1)

**Key Insight:**
- Process rewards > Outcome rewards for agent training
- InversePRM learns from demonstrations
- Small models can outperform GPT-4o with proper PRMs

### Eureka: LLM-Designed Rewards
**Paper**: [Eureka: Human-Level Reward Design](https://arxiv.org/abs/2310.12931)

**Approach:**
- LLMs generate reward function code
- Evolutionary optimization over reward space
- Outperforms human experts on 83% of tasks (29 environments)

### Survey: [Enhancing Code LLMs with RL](https://arxiv.org/html/2412.20367v1)

**Techniques:**
- PPO with value function and KL penalties
- Direct Preference Optimization (DPO) - no explicit reward model
- CodeRL with critic networks for functional correctness

---

## 8. Recommendations for GOAP Decision Engine Design

Based on this literature review, here are key recommendations:

### 8.1 Core Architecture
```
GOAP Decision Engine
├── World State Manager (inspired by world models research)
│   ├── Current state representation
│   ├── State prediction/simulation
│   └── Dual-scale modeling (global + local)
├── Goal Manager
│   ├── Goal decomposition (HTN-style)
│   ├── Goal prioritization
│   └── Conflict resolution
├── Action Library
│   ├── Primitive actions (atomic operations)
│   ├── Compound actions (templates)
│   └── Precondition/effect specifications
├── Planner
│   ├── MCTS-based search (from SWE-Search)
│   ├── ToT-style exploration
│   └── ReAct-style reasoning integration
└── Multi-Agent Coordinator
    ├── Role assignment (MetaGPT SOPs)
    ├── Communication protocol
    └── Consensus mechanisms
```

### 8.2 Key Design Principles

1. **Hierarchical Planning**: Use HTN-style decomposition for complex goals
2. **MCTS Search**: Implement Monte Carlo Tree Search for action selection
3. **World Model Simulation**: "Dream" outcomes before execution
4. **Process Rewards**: Use step-wise feedback, not just final outcomes
5. **Multi-Agent Specialization**: AgentCoder-style role separation
6. **Iterative Refinement**: Built-in retry and error correction loops

### 8.3 Novel Algorithm Combinations

| Component | Approach | Source |
|-----------|----------|--------|
| Planning | MCTS + ToT + ReAct | SWE-Search, RethinkMCTS |
| Coordination | SOP-based roles | MetaGPT |
| Execution | ACI design | SWE-agent |
| Learning | Process reward models | AgentPRM |
| Simulation | LLM world models | WebDreamer |

### 8.4 Suggested Implementation Phases

**Phase 1: Foundation**
- Basic GOAP with A* planner
- Action/precondition/effect specification
- World state management

**Phase 2: Enhanced Planning**
- MCTS integration for better search
- Tree of Thoughts exploration
- HTN-style task decomposition

**Phase 3: Multi-Agent**
- Specialized agent roles
- Communication protocols
- Coordination strategies

**Phase 4: Learning & Adaptation**
- Process reward models
- Experience replay
- Meta-learning across tasks

---

## 9. Key Paper Citations

### Must-Read Papers
1. [LLM-Based Multi-Agent Systems for SE](https://arxiv.org/abs/2404.04834)
2. [SWE-agent](https://arxiv.org/abs/2405.15793)
3. [MetaGPT](https://arxiv.org/abs/2308.00352)
4. [AgentCoder](https://arxiv.org/abs/2312.13010)
5. [Tree of Thoughts](https://arxiv.org/abs/2305.10601)
6. [SWE-Search](https://arxiv.org/html/2410.20285v2)
7. [ReAct](https://arxiv.org/abs/2210.03629)

### Supporting Papers
- [Self-Planning Code Generation](https://arxiv.org/abs/2303.06689)
- [AI Agentic Programming Survey](https://arxiv.org/html/2508.11126v2)
- [Code Generation with LLM-based Agents Survey](https://arxiv.org/html/2508.00083v1)
- [Multi-Agent Collaboration Mechanisms Survey](https://arxiv.org/html/2501.06322v1)
- [WebDreamer World Models](https://arxiv.org/abs/2411.06559)
- [Eureka Reward Design](https://arxiv.org/abs/2310.12931)

---

## 10. Research Gaps and Opportunities

1. **GOAP + LLM Integration**: Limited research on adapting classical GOAP for LLM agents
2. **Long-horizon Planning**: Most systems struggle with very complex tasks
3. **Verification**: More work needed on verified planning for code generation
4. **Efficiency**: Token usage optimization remains a challenge
5. **Generalization**: Transfer learning across different software domains

---

*Generated: December 2024*
*Last Updated: December 29, 2025*
