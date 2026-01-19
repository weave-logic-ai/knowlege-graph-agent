# Blockchain Ledger Foundation for Weave-NN

## Executive Summary

This document specifies a **private blockchain ledger system** for weave-nn that:
- Tracks all human-AI interactions immutably
- Implements a token economy with costs/rewards
- Enables hash-based retrieval for reinforcement learning
- Provides audit trails and cost analysis
- Starts simple (SQLite MVP) with clear path to distributed systems

**Key Insight**: By tying transaction hashes to cost/reward deltas, we create both an immutable training dataset AND a queryable balance ledger.

---

## 1. Blockchain Architecture

### 1.1 Private Blockchain Design

```typescript
/**
 * Private blockchain for weave-nn
 * - Single-node consensus for MVP (can scale to multi-node)
 * - Immutable transaction history
 * - Fast hash-based retrieval
 * - Integrated with claude-flow memory
 */

interface Block {
  index: number;                    // Block height
  timestamp: number;                // Unix timestamp (ms)
  transactions: Transaction[];      // Batch of transactions
  previousHash: string;             // SHA-256 of previous block
  hash: string;                     // SHA-256 of this block
  merkleRoot: string;               // Merkle root of transactions
  nonce: number;                    // For future PoW (MVP: always 0)
}

interface Transaction {
  hash: string;                     // SHA-256(timestamp + actor + action + metadata)
  timestamp: number;                // Unix timestamp (ms)
  blockIndex: number;               // Which block contains this

  // Core fields
  type: TransactionType;            // See section 1.3
  actor: ActorIdentity;             // Who initiated
  target?: ActorIdentity;           // Who received (for transfers)

  // Token economics
  delta: number;                    // Token change (+reward, -cost)
  balanceBefore: number;            // Actor's balance before
  balanceAfter: number;             // Actor's balance after

  // Context (for training)
  metadata: TransactionMetadata;

  // Signature (future: multi-sig)
  signature?: string;               // ECDSA signature
}

interface ActorIdentity {
  id: string;                       // UUID for user/agent
  type: 'human' | 'agent';          // Actor type
  name?: string;                    // Display name
  publicKey?: string;               // For signatures (future)
}

enum TransactionType {
  // Costs (negative delta)
  TASK_EXECUTION = 'task_execution',           // Agent executes task
  API_CALL = 'api_call',                       // LLM API call
  COMPUTE_TIME = 'compute_time',               // CPU/GPU usage
  STORAGE_WRITE = 'storage_write',             // Data storage

  // Rewards (positive delta)
  PROMPT_QUALITY = 'prompt_quality',           // Good prompt from human
  FEEDBACK_GIVEN = 'feedback_given',           // Human provides rating
  SUCCESS_BONUS = 'success_bonus',             // Task succeeded
  LEARNING_BONUS = 'learning_bonus',           // Agent learned pattern
  IMPROVEMENT = 'improvement',                 // Human improved prompting

  // Penalties (negative delta)
  FAILURE_PENALTY = 'failure_penalty',         // Task failed
  BAD_OUTPUT = 'bad_output',                   // Poor quality output

  // Transfers
  TIP = 'tip',                                 // Human tips agent
  REWARD_HUMAN = 'reward_human',               // Agent rewards human

  // System
  GENESIS = 'genesis',                         // Initial balance
  ADJUSTMENT = 'adjustment',                   // Manual correction
}

interface TransactionMetadata {
  // Task context
  taskId?: string;                  // Reference to task
  taskType?: string;                // Type of task
  taskDescription?: string;         // What was requested

  // Execution metrics
  executionTimeMs?: number;         // How long it took
  tokensUsed?: number;              // LLM tokens consumed
  apiCalls?: number;                // Number of API calls

  // Quality metrics
  qualityScore?: number;            // 0-1 quality rating
  estimatedCost?: number;           // Predicted token cost
  actualCost?: number;              // Actual token cost
  variance?: number;                // actualCost - estimatedCost

  // Learning signals
  promptClarity?: number;           // 0-1 how clear was prompt
  outputRelevance?: number;         // 0-1 how relevant was output
  userSatisfaction?: number;        // 0-1 user rating

  // References (for retrieval)
  parentHash?: string;              // Previous related transaction
  relatedHashes?: string[];         // Other relevant transactions

  // Training data
  input?: string;                   // What was requested
  output?: string;                  // What was produced
  context?: Record<string, unknown>; // Additional context
}
```

### 1.2 Block Creation

```typescript
class WeaveBlockchain {
  private chain: Block[] = [];
  private pendingTransactions: Transaction[] = [];
  private accounts: Map<string, Account> = new Map();

  // Configuration
  private readonly BLOCK_SIZE = 100;          // Transactions per block
  private readonly BLOCK_TIME_MS = 60000;     // 1 minute blocks
  private readonly INITIAL_BALANCE = {
    human: 1000,                              // Humans start with 1000 tokens
    agent: 100,                               // Agents start with 100 tokens
  };

  constructor() {
    this.createGenesisBlock();
  }

  private createGenesisBlock(): void {
    const genesis: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0'.repeat(64),
      hash: '',
      merkleRoot: '',
      nonce: 0,
    };

    genesis.hash = this.calculateBlockHash(genesis);
    genesis.merkleRoot = this.calculateMerkleRoot([]);
    this.chain.push(genesis);
  }

  private calculateBlockHash(block: Block): string {
    const data = `${block.index}${block.timestamp}${block.previousHash}${block.merkleRoot}${block.nonce}`;
    return sha256(data);
  }

  private calculateMerkleRoot(transactions: Transaction[]): string {
    if (transactions.length === 0) return sha256('empty');
    if (transactions.length === 1) return transactions[0].hash;

    // Build merkle tree
    let hashes = transactions.map(t => t.hash);
    while (hashes.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : left;
        nextLevel.push(sha256(left + right));
      }
      hashes = nextLevel;
    }
    return hashes[0];
  }

  async createBlock(): Promise<Block> {
    const previousBlock = this.chain[this.chain.length - 1];
    const transactions = this.pendingTransactions.splice(0, this.BLOCK_SIZE);

    const block: Block = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      transactions,
      previousHash: previousBlock.hash,
      hash: '',
      merkleRoot: this.calculateMerkleRoot(transactions),
      nonce: 0,
    };

    block.hash = this.calculateBlockHash(block);
    this.chain.push(block);

    // Persist to storage
    await this.persistBlock(block);

    return block;
  }

  // Auto-create blocks on timer or size threshold
  startBlockProduction(): void {
    setInterval(() => {
      if (this.pendingTransactions.length >= this.BLOCK_SIZE) {
        this.createBlock();
      }
    }, this.BLOCK_TIME_MS);
  }
}
```

### 1.3 Transaction Creation

```typescript
interface Account {
  id: string;
  type: 'human' | 'agent';
  balance: number;
  createdAt: number;
  lastTransactionHash?: string;
}

class TransactionBuilder {
  async createTransaction(
    type: TransactionType,
    actor: ActorIdentity,
    delta: number,
    metadata: TransactionMetadata,
    target?: ActorIdentity
  ): Promise<Transaction> {

    // Get current balance
    const account = await this.getOrCreateAccount(actor);
    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore + delta;

    // Validate sufficient funds for costs
    if (delta < 0 && balanceAfter < 0) {
      throw new Error(`Insufficient balance: ${actor.id} has ${balanceBefore}, needs ${Math.abs(delta)}`);
    }

    const timestamp = Date.now();
    const txData = {
      timestamp,
      blockIndex: -1,  // Set when added to block
      type,
      actor,
      target,
      delta,
      balanceBefore,
      balanceAfter,
      metadata,
    };

    // Calculate hash (immutable identifier)
    const hash = this.calculateTransactionHash(txData);

    const transaction: Transaction = {
      ...txData,
      hash,
    };

    // Update account balance
    account.balance = balanceAfter;
    account.lastTransactionHash = hash;
    await this.updateAccount(account);

    return transaction;
  }

  private calculateTransactionHash(tx: Partial<Transaction>): string {
    const data = JSON.stringify({
      timestamp: tx.timestamp,
      type: tx.type,
      actor: tx.actor,
      target: tx.target,
      delta: tx.delta,
      metadata: tx.metadata,
    });
    return sha256(data);
  }

  private async getOrCreateAccount(actor: ActorIdentity): Promise<Account> {
    let account = this.accounts.get(actor.id);
    if (!account) {
      account = {
        id: actor.id,
        type: actor.type,
        balance: actor.type === 'human'
          ? this.INITIAL_BALANCE.human
          : this.INITIAL_BALANCE.agent,
        createdAt: Date.now(),
      };

      // Create genesis transaction for initial balance
      const genesisTx = await this.createGenesisTransaction(actor, account.balance);
      account.lastTransactionHash = genesisTx.hash;

      this.accounts.set(actor.id, account);
      await this.persistAccount(account);
    }
    return account;
  }
}
```

---

## 2. Token Economics Model

### 2.1 Token Flow

```typescript
/**
 * Token economics for weave-nn interactions
 *
 * Principle: Align incentives between humans and agents
 * - Humans pay for compute/storage
 * - Humans earn for quality inputs and feedback
 * - Agents earn for successful task completion
 * - Agents pay for API calls and compute time
 */

interface TokenCostTable {
  // API Costs (negative delta for caller)
  apiCall: {
    gpt4: -10,                      // 10 tokens per GPT-4 call
    gpt35: -3,                      // 3 tokens per GPT-3.5 call
    claude: -8,                     // 8 tokens per Claude call
    embedding: -1,                  // 1 token per embedding
  };

  // Compute Costs (negative delta)
  compute: {
    perSecond: -0.1,                // 0.1 tokens per second
    perMb: -0.5,                    // 0.5 tokens per MB processed
  };

  // Storage Costs (negative delta)
  storage: {
    perMbMonth: -1,                 // 1 token per MB per month
  };

  // Rewards (positive delta)
  rewards: {
    promptQuality: {
      excellent: 50,                // Very clear, specific prompt
      good: 20,                     // Clear prompt
      average: 5,                   // Acceptable prompt
    },
    feedbackGiven: 10,              // User provides rating
    successBonus: {
      small: 10,                    // Small task succeeded
      medium: 50,                   // Medium task succeeded
      large: 200,                   // Large task succeeded
      xl: 500,                      // XL task succeeded
    },
    learningBonus: 30,              // Agent learned new pattern
    improvement: 15,                // Human improved prompting
  };

  // Penalties (negative delta)
  penalties: {
    failurePenalty: -50,            // Task failed
    badOutput: -20,                 // Poor quality output
  };
}

class TokenEconomics {
  private costs: TokenCostTable;

  // Calculate cost for task execution
  calculateTaskCost(
    taskSize: 'S' | 'M' | 'L' | 'XL',
    estimatedTime: number,
    apiCalls: number,
    model: 'gpt4' | 'gpt35' | 'claude'
  ): number {
    const computeCost = estimatedTime * this.costs.compute.perSecond;
    const apiCost = apiCalls * this.costs.apiCall[model];
    return Math.floor(computeCost + apiCost);
  }

  // Calculate reward for task success
  calculateSuccessReward(
    taskSize: 'S' | 'M' | 'L' | 'XL',
    qualityScore: number,  // 0-1
    ahead_of_estimate: boolean
  ): number {
    let baseReward = this.costs.rewards.successBonus[taskSize.toLowerCase()];

    // Bonus for high quality
    baseReward *= (0.5 + qualityScore * 0.5);

    // Bonus for beating estimate
    if (ahead_of_estimate) {
      baseReward *= 1.2;
    }

    return Math.floor(baseReward);
  }

  // Calculate reward for prompt quality
  calculatePromptReward(
    clarity: number,      // 0-1
    specificity: number,  // 0-1
    context: number       // 0-1
  ): number {
    const avgScore = (clarity + specificity + context) / 3;

    if (avgScore >= 0.9) return this.costs.rewards.promptQuality.excellent;
    if (avgScore >= 0.7) return this.costs.rewards.promptQuality.good;
    if (avgScore >= 0.5) return this.costs.rewards.promptQuality.average;
    return 0;
  }
}
```

### 2.2 Balance Management

```typescript
class BalanceLedger {
  private blockchain: WeaveBlockchain;

  // Get current balance (from latest transaction)
  async getBalance(actorId: string): Promise<number> {
    const account = await this.blockchain.getAccount(actorId);
    return account?.balance ?? 0;
  }

  // Get balance history (all transactions)
  async getBalanceHistory(actorId: string): Promise<BalanceSnapshot[]> {
    const transactions = await this.blockchain.getTransactionsByActor(actorId);

    return transactions.map(tx => ({
      timestamp: tx.timestamp,
      hash: tx.hash,
      type: tx.type,
      delta: tx.delta,
      balance: tx.balanceAfter,
      metadata: tx.metadata,
    }));
  }

  // Get raw balance from ledger (recalculate from genesis)
  async calculateRawBalance(actorId: string): Promise<number> {
    const transactions = await this.blockchain.getTransactionsByActor(actorId);

    let balance = 0;
    for (const tx of transactions) {
      if (tx.type === TransactionType.GENESIS) {
        balance = tx.delta;  // Initial balance
      } else if (tx.actor.id === actorId) {
        balance += tx.delta;  // Add/subtract for this actor
      }
    }

    return balance;
  }

  // Verify balance integrity
  async verifyBalance(actorId: string): Promise<boolean> {
    const currentBalance = await this.getBalance(actorId);
    const rawBalance = await this.calculateRawBalance(actorId);

    if (Math.abs(currentBalance - rawBalance) > 0.01) {
      console.error(`Balance mismatch for ${actorId}: current=${currentBalance}, raw=${rawBalance}`);
      return false;
    }

    return true;
  }
}
```

### 2.3 Token Exchange (Tips & Rewards)

```typescript
class TokenExchange {
  private blockchain: WeaveBlockchain;

  // Human tips agent for good work
  async tipAgent(
    humanId: string,
    agentId: string,
    amount: number,
    reason?: string
  ): Promise<Transaction> {

    // Deduct from human
    const deductTx = await this.blockchain.createTransaction(
      TransactionType.TIP,
      { id: humanId, type: 'human' },
      -amount,
      {
        taskDescription: reason,
        relatedHashes: [],
      },
      { id: agentId, type: 'agent' }
    );

    // Add to agent
    const addTx = await this.blockchain.createTransaction(
      TransactionType.TIP,
      { id: agentId, type: 'agent' },
      amount,
      {
        taskDescription: reason,
        relatedHashes: [deductTx.hash],
      },
      { id: humanId, type: 'human' }
    );

    return addTx;
  }

  // Agent rewards human for clear prompt
  async rewardHuman(
    agentId: string,
    humanId: string,
    promptQuality: number,  // 0-1
    metadata: Partial<TransactionMetadata>
  ): Promise<Transaction> {

    const economics = new TokenEconomics();
    const amount = economics.calculatePromptReward(
      promptQuality,
      metadata.promptClarity ?? promptQuality,
      metadata.context ? 0.8 : 0.5
    );

    return this.blockchain.createTransaction(
      TransactionType.REWARD_HUMAN,
      { id: humanId, type: 'human' },
      amount,
      {
        ...metadata,
        qualityScore: promptQuality,
      },
      { id: agentId, type: 'agent' }
    );
  }
}
```

---

## 3. Transaction Types & Use Cases

### 3.1 Task Execution Flow

```typescript
/**
 * Example: User asks agent to implement a feature
 *
 * Transaction sequence:
 * 1. Human creates task (no cost yet)
 * 2. Agent estimates cost (creates estimate transaction)
 * 3. Agent executes task (deducts actual cost)
 * 4. Task succeeds → success bonus to both
 * 5. Human rates output → feedback reward to human
 * 6. Human tips agent → token transfer
 */

class TaskExecutionFlow {
  async executeTask(
    taskId: string,
    humanId: string,
    agentId: string,
    taskDescription: string,
    estimatedSize: 'S' | 'M' | 'L' | 'XL'
  ): Promise<TaskExecutionResult> {

    const economics = new TokenEconomics();
    const transactions: Transaction[] = [];

    // Step 1: Estimate cost
    const estimatedCost = economics.calculateTaskCost(
      estimatedSize,
      this.estimateTimeSeconds(estimatedSize),
      this.estimateApiCalls(estimatedSize),
      'claude'
    );

    const estimateTx = await this.blockchain.createTransaction(
      TransactionType.TASK_EXECUTION,
      { id: agentId, type: 'agent' },
      0,  // No cost yet, just estimate
      {
        taskId,
        taskType: 'feature_implementation',
        taskDescription,
        estimatedCost,
      }
    );
    transactions.push(estimateTx);

    // Step 2: Execute task (actual cost)
    const startTime = Date.now();
    const { success, output, apiCalls } = await this.doWork(taskDescription);
    const executionTime = Date.now() - startTime;

    const actualCost = economics.calculateTaskCost(
      estimatedSize,
      executionTime / 1000,
      apiCalls,
      'claude'
    );

    const executionTx = await this.blockchain.createTransaction(
      TransactionType.TASK_EXECUTION,
      { id: agentId, type: 'agent' },
      -actualCost,  // Deduct actual cost
      {
        taskId,
        taskType: 'feature_implementation',
        taskDescription,
        estimatedCost,
        actualCost,
        variance: actualCost - estimatedCost,
        executionTimeMs: executionTime,
        apiCalls,
        parentHash: estimateTx.hash,
      }
    );
    transactions.push(executionTx);

    // Step 3: Success/failure outcome
    if (success) {
      const qualityScore = await this.evaluateOutput(output);
      const reward = economics.calculateSuccessReward(
        estimatedSize,
        qualityScore,
        actualCost < estimatedCost
      );

      // Reward agent
      const agentRewardTx = await this.blockchain.createTransaction(
        TransactionType.SUCCESS_BONUS,
        { id: agentId, type: 'agent' },
        reward,
        {
          taskId,
          qualityScore,
          relatedHashes: [executionTx.hash],
        }
      );
      transactions.push(agentRewardTx);

      // Small reward to human for creating good task
      const humanRewardTx = await this.blockchain.createTransaction(
        TransactionType.SUCCESS_BONUS,
        { id: humanId, type: 'human' },
        Math.floor(reward * 0.2),  // 20% of agent reward
        {
          taskId,
          qualityScore,
          relatedHashes: [executionTx.hash],
        }
      );
      transactions.push(humanRewardTx);

    } else {
      // Penalty for failure
      const penaltyTx = await this.blockchain.createTransaction(
        TransactionType.FAILURE_PENALTY,
        { id: agentId, type: 'agent' },
        -50,
        {
          taskId,
          relatedHashes: [executionTx.hash],
        }
      );
      transactions.push(penaltyTx);
    }

    return {
      success,
      transactions,
      estimatedCost,
      actualCost,
    };
  }
}
```

### 3.2 Prompt Quality Assessment

```typescript
class PromptQualityAssessor {
  async assessPrompt(
    humanId: string,
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<Transaction> {

    // Analyze prompt quality
    const clarity = await this.analyzeClarity(prompt);
    const specificity = await this.analyzeSpecificity(prompt);
    const hasContext = context !== undefined;

    const economics = new TokenEconomics();
    const reward = economics.calculatePromptReward(
      clarity,
      specificity,
      hasContext ? 0.8 : 0.5
    );

    return this.blockchain.createTransaction(
      TransactionType.PROMPT_QUALITY,
      { id: humanId, type: 'human' },
      reward,
      {
        input: prompt,
        promptClarity: clarity,
        context: context ?? {},
        qualityScore: (clarity + specificity) / 2,
      }
    );
  }

  private async analyzeClarity(prompt: string): Promise<number> {
    // Simple heuristics (can be ML model later)
    const hasQuestion = /\?/.test(prompt);
    const hasDetails = prompt.length > 50;
    const hasExample = /example|like|such as/i.test(prompt);

    let score = 0.5;
    if (hasQuestion) score += 0.2;
    if (hasDetails) score += 0.2;
    if (hasExample) score += 0.1;

    return Math.min(score, 1.0);
  }

  private async analyzeSpecificity(prompt: string): Promise<number> {
    // Count specific terms
    const specificTerms = [
      'implement', 'create', 'design', 'analyze', 'optimize',
      'test', 'debug', 'refactor', 'document', 'deploy'
    ];

    const found = specificTerms.filter(term =>
      new RegExp(term, 'i').test(prompt)
    ).length;

    return Math.min(found / 3, 1.0);
  }
}
```

---

## 4. Hash-Based Retrieval System

### 4.1 Transaction Lookup

```typescript
/**
 * Hash-based retrieval for training data
 *
 * Every transaction gets SHA-256 hash → immutable pointer
 * Use hashes to:
 * - Retrieve full transaction details
 * - Link related transactions
 * - Build training datasets
 * - Trace decision chains
 */

class HashRetrieval {
  private blockchain: WeaveBlockchain;
  private cache: LRUCache<string, Transaction>;

  // Get transaction by hash (O(1) with cache)
  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    // Check cache first
    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }

    // Query database
    const tx = await this.db.query(
      'SELECT * FROM transactions WHERE hash = ?',
      [hash]
    );

    if (tx) {
      this.cache.set(hash, tx);
    }

    return tx;
  }

  // Get related transactions (breadth-first traversal)
  async getRelatedTransactions(
    rootHash: string,
    maxDepth: number = 3
  ): Promise<Transaction[]> {

    const visited = new Set<string>();
    const queue: Array<[string, number]> = [[rootHash, 0]];
    const related: Transaction[] = [];

    while (queue.length > 0) {
      const [hash, depth] = queue.shift()!;

      if (visited.has(hash) || depth > maxDepth) continue;
      visited.add(hash);

      const tx = await this.getTransactionByHash(hash);
      if (!tx) continue;

      related.push(tx);

      // Add parent and related hashes
      if (tx.metadata.parentHash) {
        queue.push([tx.metadata.parentHash, depth + 1]);
      }
      if (tx.metadata.relatedHashes) {
        for (const relHash of tx.metadata.relatedHashes) {
          queue.push([relHash, depth + 1]);
        }
      }
    }

    return related;
  }

  // Build training example from transaction graph
  async buildTrainingExample(rootHash: string): Promise<TrainingExample> {
    const transactions = await this.getRelatedTransactions(rootHash);

    // Extract input/output/reward sequence
    const example: TrainingExample = {
      id: rootHash,
      timestamp: transactions[0].timestamp,
      input: '',
      output: '',
      actions: [],
      rewards: [],
      context: {},
    };

    for (const tx of transactions) {
      // Collect inputs (prompts, task descriptions)
      if (tx.metadata.input) {
        example.input += tx.metadata.input + '\n';
      }
      if (tx.metadata.taskDescription) {
        example.input += tx.metadata.taskDescription + '\n';
      }

      // Collect outputs
      if (tx.metadata.output) {
        example.output += tx.metadata.output + '\n';
      }

      // Collect actions (transaction types)
      example.actions.push({
        type: tx.type,
        timestamp: tx.timestamp,
        hash: tx.hash,
      });

      // Collect rewards (deltas)
      if (tx.delta !== 0) {
        example.rewards.push({
          amount: tx.delta,
          type: tx.type,
          timestamp: tx.timestamp,
        });
      }

      // Merge context
      if (tx.metadata.context) {
        example.context = {
          ...example.context,
          ...tx.metadata.context,
        };
      }
    }

    return example;
  }
}

interface TrainingExample {
  id: string;                     // Root transaction hash
  timestamp: number;              // When example started
  input: string;                  // Combined inputs (prompts, tasks)
  output: string;                 // Combined outputs (results)
  actions: Array<{                // Sequence of actions
    type: TransactionType;
    timestamp: number;
    hash: string;
  }>;
  rewards: Array<{                // Reward signals
    amount: number;
    type: TransactionType;
    timestamp: number;
  }>;
  context: Record<string, unknown>; // Additional metadata
}
```

### 4.2 Memory Integration

```typescript
/**
 * Integrate blockchain hashes with claude-flow memory
 * Store transaction hashes for quick retrieval
 */

class MemoryIntegration {
  private memory: ClaudeFlowMemory;
  private blockchain: WeaveBlockchain;

  // Store transaction hash in memory
  async storeTransactionReference(
    tx: Transaction,
    namespace: string = 'blockchain'
  ): Promise<void> {

    await this.memory.store(
      `tx:${tx.hash}`,
      {
        hash: tx.hash,
        type: tx.type,
        actor: tx.actor.id,
        timestamp: tx.timestamp,
        delta: tx.delta,
        blockIndex: tx.blockIndex,
      },
      namespace,
      { ttl: 0 }  // Never expire
    );

    // Store reverse index (actor → transactions)
    const actorKey = `actor:${tx.actor.id}:txs`;
    const existing = await this.memory.retrieve(actorKey, namespace) ?? [];
    existing.push(tx.hash);
    await this.memory.store(actorKey, existing, namespace, { ttl: 0 });
  }

  // Retrieve transaction from memory
  async retrieveTransaction(hash: string): Promise<Transaction | null> {
    const ref = await this.memory.retrieve(`tx:${hash}`, 'blockchain');
    if (!ref) return null;

    // Get full transaction from blockchain
    return this.blockchain.getTransactionByHash(hash);
  }

  // Get all transactions for actor
  async getActorTransactions(actorId: string): Promise<string[]> {
    const hashes = await this.memory.retrieve(
      `actor:${actorId}:txs`,
      'blockchain'
    );
    return hashes ?? [];
  }

  // Store training example in memory
  async storeTrainingExample(example: TrainingExample): Promise<void> {
    await this.memory.store(
      `training:${example.id}`,
      example,
      'training',
      { ttl: 0 }
    );

    // Create searchable index
    await this.memory.store(
      `training:index:${example.timestamp}`,
      example.id,
      'training',
      { ttl: 0 }
    );
  }
}
```

---

## 5. Cost Analysis Integration

### 5.1 Implementation vs Plan Analysis

```typescript
class CostAnalysis {
  private blockchain: WeaveBlockchain;

  // Analyze cost variance for a task
  async analyzeTaskCost(taskId: string): Promise<CostAnalysisReport> {
    const transactions = await this.blockchain.getTransactionsByTask(taskId);

    // Find estimate and actual execution
    const estimateTx = transactions.find(
      tx => tx.type === TransactionType.TASK_EXECUTION && tx.delta === 0
    );
    const executionTx = transactions.find(
      tx => tx.type === TransactionType.TASK_EXECUTION && tx.delta !== 0
    );

    if (!estimateTx || !executionTx) {
      throw new Error(`Incomplete task data for ${taskId}`);
    }

    const estimated = estimateTx.metadata.estimatedCost ?? 0;
    const actual = Math.abs(executionTx.delta);
    const variance = actual - estimated;
    const variancePercent = (variance / estimated) * 100;

    // Analyze why variance occurred
    const factors: VarianceFactor[] = [];

    if (executionTx.metadata.apiCalls! > (estimateTx.metadata.apiCalls ?? 0)) {
      factors.push({
        factor: 'api_calls',
        impact: 'negative',
        description: 'More API calls than estimated',
      });
    }

    if (executionTx.metadata.executionTimeMs! > (estimateTx.metadata.executionTimeMs ?? 0)) {
      factors.push({
        factor: 'execution_time',
        impact: 'negative',
        description: 'Took longer than estimated',
      });
    }

    return {
      taskId,
      estimated,
      actual,
      variance,
      variancePercent,
      factors,
      learnedLesson: this.generateLesson(variance, factors),
    };
  }

  // T-shirt sizing accuracy
  async analyzeSizingAccuracy(): Promise<SizingAccuracyReport> {
    const allTasks = await this.blockchain.getAllTaskTransactions();

    const bySizing: Record<string, { estimated: number[], actual: number[] }> = {
      S: { estimated: [], actual: [] },
      M: { estimated: [], actual: [] },
      L: { estimated: [], actual: [] },
      XL: { estimated: [], actual: [] },
    };

    for (const task of allTasks) {
      const size = this.extractTaskSize(task.metadata);
      if (!size) continue;

      bySizing[size].estimated.push(task.metadata.estimatedCost ?? 0);
      bySizing[size].actual.push(task.metadata.actualCost ?? 0);
    }

    // Calculate averages and variance
    const report: SizingAccuracyReport = {};
    for (const [size, data] of Object.entries(bySizing)) {
      const avgEstimated = average(data.estimated);
      const avgActual = average(data.actual);
      const avgVariance = avgActual - avgEstimated;

      report[size] = {
        count: data.estimated.length,
        avgEstimated,
        avgActual,
        avgVariance,
        avgVariancePercent: (avgVariance / avgEstimated) * 100,
        recommendation: this.generateSizingRecommendation(avgVariance, avgEstimated),
      };
    }

    return report;
  }

  private generateLesson(variance: number, factors: VarianceFactor[]): string {
    if (variance > 0) {
      return `Underestimated by ${variance} tokens. Primary factors: ${
        factors.map(f => f.factor).join(', ')
      }. Increase estimates for similar tasks.`;
    } else {
      return `Overestimated by ${Math.abs(variance)} tokens. Can reduce estimates for similar tasks.`;
    }
  }

  private generateSizingRecommendation(variance: number, estimated: number): string {
    const varPct = (variance / estimated) * 100;

    if (Math.abs(varPct) < 10) {
      return 'Sizing is accurate, maintain current estimates';
    } else if (varPct > 0) {
      return `Increase estimates by ${Math.ceil(varPct)}% for this size`;
    } else {
      return `Decrease estimates by ${Math.ceil(Math.abs(varPct))}% for this size`;
    }
  }
}

interface CostAnalysisReport {
  taskId: string;
  estimated: number;
  actual: number;
  variance: number;
  variancePercent: number;
  factors: VarianceFactor[];
  learnedLesson: string;
}

interface VarianceFactor {
  factor: 'api_calls' | 'execution_time' | 'storage' | 'complexity';
  impact: 'positive' | 'negative';
  description: string;
}

interface SizingAccuracyReport {
  [size: string]: {
    count: number;
    avgEstimated: number;
    avgActual: number;
    avgVariance: number;
    avgVariancePercent: number;
    recommendation: string;
  };
}
```

### 5.2 Learning from Variance

```typescript
class VarianceLearning {
  private blockchain: WeaveBlockchain;

  // Train model to predict actual cost from features
  async trainCostPredictor(): Promise<void> {
    const trainingData = await this.buildTrainingDataset();

    // Features: task size, description length, complexity indicators
    // Target: actual cost

    // Simple linear regression for MVP (can upgrade to neural net)
    const model = await this.fitLinearModel(trainingData);

    // Store model in memory for future predictions
    await this.memory.store('cost_predictor_model', model, 'models', { ttl: 0 });
  }

  private async buildTrainingDataset(): Promise<TrainingDataPoint[]> {
    const allTasks = await this.blockchain.getAllTaskTransactions();

    return allTasks
      .filter(tx => tx.metadata.actualCost !== undefined)
      .map(tx => ({
        features: {
          taskSize: this.encodeSizing(this.extractTaskSize(tx.metadata)),
          descriptionLength: tx.metadata.taskDescription?.length ?? 0,
          hasContext: tx.metadata.context ? 1 : 0,
          apiCallsEstimate: tx.metadata.apiCalls ?? 0,
          timeEstimate: tx.metadata.executionTimeMs ?? 0,
        },
        target: tx.metadata.actualCost!,
        hash: tx.hash,
      }));
  }

  // Predict cost for new task
  async predictCost(
    taskSize: 'S' | 'M' | 'L' | 'XL',
    description: string,
    context?: Record<string, unknown>
  ): Promise<CostPrediction> {

    const model = await this.memory.retrieve('cost_predictor_model', 'models');
    if (!model) {
      // Fallback to simple heuristic
      return this.heuristicCostEstimate(taskSize);
    }

    const features = {
      taskSize: this.encodeSizing(taskSize),
      descriptionLength: description.length,
      hasContext: context ? 1 : 0,
      apiCallsEstimate: this.estimateApiCalls(description),
      timeEstimate: this.estimateTime(taskSize),
    };

    const predicted = this.applyModel(model, features);

    return {
      predicted,
      confidence: model.confidence,
      range: [predicted * 0.8, predicted * 1.2],  // ±20%
    };
  }

  private encodeSizing(size?: string): number {
    const map: Record<string, number> = { S: 1, M: 2, L: 3, XL: 4 };
    return map[size ?? 'M'] ?? 2;
  }
}

interface CostPrediction {
  predicted: number;
  confidence: number;
  range: [number, number];
}
```

---

## 6. Practical Implementation for Weave-NN

### 6.1 TypeScript Interfaces (Production-Ready)

```typescript
// src/blockchain/types.ts

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  merkleRoot: string;
  nonce: number;
}

export interface Transaction {
  hash: string;
  timestamp: number;
  blockIndex: number;
  type: TransactionType;
  actor: ActorIdentity;
  target?: ActorIdentity;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  metadata: TransactionMetadata;
  signature?: string;
}

export interface ActorIdentity {
  id: string;
  type: 'human' | 'agent';
  name?: string;
  publicKey?: string;
}

export enum TransactionType {
  TASK_EXECUTION = 'task_execution',
  API_CALL = 'api_call',
  COMPUTE_TIME = 'compute_time',
  STORAGE_WRITE = 'storage_write',
  PROMPT_QUALITY = 'prompt_quality',
  FEEDBACK_GIVEN = 'feedback_given',
  SUCCESS_BONUS = 'success_bonus',
  LEARNING_BONUS = 'learning_bonus',
  IMPROVEMENT = 'improvement',
  FAILURE_PENALTY = 'failure_penalty',
  BAD_OUTPUT = 'bad_output',
  TIP = 'tip',
  REWARD_HUMAN = 'reward_human',
  GENESIS = 'genesis',
  ADJUSTMENT = 'adjustment',
}

export interface TransactionMetadata {
  taskId?: string;
  taskType?: string;
  taskDescription?: string;
  executionTimeMs?: number;
  tokensUsed?: number;
  apiCalls?: number;
  qualityScore?: number;
  estimatedCost?: number;
  actualCost?: number;
  variance?: number;
  promptClarity?: number;
  outputRelevance?: number;
  userSatisfaction?: number;
  parentHash?: string;
  relatedHashes?: string[];
  input?: string;
  output?: string;
  context?: Record<string, unknown>;
}

export interface Account {
  id: string;
  type: 'human' | 'agent';
  balance: number;
  createdAt: number;
  lastTransactionHash?: string;
}
```

### 6.2 SQLite Schema (MVP Storage)

```sql
-- schema.sql

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  index INTEGER PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  previous_hash TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  merkle_root TEXT NOT NULL,
  nonce INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_blocks_hash ON blocks(hash);
CREATE INDEX idx_blocks_timestamp ON blocks(timestamp);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  hash TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  block_index INTEGER NOT NULL,
  type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  delta REAL NOT NULL,
  balance_before REAL NOT NULL,
  balance_after REAL NOT NULL,
  metadata TEXT NOT NULL,  -- JSON
  signature TEXT,
  FOREIGN KEY (block_index) REFERENCES blocks(index)
);

CREATE INDEX idx_tx_hash ON transactions(hash);
CREATE INDEX idx_tx_actor ON transactions(actor_id);
CREATE INDEX idx_tx_type ON transactions(type);
CREATE INDEX idx_tx_timestamp ON transactions(timestamp);
CREATE INDEX idx_tx_block ON transactions(block_index);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  balance REAL NOT NULL,
  created_at INTEGER NOT NULL,
  last_transaction_hash TEXT,
  FOREIGN KEY (last_transaction_hash) REFERENCES transactions(hash)
);

CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_balance ON accounts(balance);

-- Transaction relationships (for graph traversal)
CREATE TABLE IF NOT EXISTS transaction_relationships (
  from_hash TEXT NOT NULL,
  to_hash TEXT NOT NULL,
  relationship_type TEXT NOT NULL,  -- 'parent', 'related', 'response'
  PRIMARY KEY (from_hash, to_hash),
  FOREIGN KEY (from_hash) REFERENCES transactions(hash),
  FOREIGN KEY (to_hash) REFERENCES transactions(hash)
);

CREATE INDEX idx_rel_from ON transaction_relationships(from_hash);
CREATE INDEX idx_rel_to ON transaction_relationships(to_hash);

-- Training examples (derived from transactions)
CREATE TABLE IF NOT EXISTS training_examples (
  id TEXT PRIMARY KEY,  -- Root transaction hash
  timestamp INTEGER NOT NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  actions TEXT NOT NULL,  -- JSON array
  rewards TEXT NOT NULL,  -- JSON array
  context TEXT NOT NULL,  -- JSON object
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_training_timestamp ON training_examples(timestamp);

-- Cost analysis cache
CREATE TABLE IF NOT EXISTS cost_analysis (
  task_id TEXT PRIMARY KEY,
  estimated REAL NOT NULL,
  actual REAL NOT NULL,
  variance REAL NOT NULL,
  variance_percent REAL NOT NULL,
  factors TEXT NOT NULL,  -- JSON
  learned_lesson TEXT,
  analyzed_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Sizing accuracy statistics
CREATE TABLE IF NOT EXISTS sizing_stats (
  size TEXT PRIMARY KEY,  -- S, M, L, XL
  count INTEGER NOT NULL,
  avg_estimated REAL NOT NULL,
  avg_actual REAL NOT NULL,
  avg_variance REAL NOT NULL,
  avg_variance_percent REAL NOT NULL,
  recommendation TEXT,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### 6.3 Database Layer

```typescript
// src/blockchain/database.ts

import Database from 'better-sqlite3';
import { Block, Transaction, Account } from './types';

export class BlockchainDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './weave-blockchain.db') {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    const schema = fs.readFileSync('./schema.sql', 'utf-8');
    this.db.exec(schema);
  }

  // Insert block
  insertBlock(block: Block): void {
    const stmt = this.db.prepare(`
      INSERT INTO blocks (index, timestamp, previous_hash, hash, merkle_root, nonce)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      block.index,
      block.timestamp,
      block.previousHash,
      block.hash,
      block.merkleRoot,
      block.nonce
    );

    // Insert all transactions in block
    for (const tx of block.transactions) {
      this.insertTransaction(tx);
    }
  }

  // Insert transaction
  insertTransaction(tx: Transaction): void {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (
        hash, timestamp, block_index, type, actor_id, actor_type,
        target_id, target_type, delta, balance_before, balance_after,
        metadata, signature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tx.hash,
      tx.timestamp,
      tx.blockIndex,
      tx.type,
      tx.actor.id,
      tx.actor.type,
      tx.target?.id,
      tx.target?.type,
      tx.delta,
      tx.balanceBefore,
      tx.balanceAfter,
      JSON.stringify(tx.metadata),
      tx.signature
    );

    // Insert relationships
    if (tx.metadata.parentHash) {
      this.insertRelationship(tx.hash, tx.metadata.parentHash, 'parent');
    }
    if (tx.metadata.relatedHashes) {
      for (const relHash of tx.metadata.relatedHashes) {
        this.insertRelationship(tx.hash, relHash, 'related');
      }
    }
  }

  private insertRelationship(fromHash: string, toHash: string, type: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO transaction_relationships (from_hash, to_hash, relationship_type)
      VALUES (?, ?, ?)
    `);
    stmt.run(fromHash, toHash, type);
  }

  // Get transaction by hash
  getTransactionByHash(hash: string): Transaction | null {
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE hash = ?');
    const row = stmt.get(hash) as any;

    if (!row) return null;

    return {
      hash: row.hash,
      timestamp: row.timestamp,
      blockIndex: row.block_index,
      type: row.type,
      actor: {
        id: row.actor_id,
        type: row.actor_type,
      },
      target: row.target_id ? {
        id: row.target_id,
        type: row.target_type,
      } : undefined,
      delta: row.delta,
      balanceBefore: row.balance_before,
      balanceAfter: row.balance_after,
      metadata: JSON.parse(row.metadata),
      signature: row.signature,
    };
  }

  // Get all transactions for actor
  getTransactionsByActor(actorId: string): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions
      WHERE actor_id = ?
      ORDER BY timestamp ASC
    `);

    const rows = stmt.all(actorId) as any[];
    return rows.map(row => this.rowToTransaction(row));
  }

  // Get account
  getAccount(actorId: string): Account | null {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
    const row = stmt.get(actorId) as any;

    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      balance: row.balance,
      createdAt: row.created_at,
      lastTransactionHash: row.last_transaction_hash,
    };
  }

  // Update account
  upsertAccount(account: Account): void {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (id, type, balance, created_at, last_transaction_hash)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        balance = excluded.balance,
        last_transaction_hash = excluded.last_transaction_hash
    `);

    stmt.run(
      account.id,
      account.type,
      account.balance,
      account.createdAt,
      account.lastTransactionHash
    );
  }

  private rowToTransaction(row: any): Transaction {
    return {
      hash: row.hash,
      timestamp: row.timestamp,
      blockIndex: row.block_index,
      type: row.type,
      actor: {
        id: row.actor_id,
        type: row.actor_type,
      },
      target: row.target_id ? {
        id: row.target_id,
        type: row.target_type,
      } : undefined,
      delta: row.delta,
      balanceBefore: row.balance_before,
      balanceAfter: row.balance_after,
      metadata: JSON.parse(row.metadata),
      signature: row.signature,
    };
  }
}
```

### 6.4 Integration Points with Weave-NN

```typescript
// src/integration/weave-blockchain-adapter.ts

import { WeaveBlockchain } from '../blockchain/blockchain';
import { TransactionType } from '../blockchain/types';

/**
 * Adapter to integrate blockchain with existing weave-nn code
 */
export class WeaveBlockchainAdapter {
  private blockchain: WeaveBlockchain;

  constructor() {
    this.blockchain = new WeaveBlockchain();
  }

  // Hook into task execution
  async onTaskStart(
    agentId: string,
    taskId: string,
    description: string,
    estimatedCost: number
  ): Promise<string> {

    const tx = await this.blockchain.createTransaction(
      TransactionType.TASK_EXECUTION,
      { id: agentId, type: 'agent' },
      0,  // No cost yet
      {
        taskId,
        taskDescription: description,
        estimatedCost,
      }
    );

    return tx.hash;
  }

  async onTaskComplete(
    agentId: string,
    taskId: string,
    success: boolean,
    actualCost: number,
    estimateHash: string
  ): Promise<void> {

    // Record actual cost
    await this.blockchain.createTransaction(
      TransactionType.TASK_EXECUTION,
      { id: agentId, type: 'agent' },
      -actualCost,
      {
        taskId,
        actualCost,
        parentHash: estimateHash,
      }
    );

    // Record success/failure
    if (success) {
      await this.blockchain.createTransaction(
        TransactionType.SUCCESS_BONUS,
        { id: agentId, type: 'agent' },
        50,  // Reward
        {
          taskId,
          relatedHashes: [estimateHash],
        }
      );
    } else {
      await this.blockchain.createTransaction(
        TransactionType.FAILURE_PENALTY,
        { id: agentId, type: 'agent' },
        -50,  // Penalty
        {
          taskId,
          relatedHashes: [estimateHash],
        }
      );
    }
  }

  // Hook into prompt submission
  async onPromptSubmit(
    humanId: string,
    prompt: string,
    clarity: number
  ): Promise<void> {

    const reward = clarity > 0.7 ? 20 : 5;

    await this.blockchain.createTransaction(
      TransactionType.PROMPT_QUALITY,
      { id: humanId, type: 'human' },
      reward,
      {
        input: prompt,
        promptClarity: clarity,
      }
    );
  }

  // Hook into feedback
  async onFeedbackGiven(
    humanId: string,
    taskId: string,
    rating: number
  ): Promise<void> {

    await this.blockchain.createTransaction(
      TransactionType.FEEDBACK_GIVEN,
      { id: humanId, type: 'human' },
      10,  // Reward for feedback
      {
        taskId,
        userSatisfaction: rating,
      }
    );
  }

  // Get balance
  async getBalance(actorId: string): Promise<number> {
    return this.blockchain.getBalance(actorId);
  }

  // Get transaction history
  async getHistory(actorId: string): Promise<any[]> {
    return this.blockchain.getTransactionsByActor(actorId);
  }
}
```

---

## 7. Training Data Benefits

### 7.1 Automatic Logging

```typescript
/**
 * Every interaction is automatically logged to blockchain
 * - Immutable audit trail
 * - Hash-based retrieval
 * - Embedded reward signals
 * - Context preservation
 */

class AutomaticLogger {
  private blockchain: WeaveBlockchain;

  // Intercept all agent actions
  async logAgentAction(
    agentId: string,
    action: string,
    input: any,
    output: any,
    cost: number
  ): Promise<string> {

    const tx = await this.blockchain.createTransaction(
      this.actionToTransactionType(action),
      { id: agentId, type: 'agent' },
      -cost,
      {
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        context: {
          action,
          timestamp: Date.now(),
        },
      }
    );

    return tx.hash;
  }

  // Build RL dataset from blockchain
  async buildRLDataset(
    startTime?: number,
    endTime?: number
  ): Promise<RLDataset> {

    const transactions = await this.blockchain.getTransactionsInRange(
      startTime ?? 0,
      endTime ?? Date.now()
    );

    const episodes: Episode[] = [];

    // Group transactions by task
    const taskMap = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const taskId = tx.metadata.taskId;
      if (!taskId) continue;

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, []);
      }
      taskMap.get(taskId)!.push(tx);
    }

    // Convert each task to RL episode
    for (const [taskId, txs] of taskMap.entries()) {
      episodes.push(this.transactionsToEpisode(taskId, txs));
    }

    return {
      episodes,
      totalReward: episodes.reduce((sum, ep) => sum + ep.totalReward, 0),
      totalSteps: episodes.reduce((sum, ep) => sum + ep.steps.length, 0),
    };
  }

  private transactionsToEpisode(taskId: string, txs: Transaction[]): Episode {
    // Sort by timestamp
    txs.sort((a, b) => a.timestamp - b.timestamp);

    const steps: Step[] = [];
    let totalReward = 0;

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const nextTx = txs[i + 1];

      steps.push({
        state: {
          taskId,
          timestamp: tx.timestamp,
          balance: tx.balanceAfter,
          context: tx.metadata.context ?? {},
        },
        action: tx.type,
        reward: tx.delta,
        nextState: nextTx ? {
          taskId,
          timestamp: nextTx.timestamp,
          balance: nextTx.balanceAfter,
          context: nextTx.metadata.context ?? {},
        } : null,
        done: i === txs.length - 1,
      });

      totalReward += tx.delta;
    }

    return {
      taskId,
      steps,
      totalReward,
      success: totalReward > 0,
    };
  }
}

interface RLDataset {
  episodes: Episode[];
  totalReward: number;
  totalSteps: number;
}

interface Episode {
  taskId: string;
  steps: Step[];
  totalReward: number;
  success: boolean;
}

interface Step {
  state: {
    taskId: string;
    timestamp: number;
    balance: number;
    context: Record<string, unknown>;
  };
  action: TransactionType;
  reward: number;
  nextState: any | null;
  done: boolean;
}
```

### 7.2 Reinforcement Learning Integration

```typescript
/**
 * Use blockchain data for RL training
 */

class RLTrainer {
  private dataset: RLDataset;

  async train(): Promise<void> {
    // Load dataset from blockchain
    this.dataset = await this.buildRLDataset();

    // Train policy network
    const policy = await this.trainPolicy(this.dataset);

    // Store trained policy
    await this.savePolicy(policy);
  }

  private async trainPolicy(dataset: RLDataset): Promise<any> {
    // Simple policy gradient for MVP
    // Can upgrade to PPO, SAC, etc.

    const policy = new PolicyNetwork();

    for (const episode of dataset.episodes) {
      const returns = this.calculateReturns(episode);

      for (let i = 0; i < episode.steps.length; i++) {
        const step = episode.steps[i];
        const G = returns[i];

        // Update policy to maximize expected return
        policy.update(step.state, step.action, G);
      }
    }

    return policy;
  }

  private calculateReturns(episode: Episode): number[] {
    const returns: number[] = [];
    let G = 0;
    const gamma = 0.99;  // Discount factor

    // Calculate discounted returns backwards
    for (let i = episode.steps.length - 1; i >= 0; i--) {
      G = episode.steps[i].reward + gamma * G;
      returns.unshift(G);
    }

    return returns;
  }
}
```

---

## 8. Migration Path (Simple → Distributed)

### 8.1 MVP (Current)

```typescript
/**
 * Phase 1: SQLite + Single Node
 *
 * - Local SQLite database
 * - Single-node consensus (no validation needed)
 * - Simple hash-based retrieval
 * - Integrated with claude-flow memory
 */

class MVPBlockchain {
  // All code from sections 1-7 above
  // Uses SQLite for storage
  // No network consensus
  // Perfect for weave-nn MVP
}
```

### 8.2 Future: Distributed (Optional)

```typescript
/**
 * Phase 2: Distributed Ledger (Future)
 *
 * - PostgreSQL or distributed database
 * - Multi-node consensus (Raft, PBFT)
 * - P2P synchronization
 * - Cryptographic signatures
 * - Horizontal scaling
 */

class DistributedBlockchain extends MVPBlockchain {
  private peers: Peer[];
  private consensus: ConsensusProtocol;

  async createBlock(): Promise<Block> {
    // Create block locally
    const block = await super.createBlock();

    // Broadcast to peers
    await this.broadcast(block);

    // Wait for consensus
    const approved = await this.consensus.validate(block);

    if (!approved) {
      throw new Error('Block rejected by consensus');
    }

    return block;
  }

  private async broadcast(block: Block): Promise<void> {
    await Promise.all(
      this.peers.map(peer => peer.sendBlock(block))
    );
  }
}

// This is for FUTURE scaling - not needed for MVP!
```

---

## 9. Summary & Next Steps

### 9.1 What We've Designed

✅ **Private blockchain ledger** for weave-nn
✅ **Token economy** with costs/rewards
✅ **Hash-based retrieval** for training data
✅ **Cost analysis** integration (estimate vs actual)
✅ **TypeScript interfaces** ready for implementation
✅ **SQLite schema** for MVP storage
✅ **Integration adapters** for existing code
✅ **RL training pipeline** using blockchain data

### 9.2 Implementation Steps

1. **Create database schema** (schema.sql)
2. **Implement blockchain core** (blockchain.ts, types.ts)
3. **Add database layer** (database.ts)
4. **Create adapter** (weave-blockchain-adapter.ts)
5. **Integrate with existing code**:
   - Hook task execution
   - Hook prompt submission
   - Hook feedback
6. **Build retrieval system** (hash-based lookup)
7. **Add cost analysis** (variance tracking)
8. **Train RL models** (using blockchain data)

### 9.3 File Structure

```
weave-nn/
├── src/
│   ├── blockchain/
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── blockchain.ts         # Core blockchain logic
│   │   ├── database.ts           # SQLite layer
│   │   ├── transaction.ts        # Transaction builder
│   │   ├── economics.ts          # Token economics
│   │   ├── retrieval.ts          # Hash-based retrieval
│   │   ├── cost-analysis.ts      # Cost variance tracking
│   │   └── schema.sql            # Database schema
│   ├── integration/
│   │   └── weave-blockchain-adapter.ts  # Integration adapter
│   └── training/
│       └── rl-trainer.ts         # RL training from blockchain
```

### 9.4 Key Benefits

1. **Immutable audit trail** - Every interaction logged forever
2. **Built-in reward signals** - Token deltas encode quality
3. **Fast retrieval** - O(1) hash lookup for training
4. **Cost transparency** - Track estimate vs actual
5. **Learning loop** - Improve estimates from variance
6. **Token economy** - Align human/agent incentives
7. **Simple MVP** - SQLite, single-node, no complexity
8. **Future-proof** - Clear path to distributed system

### 9.5 Example Usage

```typescript
// Initialize blockchain
const blockchain = new WeaveBlockchain();
const adapter = new WeaveBlockchainAdapter();

// User submits task
const humanId = 'user-123';
const agentId = 'agent-456';
const taskId = 'task-789';

// Record task start
const estimateHash = await adapter.onTaskStart(
  agentId,
  taskId,
  'Implement authentication system',
  150  // Estimated cost
);

// Agent executes task
// ... work happens ...

// Record task completion
await adapter.onTaskComplete(
  agentId,
  taskId,
  true,   // Success
  120,    // Actual cost (better than estimate!)
  estimateHash
);

// User provides feedback
await adapter.onFeedbackGiven(humanId, taskId, 0.9);

// Check balances
const humanBalance = await adapter.getBalance(humanId);
const agentBalance = await adapter.getBalance(agentId);

console.log(`Human: ${humanBalance} tokens`);  // 1000 + 10 (feedback) + 10 (success bonus) = 1020
console.log(`Agent: ${agentBalance} tokens`);  // 100 - 120 (cost) + 50 (success) + 6 (beat estimate) = 36

// Retrieve for training
const trainingExample = await blockchain.buildTrainingExample(estimateHash);
// Use for RL training!
```

---

## Conclusion

This blockchain ledger foundation provides:

1. **Immediate value**: Track all interactions, costs, rewards
2. **Training data**: Hash-based retrieval for RL
3. **Cost analysis**: Learn to estimate better
4. **Token economy**: Incentivize quality
5. **Simple MVP**: SQLite, no complexity
6. **Future-proof**: Clear upgrade path

The key insight is that **transaction hashes are immutable pointers to training data**, and **token deltas encode reward signals**. This gives us both a ledger AND a learning dataset in one system.

Ready to implement! 🚀
