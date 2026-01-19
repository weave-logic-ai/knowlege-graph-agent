# Foundation Implementation Guide

**Project**: weave-nn
**Purpose**: Practical implementation roadmap for reward systems, blockchain ledger, and mutual learning
**Timeline**: 8 weeks (128 hours)
**Status**: Ready for immediate development

---

## Executive Summary

This document provides a **concrete, actionable implementation plan** for building foundational systems that enable:

1. **Private Blockchain Ledger** - Immutable transaction history using SQLite
2. **Reward System** - Attribution of costs/benefits to agents, prompts, and users
3. **Mutual Learning** - Track success/failure patterns for continuous improvement
4. **Cost Analytics** - Real-time cost tracking and budget enforcement
5. **Gamification UI** - User engagement through tokens, badges, and leaderboards

**Key Integration Points**:
- `weaver/src/cultivation/seed-generator.ts` → Track seed generation costs/rewards
- `weaver/src/shadow-cache/database.ts` → Store transaction hashes in existing SQLite
- `weaver/src/memory/claude-flow-client.ts` → Memory-backed reward tracking
- `weaver/src/cli/index.ts` → New commands: `balance`, `rewards`, `leaderboard`

**Success Metrics**:
- Week 2: Blockchain operational with 100% uptime
- Week 4: All agent tasks automatically logged with cost attribution
- Week 6: Cost variance <20% (estimates improving weekly)
- Week 8: User engagement +50% (gamification working)

---

## Phase 1: Core Infrastructure (Week 1-2, 40 hours)

### 1.1 Blockchain Ledger Module

**Goal**: Create private blockchain with SQLite backend for immutable transaction history.

#### File Structure

```
weaver/src/ledger/
├── types.ts                 # Core types and interfaces
├── blockchain.ts            # Blockchain implementation
├── transaction.ts           # Transaction creation and validation
├── token-account.ts         # Token accounting logic
├── block-validator.ts       # Block validation logic
├── hash.ts                  # SHA-256 hashing utilities
└── index.ts                 # Public API
```

#### 1.1.1 Core Types (`weaver/src/ledger/types.ts`)

```typescript
/**
 * Transaction Types
 */
export enum TransactionType {
  // Costs
  PROMPT_COST = 'prompt_cost',           // Cost of a prompt execution
  API_CALL = 'api_call',                 // External API call (Claude, OpenAI)
  COMPUTE = 'compute',                   // Compute resources used
  STORAGE = 'storage',                   // Storage costs

  // Rewards
  PROMPT_QUALITY = 'prompt_quality',     // Reward for high-quality prompt
  TASK_SUCCESS = 'task_success',         // Task completed successfully
  LEARNING_CONTRIBUTION = 'learning',    // Contribution to mutual learning
  BADGE_EARNED = 'badge_earned',         // Achievement unlocked

  // Transfers
  TRANSFER = 'transfer',                 // Token transfer between accounts
  GENESIS = 'genesis',                   // Initial token allocation
}

/**
 * Transaction structure
 */
export interface Transaction {
  id: string;                    // Unique transaction ID (UUID)
  type: TransactionType;
  from: string;                  // Account ID (user, agent, system)
  to: string;                    // Recipient account ID
  amount: number;                // Token amount (negative for costs)
  timestamp: number;             // Unix timestamp (ms)
  metadata: TransactionMetadata;
  signature?: string;            // Optional digital signature
}

/**
 * Transaction metadata for attribution
 */
export interface TransactionMetadata {
  // Context
  agentId?: string;              // Agent that performed action
  taskId?: string;               // Task ID from workflow
  promptHash?: string;           // Hash of prompt for deduplication

  // Cost attribution
  tokensUsed?: number;           // LLM tokens consumed
  executionTime?: number;        // Execution time (ms)
  resourceType?: 'cpu' | 'memory' | 'storage' | 'network';

  // Quality metrics
  qualityScore?: number;         // 0-1 quality assessment
  successRate?: number;          // Historical success rate

  // Learning
  patternId?: string;            // Pattern that led to success/failure
  feedbackScore?: number;        // User feedback (-1 to 1)

  // Additional context
  description?: string;
  tags?: string[];

  [key: string]: unknown;        // Allow arbitrary metadata
}

/**
 * Block structure
 */
export interface Block {
  index: number;                 // Block number (0 = genesis)
  timestamp: number;             // Block creation time
  transactions: Transaction[];   // Transactions in this block
  previousHash: string;          // Hash of previous block
  hash: string;                  // Hash of this block
  nonce: number;                 // Proof-of-work nonce (optional)
  merkleRoot: string;            // Merkle tree root of transactions
}

/**
 * Token account
 */
export interface TokenAccount {
  accountId: string;             // Unique account identifier
  balance: number;               // Current token balance
  type: 'user' | 'agent' | 'system';
  metadata: {
    createdAt: number;
    displayName?: string;
    email?: string;
    role?: string;
  };
}

/**
 * Ledger state
 */
export interface LedgerState {
  latestBlockIndex: number;
  totalTransactions: number;
  totalSupply: number;           // Total tokens in circulation
  accounts: Map<string, TokenAccount>;
}
```

#### 1.1.2 Hash Utilities (`weaver/src/ledger/hash.ts`)

```typescript
import { createHash } from 'crypto';

/**
 * SHA-256 hash of any data
 */
export function sha256(data: string | object): string {
  const input = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Calculate Merkle tree root for transactions
 */
export function calculateMerkleRoot(transactions: Transaction[]): string {
  if (transactions.length === 0) return sha256('empty');

  // Hash each transaction
  let hashes = transactions.map(tx => sha256(tx));

  // Build tree bottom-up
  while (hashes.length > 1) {
    const newHashes: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left;
      newHashes.push(sha256(left + right));
    }
    hashes = newHashes;
  }

  return hashes[0];
}

/**
 * Calculate block hash
 */
export function calculateBlockHash(block: Omit<Block, 'hash'>): string {
  const data = {
    index: block.index,
    timestamp: block.timestamp,
    previousHash: block.previousHash,
    merkleRoot: block.merkleRoot,
    nonce: block.nonce,
  };
  return sha256(data);
}
```

#### 1.1.3 Transaction Builder (`weaver/src/ledger/transaction.ts`)

```typescript
import { v4 as uuidv4 } from 'uuid';
import { sha256 } from './hash.js';
import type { Transaction, TransactionType, TransactionMetadata } from './types.js';

/**
 * Create a new transaction
 */
export function createTransaction(
  type: TransactionType,
  from: string,
  to: string,
  amount: number,
  metadata: TransactionMetadata = {},
): Transaction {
  const tx: Transaction = {
    id: uuidv4(),
    type,
    from,
    to,
    amount,
    timestamp: Date.now(),
    metadata,
  };

  return tx;
}

/**
 * Create cost transaction (negative amount)
 */
export function createCostTransaction(
  from: string,
  costType: TransactionType,
  amount: number,
  metadata: TransactionMetadata = {},
): Transaction {
  return createTransaction(
    costType,
    from,
    'system',      // Costs go to system account
    -Math.abs(amount),  // Ensure negative
    metadata,
  );
}

/**
 * Create reward transaction (positive amount)
 */
export function createRewardTransaction(
  to: string,
  rewardType: TransactionType,
  amount: number,
  metadata: TransactionMetadata = {},
): Transaction {
  return createTransaction(
    rewardType,
    'system',      // Rewards come from system
    to,
    Math.abs(amount),  // Ensure positive
    metadata,
  );
}

/**
 * Validate transaction structure
 */
export function validateTransaction(tx: Transaction): boolean {
  // Basic validation
  if (!tx.id || !tx.type || !tx.from || !tx.to) {
    return false;
  }

  if (typeof tx.amount !== 'number' || !Number.isFinite(tx.amount)) {
    return false;
  }

  if (!Number.isInteger(tx.timestamp) || tx.timestamp <= 0) {
    return false;
  }

  // Type-specific validation
  switch (tx.type) {
    case TransactionType.PROMPT_COST:
    case TransactionType.API_CALL:
    case TransactionType.COMPUTE:
    case TransactionType.STORAGE:
      // Costs must be negative
      if (tx.amount >= 0) return false;
      break;

    case TransactionType.PROMPT_QUALITY:
    case TransactionType.TASK_SUCCESS:
    case TransactionType.LEARNING_CONTRIBUTION:
    case TransactionType.BADGE_EARNED:
      // Rewards must be positive
      if (tx.amount <= 0) return false;
      break;

    case TransactionType.TRANSFER:
      // Transfers can be any amount
      break;

    case TransactionType.GENESIS:
      // Genesis must be positive
      if (tx.amount <= 0) return false;
      break;

    default:
      return false;
  }

  return true;
}

/**
 * Calculate transaction hash
 */
export function hashTransaction(tx: Transaction): string {
  const { signature, ...data } = tx;  // Exclude signature from hash
  return sha256(data);
}
```

#### 1.1.4 Blockchain Core (`weaver/src/ledger/blockchain.ts`)

```typescript
import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { sha256, calculateMerkleRoot, calculateBlockHash } from './hash.js';
import { validateTransaction } from './transaction.js';
import type { Block, Transaction, LedgerState, TokenAccount } from './types.js';

export class Blockchain {
  private db: Database.Database;
  private state: LedgerState;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.initializeSchema();
    this.state = this.loadState();

    logger.info('Blockchain initialized', {
      latestBlock: this.state.latestBlockIndex,
      totalTransactions: this.state.totalTransactions,
      accountCount: this.state.accounts.size,
    });
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS blocks (
        index_num INTEGER PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        previous_hash TEXT NOT NULL,
        hash TEXT NOT NULL UNIQUE,
        merkle_root TEXT NOT NULL,
        nonce INTEGER DEFAULT 0,
        transaction_count INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        block_index INTEGER NOT NULL,
        type TEXT NOT NULL,
        from_account TEXT NOT NULL,
        to_account TEXT NOT NULL,
        amount REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT,  -- JSON
        signature TEXT,
        tx_hash TEXT NOT NULL,
        FOREIGN KEY (block_index) REFERENCES blocks(index_num)
      );

      CREATE TABLE IF NOT EXISTS accounts (
        account_id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('user', 'agent', 'system')),
        balance REAL NOT NULL DEFAULT 0,
        metadata TEXT,  -- JSON
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_account);
      CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_account);
      CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_tx_block ON transactions(block_index);
    `);

    // Create genesis block if needed
    const blockCount = this.db.prepare('SELECT COUNT(*) as count FROM blocks').get() as { count: number };
    if (blockCount.count === 0) {
      this.createGenesisBlock();
    }
  }

  /**
   * Create genesis block (block 0)
   */
  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0',
      hash: '',
      nonce: 0,
      merkleRoot: sha256('genesis'),
    };

    genesisBlock.hash = calculateBlockHash(genesisBlock);

    this.db.prepare(`
      INSERT INTO blocks (index_num, timestamp, previous_hash, hash, merkle_root, nonce, transaction_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      genesisBlock.index,
      genesisBlock.timestamp,
      genesisBlock.previousHash,
      genesisBlock.hash,
      genesisBlock.merkleRoot,
      genesisBlock.nonce,
      0,
    );

    // Create system account
    this.createAccount('system', 'system', {
      displayName: 'System',
      createdAt: Date.now(),
    });

    logger.info('Genesis block created', { hash: genesisBlock.hash });
  }

  /**
   * Load current ledger state
   */
  private loadState(): LedgerState {
    const latestBlock = this.db.prepare('SELECT MAX(index_num) as latest FROM blocks').get() as { latest: number };
    const txCount = this.db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
    const totalSupply = this.db.prepare('SELECT SUM(balance) as total FROM accounts').get() as { total: number | null };

    const accounts = new Map<string, TokenAccount>();
    const accountRows = this.db.prepare('SELECT * FROM accounts').all() as any[];

    for (const row of accountRows) {
      accounts.set(row.account_id, {
        accountId: row.account_id,
        balance: row.balance,
        type: row.type,
        metadata: JSON.parse(row.metadata || '{}'),
      });
    }

    return {
      latestBlockIndex: latestBlock.latest || 0,
      totalTransactions: txCount.count,
      totalSupply: totalSupply.total || 0,
      accounts,
    };
  }

  /**
   * Create a new account
   */
  createAccount(
    accountId: string,
    type: 'user' | 'agent' | 'system',
    metadata: Record<string, unknown> = {},
  ): TokenAccount {
    const account: TokenAccount = {
      accountId,
      balance: 0,
      type,
      metadata: {
        ...metadata,
        createdAt: Date.now(),
      },
    };

    this.db.prepare(`
      INSERT INTO accounts (account_id, type, balance, metadata)
      VALUES (?, ?, ?, ?)
    `).run(
      accountId,
      type,
      0,
      JSON.stringify(account.metadata),
    );

    this.state.accounts.set(accountId, account);

    logger.debug('Account created', { accountId, type });
    return account;
  }

  /**
   * Get account by ID
   */
  getAccount(accountId: string): TokenAccount | null {
    return this.state.accounts.get(accountId) || null;
  }

  /**
   * Get or create account
   */
  getOrCreateAccount(
    accountId: string,
    type: 'user' | 'agent' | 'system',
    metadata?: Record<string, unknown>,
  ): TokenAccount {
    const existing = this.getAccount(accountId);
    if (existing) return existing;

    return this.createAccount(accountId, type, metadata);
  }

  /**
   * Add transaction to pending pool and create new block
   */
  async addTransaction(tx: Transaction): Promise<string> {
    // Validate transaction
    if (!validateTransaction(tx)) {
      throw new Error(`Invalid transaction: ${tx.id}`);
    }

    // Ensure accounts exist
    this.getOrCreateAccount(tx.from, 'user');
    this.getOrCreateAccount(tx.to, 'user');

    // Check balance for costs
    if (tx.amount < 0) {
      const account = this.getAccount(tx.from)!;
      if (account.balance + tx.amount < 0) {
        throw new Error(`Insufficient balance: ${tx.from} has ${account.balance}, needs ${-tx.amount}`);
      }
    }

    // Create new block with this transaction
    const block = await this.createBlock([tx]);

    logger.info('Transaction added', {
      txId: tx.id,
      type: tx.type,
      amount: tx.amount,
      blockIndex: block.index,
    });

    return tx.id;
  }

  /**
   * Create new block with transactions
   */
  private async createBlock(transactions: Transaction[]): Promise<Block> {
    const previousBlock = this.getLatestBlock();

    const block: Block = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      transactions,
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
      merkleRoot: calculateMerkleRoot(transactions),
    };

    block.hash = calculateBlockHash(block);

    // Start transaction
    const insertBlock = this.db.prepare(`
      INSERT INTO blocks (index_num, timestamp, previous_hash, hash, merkle_root, nonce, transaction_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTx = this.db.prepare(`
      INSERT INTO transactions (id, block_index, type, from_account, to_account, amount, timestamp, metadata, signature, tx_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateBalance = this.db.prepare(`
      UPDATE accounts SET balance = balance + ?, updated_at = strftime('%s', 'now')
      WHERE account_id = ?
    `);

    this.db.transaction(() => {
      // Insert block
      insertBlock.run(
        block.index,
        block.timestamp,
        block.previousHash,
        block.hash,
        block.merkleRoot,
        block.nonce,
        transactions.length,
      );

      // Insert transactions and update balances
      for (const tx of transactions) {
        insertTx.run(
          tx.id,
          block.index,
          tx.type,
          tx.from,
          tx.to,
          tx.amount,
          tx.timestamp,
          JSON.stringify(tx.metadata),
          tx.signature || null,
          sha256(tx),
        );

        // Update balances
        updateBalance.run(-tx.amount, tx.from);  // Debit sender
        updateBalance.run(tx.amount, tx.to);     // Credit receiver
      }
    })();

    // Update in-memory state
    this.state.latestBlockIndex = block.index;
    this.state.totalTransactions += transactions.length;

    // Reload account balances
    const accountRows = this.db.prepare('SELECT account_id, balance FROM accounts').all() as any[];
    for (const row of accountRows) {
      const account = this.state.accounts.get(row.account_id);
      if (account) {
        account.balance = row.balance;
      }
    }

    logger.info('Block created', {
      index: block.index,
      hash: block.hash,
      transactions: transactions.length,
    });

    return block;
  }

  /**
   * Get latest block
   */
  getLatestBlock(): Block {
    const row = this.db.prepare(`
      SELECT * FROM blocks ORDER BY index_num DESC LIMIT 1
    `).get() as any;

    if (!row) {
      throw new Error('No blocks found');
    }

    const txRows = this.db.prepare(`
      SELECT * FROM transactions WHERE block_index = ?
    `).all(row.index_num) as any[];

    const transactions: Transaction[] = txRows.map(tx => ({
      id: tx.id,
      type: tx.type,
      from: tx.from_account,
      to: tx.to_account,
      amount: tx.amount,
      timestamp: tx.timestamp,
      metadata: JSON.parse(tx.metadata || '{}'),
      signature: tx.signature || undefined,
    }));

    return {
      index: row.index_num,
      timestamp: row.timestamp,
      previousHash: row.previous_hash,
      hash: row.hash,
      merkleRoot: row.merkle_root,
      nonce: row.nonce,
      transactions,
    };
  }

  /**
   * Get block by index
   */
  getBlock(index: number): Block | null {
    const row = this.db.prepare('SELECT * FROM blocks WHERE index_num = ?').get(index) as any;
    if (!row) return null;

    const txRows = this.db.prepare('SELECT * FROM transactions WHERE block_index = ?').all(index) as any[];

    const transactions: Transaction[] = txRows.map(tx => ({
      id: tx.id,
      type: tx.type,
      from: tx.from_account,
      to: tx.to_account,
      amount: tx.amount,
      timestamp: tx.timestamp,
      metadata: JSON.parse(tx.metadata || '{}'),
      signature: tx.signature || undefined,
    }));

    return {
      index: row.index_num,
      timestamp: row.timestamp,
      previousHash: row.previous_hash,
      hash: row.hash,
      merkleRoot: row.merkle_root,
      nonce: row.nonce,
      transactions,
    };
  }

  /**
   * Verify blockchain integrity
   */
  verifyChain(): boolean {
    const blockCount = this.db.prepare('SELECT COUNT(*) as count FROM blocks').get() as { count: number };

    for (let i = 1; i < blockCount.count; i++) {
      const block = this.getBlock(i)!;
      const previousBlock = this.getBlock(i - 1)!;

      // Verify hash linkage
      if (block.previousHash !== previousBlock.hash) {
        logger.error('Chain broken at block', { index: i });
        return false;
      }

      // Verify block hash
      const calculatedHash = calculateBlockHash(block);
      if (block.hash !== calculatedHash) {
        logger.error('Block hash mismatch', { index: i });
        return false;
      }

      // Verify merkle root
      const calculatedMerkle = calculateMerkleRoot(block.transactions);
      if (block.merkleRoot !== calculatedMerkle) {
        logger.error('Merkle root mismatch', { index: i });
        return false;
      }
    }

    logger.info('Blockchain verified', { blocks: blockCount.count });
    return true;
  }

  /**
   * Get transaction history for account
   */
  getTransactionHistory(
    accountId: string,
    limit: number = 100,
  ): Transaction[] {
    const rows = this.db.prepare(`
      SELECT * FROM transactions
      WHERE from_account = ? OR to_account = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(accountId, accountId, limit) as any[];

    return rows.map(tx => ({
      id: tx.id,
      type: tx.type,
      from: tx.from_account,
      to: tx.to_account,
      amount: tx.amount,
      timestamp: tx.timestamp,
      metadata: JSON.parse(tx.metadata || '{}'),
      signature: tx.signature || undefined,
    }));
  }

  /**
   * Get current ledger state
   */
  getState(): LedgerState {
    return { ...this.state };
  }

  /**
   * Close database
   */
  close(): void {
    this.db.close();
    logger.info('Blockchain closed');
  }
}
```

#### 1.1.5 Public API (`weaver/src/ledger/index.ts`)

```typescript
export { Blockchain } from './blockchain.js';
export { createTransaction, createCostTransaction, createRewardTransaction } from './transaction.js';
export { sha256, calculateMerkleRoot } from './hash.js';
export * from './types.js';

/**
 * Example usage:
 *
 * const blockchain = new Blockchain('./data/ledger.db');
 *
 * // Track API cost
 * const costTx = createCostTransaction(
 *   'user-alice',
 *   TransactionType.API_CALL,
 *   10,  // 10 tokens
 *   {
 *     agentId: 'claude-researcher',
 *     tokensUsed: 1500,
 *     executionTime: 3200,
 *   }
 * );
 *
 * await blockchain.addTransaction(costTx);
 *
 * // Reward for quality prompt
 * const rewardTx = createRewardTransaction(
 *   'user-alice',
 *   TransactionType.PROMPT_QUALITY,
 *   5,   // 5 tokens
 *   {
 *     qualityScore: 0.92,
 *     promptHash: 'abc123...',
 *   }
 * );
 *
 * await blockchain.addTransaction(rewardTx);
 *
 * // Check balance
 * const account = blockchain.getAccount('user-alice');
 * console.log(`Balance: ${account.balance} tokens`);
 */
```

---

## Phase 2: Reward System Integration (Week 3-4, 32 hours)

### 2.1 Reward Module

**Goal**: Analyze prompt quality, attribute task success/failure, and track mutual learning.

#### File Structure

```
weaver/src/rewards/
├── types.ts                 # Reward types
├── prompt-scorer.ts         # Prompt quality analysis
├── attribution-engine.ts    # Success/failure attribution
├── learning-tracker.ts      # Mutual learning patterns
└── index.ts                 # Public API
```

#### 2.1.1 Reward Types (`weaver/src/rewards/types.ts`)

```typescript
/**
 * Prompt quality assessment
 */
export interface PromptQuality {
  promptHash: string;
  score: number;              // 0-1
  factors: {
    clarity: number;          // 0-1
    specificity: number;      // 0-1
    context: number;          // 0-1
    constraints: number;      // 0-1
  };
  tokensUsed: number;
  executionTime: number;
  successRate: number;        // Historical success rate for similar prompts
  recommendation: 'excellent' | 'good' | 'needs_improvement';
}

/**
 * Task attribution result
 */
export interface TaskAttribution {
  taskId: string;
  success: boolean;
  contributingFactors: {
    promptQuality: number;    // 0-1 contribution
    agentSelection: number;   // 0-1 contribution
    contextRelevance: number; // 0-1 contribution
    timingOptimal: number;    // 0-1 contribution
  };
  costTokens: number;
  rewardTokens: number;
  netImpact: number;          // costTokens - rewardTokens
}

/**
 * Learning pattern
 */
export interface LearningPattern {
  patternId: string;
  description: string;
  successCount: number;
  failureCount: number;
  avgQualityScore: number;
  lastSeen: number;
  examples: string[];         // Prompt hashes
}
```

#### 2.1.2 Prompt Scorer (`weaver/src/rewards/prompt-scorer.ts`)

```typescript
import { sha256 } from '../ledger/hash.js';
import type { PromptQuality } from './types.js';

export class PromptScorer {
  /**
   * Analyze prompt quality
   */
  analyzePrompt(prompt: string): PromptQuality {
    const promptHash = sha256(prompt);
    const tokens = prompt.split(/\s+/).length;

    // Clarity: Does prompt have clear intent?
    const clarity = this.scoreClarity(prompt);

    // Specificity: Does it have specific requirements?
    const specificity = this.scoreSpecificity(prompt);

    // Context: Does it provide enough context?
    const context = this.scoreContext(prompt);

    // Constraints: Does it define constraints/acceptance criteria?
    const constraints = this.scoreConstraints(prompt);

    const factors = { clarity, specificity, context, constraints };
    const score = (clarity + specificity + context + constraints) / 4;

    const recommendation =
      score >= 0.8 ? 'excellent' :
      score >= 0.6 ? 'good' :
      'needs_improvement';

    return {
      promptHash,
      score,
      factors,
      tokensUsed: tokens,
      executionTime: 0,  // Set by caller
      successRate: 0,    // Set from history
      recommendation,
    };
  }

  /**
   * Score clarity (0-1)
   */
  private scoreClarity(prompt: string): number {
    let score = 0.5;  // Base score

    // Has clear action verbs
    const actionVerbs = ['create', 'build', 'implement', 'fix', 'analyze', 'refactor'];
    if (actionVerbs.some(verb => prompt.toLowerCase().includes(verb))) {
      score += 0.2;
    }

    // Has specific outcome
    if (prompt.includes('output') || prompt.includes('result') || prompt.includes('should')) {
      score += 0.2;
    }

    // Not too vague
    const vagueWords = ['something', 'stuff', 'thing', 'maybe', 'kind of'];
    if (!vagueWords.some(word => prompt.toLowerCase().includes(word))) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Score specificity (0-1)
   */
  private scoreSpecificity(prompt: string): number {
    let score = 0.3;  // Base score

    // Has file paths
    if (/\/[a-zA-Z0-9_-]+\.(ts|js|md|json|tsx)/.test(prompt)) {
      score += 0.2;
    }

    // Has code examples or types
    if (prompt.includes('```') || prompt.includes('interface') || prompt.includes('type')) {
      score += 0.2;
    }

    // Has numbers/measurements
    if (/\d+/.test(prompt)) {
      score += 0.15;
    }

    // Has specific technical terms
    const technicalTerms = ['typescript', 'react', 'api', 'database', 'function', 'class'];
    if (technicalTerms.some(term => prompt.toLowerCase().includes(term))) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Score context (0-1)
   */
  private scoreContext(prompt: string): number {
    let score = 0.4;  // Base score

    // Has background info
    if (prompt.includes('currently') || prompt.includes('existing') || prompt.includes('previous')) {
      score += 0.2;
    }

    // Has reasoning
    if (prompt.includes('because') || prompt.includes('so that') || prompt.includes('in order to')) {
      score += 0.2;
    }

    // Adequate length (not too short)
    if (prompt.split(/\s+/).length >= 20) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Score constraints (0-1)
   */
  private scoreConstraints(prompt: string): number {
    let score = 0.3;  // Base score

    // Has explicit constraints
    if (prompt.includes('must') || prompt.includes('should') || prompt.includes('required')) {
      score += 0.2;
    }

    // Has quality criteria
    if (prompt.includes('test') || prompt.includes('validate') || prompt.includes('ensure')) {
      score += 0.2;
    }

    // Has format requirements
    if (prompt.includes('format') || prompt.includes('structure') || prompt.includes('style')) {
      score += 0.15;
    }

    // Has acceptance criteria
    if (prompt.includes('acceptance') || prompt.includes('success') || prompt.includes('done when')) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate reward tokens based on quality
   */
  calculateReward(quality: PromptQuality): number {
    // Base reward: 5 tokens
    let reward = 5;

    // Quality multiplier (0.5x to 2.0x)
    const multiplier = 0.5 + (quality.score * 1.5);
    reward *= multiplier;

    // Bonus for excellent prompts
    if (quality.recommendation === 'excellent') {
      reward += 10;
    }

    // Penalty for poor prompts
    if (quality.recommendation === 'needs_improvement') {
      reward = Math.max(reward - 5, 1);
    }

    return Math.round(reward);
  }
}
```

#### 2.1.3 Attribution Engine (`weaver/src/rewards/attribution-engine.ts`)

```typescript
import type { TaskAttribution } from './types.js';
import type { PromptQuality } from './types.js';

export class AttributionEngine {
  /**
   * Attribute task success/failure to contributing factors
   */
  attributeTask(
    taskId: string,
    success: boolean,
    promptQuality: PromptQuality,
    metadata: {
      agentId: string;
      executionTime: number;
      contextRelevance?: number;
      timingScore?: number;
    },
  ): TaskAttribution {
    // Calculate contribution weights (should sum to 1.0)
    const weights = this.calculateContributionWeights(
      success,
      promptQuality.score,
      metadata.contextRelevance || 0.5,
      metadata.timingScore || 0.5,
    );

    // Calculate costs (simplified)
    const costTokens = Math.ceil(metadata.executionTime / 1000) * 2;  // 2 tokens per second

    // Calculate rewards
    let rewardTokens = 0;
    if (success) {
      // Base reward for success
      rewardTokens = 10;

      // Bonus for high-quality prompt
      if (promptQuality.score >= 0.8) {
        rewardTokens += 5;
      }

      // Bonus for fast execution
      if (metadata.executionTime < 5000) {  // < 5 seconds
        rewardTokens += 3;
      }
    } else {
      // Small consolation reward for trying
      rewardTokens = 1;
    }

    return {
      taskId,
      success,
      contributingFactors: weights,
      costTokens,
      rewardTokens,
      netImpact: costTokens - rewardTokens,
    };
  }

  /**
   * Calculate contribution weights for each factor
   */
  private calculateContributionWeights(
    success: boolean,
    promptQuality: number,
    contextRelevance: number,
    timingScore: number,
  ): TaskAttribution['contributingFactors'] {
    // Start with equal weights
    const weights = {
      promptQuality: 0.25,
      agentSelection: 0.25,
      contextRelevance: 0.25,
      timingOptimal: 0.25,
    };

    // Adjust based on success/failure
    if (success) {
      // On success, high prompt quality gets more credit
      if (promptQuality >= 0.8) {
        weights.promptQuality = 0.4;
        weights.agentSelection = 0.2;
        weights.contextRelevance = 0.2;
        weights.timingOptimal = 0.2;
      }
    } else {
      // On failure, analyze what went wrong
      if (promptQuality < 0.5) {
        // Blame prompt quality
        weights.promptQuality = 0.6;
        weights.agentSelection = 0.15;
        weights.contextRelevance = 0.15;
        weights.timingOptimal = 0.1;
      } else if (contextRelevance < 0.3) {
        // Blame lack of context
        weights.promptQuality = 0.2;
        weights.agentSelection = 0.2;
        weights.contextRelevance = 0.5;
        weights.timingOptimal = 0.1;
      }
    }

    return weights;
  }
}
```

### 2.2 Integration with Existing Code

#### 2.2.1 Instrument Seed Generator (`weaver/src/cultivation/seed-generator.ts`)

Add ledger tracking at key points:

```typescript
// At top of file
import { Blockchain } from '../ledger/index.js';
import { createCostTransaction, createRewardTransaction, TransactionType } from '../ledger/index.js';
import { PromptScorer } from '../rewards/prompt-scorer.js';

export class SeedGenerator {
  private blockchain: Blockchain;
  private promptScorer: PromptScorer;

  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    ledgerPath: string = './data/ledger.db'
  ) {
    this.blockchain = new Blockchain(ledgerPath);
    this.promptScorer = new PromptScorer();
  }

  /**
   * Analyze entire codebase and generate seed data
   * (INSTRUMENTED VERSION)
   */
  async analyze(): Promise<SeedAnalysis> {
    const startTime = Date.now();
    const userId = process.env.USER || 'system';

    // ... existing analysis code ...

    const executionTime = Date.now() - startTime;

    // Track cost
    const costTx = createCostTransaction(
      userId,
      TransactionType.COMPUTE,
      Math.ceil(executionTime / 1000) * 2,  // 2 tokens per second
      {
        agentId: 'seed-generator',
        taskId: `analyze-${Date.now()}`,
        executionTime,
        description: 'Codebase analysis for seed generation',
      }
    );

    await this.blockchain.addTransaction(costTx);

    // If analysis was successful, reward
    if (analysis.dependencies.length > 0) {
      const rewardTx = createRewardTransaction(
        userId,
        TransactionType.TASK_SUCCESS,
        5,
        {
          agentId: 'seed-generator',
          taskId: `analyze-${Date.now()}`,
          description: `Found ${analysis.dependencies.length} dependencies`,
        }
      );

      await this.blockchain.addTransaction(rewardTx);
    }

    return analysis;
  }
}
```

#### 2.2.2 Instrument CLI Commands (`weaver/src/cli/commands/cultivate.ts`)

```typescript
// Add ledger tracking to cultivate command
import { Blockchain } from '../../ledger/index.js';
import { PromptScorer } from '../../rewards/prompt-scorer.js';

// In command action:
const blockchain = new Blockchain('./data/ledger.db');
const promptScorer = new PromptScorer();
const userId = process.env.USER || 'system';

// Before execution
const promptQuality = promptScorer.analyzePrompt(userPrompt);
console.log(`Prompt quality: ${(promptQuality.score * 100).toFixed(0)}% (${promptQuality.recommendation})`);

// Track reward for quality prompt
if (promptQuality.score >= 0.8) {
  const reward = promptScorer.calculateReward(promptQuality);
  const rewardTx = createRewardTransaction(
    userId,
    TransactionType.PROMPT_QUALITY,
    reward,
    {
      promptHash: promptQuality.promptHash,
      qualityScore: promptQuality.score,
    }
  );
  await blockchain.addTransaction(rewardTx);
}

// ... execute task ...

// After execution, track cost
const costTx = createCostTransaction(
  userId,
  TransactionType.COMPUTE,
  estimatedCost,
  { /* ... */ }
);
await blockchain.addTransaction(costTx);
```

---

## Phase 3: Cost Analysis (Week 5-6, 24 hours)

### 3.1 Cost Analyzer Module

```
weaver/src/analytics/
├── cost-analyzer.ts         # Cost tracking and analysis
├── t-shirt-estimator.ts     # T-shirt size estimation
├── budget-enforcer.ts       # Budget limits and alerts
└── types.ts                 # Analytics types
```

#### 3.1.1 Cost Analyzer (`weaver/src/analytics/cost-analyzer.ts`)

```typescript
import { Blockchain } from '../ledger/blockchain.js';
import type { Transaction, TransactionType } from '../ledger/types.js';

export interface CostReport {
  totalCosts: number;
  totalRewards: number;
  netSpend: number;
  costsByType: Record<string, number>;
  costsByAgent: Record<string, number>;
  avgCostPerTask: number;
  variance: number;              // Actual vs estimated variance
}

export class CostAnalyzer {
  constructor(private blockchain: Blockchain) {}

  /**
   * Generate cost report for time period
   */
  generateReport(
    accountId: string,
    startTime: number,
    endTime: number,
  ): CostReport {
    const txHistory = this.blockchain.getTransactionHistory(accountId, 1000);

    // Filter by time range
    const relevantTxs = txHistory.filter(
      tx => tx.timestamp >= startTime && tx.timestamp <= endTime
    );

    let totalCosts = 0;
    let totalRewards = 0;
    const costsByType: Record<string, number> = {};
    const costsByAgent: Record<string, number> = {};

    for (const tx of relevantTxs) {
      if (tx.amount < 0) {
        // Cost
        totalCosts += Math.abs(tx.amount);
        costsByType[tx.type] = (costsByType[tx.type] || 0) + Math.abs(tx.amount);

        if (tx.metadata.agentId) {
          costsByAgent[tx.metadata.agentId] =
            (costsByAgent[tx.metadata.agentId] || 0) + Math.abs(tx.amount);
        }
      } else {
        // Reward
        totalRewards += tx.amount;
      }
    }

    const netSpend = totalCosts - totalRewards;
    const avgCostPerTask = relevantTxs.length > 0 ? totalCosts / relevantTxs.length : 0;

    // Calculate variance (simplified - would compare to estimates)
    const variance = 0;  // TODO: Compare to estimates

    return {
      totalCosts,
      totalRewards,
      netSpend,
      costsByType,
      costsByAgent,
      avgCostPerTask,
      variance,
    };
  }
}
```

---

## Phase 4: Gamification UI (Week 7-8, 32 hours)

### 4.1 CLI Commands

Add new commands to `weaver/src/cli/index.ts`:

```typescript
// Balance command
program
  .command('balance')
  .description('Check your token balance')
  .action(async () => {
    const blockchain = new Blockchain('./data/ledger.db');
    const userId = process.env.USER || 'system';
    const account = blockchain.getAccount(userId);

    if (!account) {
      console.log('No account found. Use weaver to earn tokens!');
      return;
    }

    console.log(chalk.bold(`\n💰 Token Balance\n`));
    console.log(`Account: ${userId}`);
    console.log(`Balance: ${chalk.green(account.balance.toFixed(2))} tokens`);
    console.log(`Type: ${account.type}`);
  });

// Rewards command
program
  .command('rewards')
  .description('View recent rewards and costs')
  .option('-n, --limit <number>', 'Number of transactions to show', '10')
  .action(async (options) => {
    const blockchain = new Blockchain('./data/ledger.db');
    const userId = process.env.USER || 'system';
    const limit = parseInt(options.limit);

    const txHistory = blockchain.getTransactionHistory(userId, limit);

    console.log(chalk.bold(`\n🎁 Recent Activity\n`));

    for (const tx of txHistory) {
      const isReward = tx.amount > 0;
      const icon = isReward ? '✅' : '💸';
      const color = isReward ? chalk.green : chalk.red;
      const sign = isReward ? '+' : '';

      console.log(
        `${icon} ${color(`${sign}${tx.amount.toFixed(2)} tokens`)} - ${tx.type}`
      );
      console.log(`   ${tx.metadata.description || 'No description'}`);
      console.log(`   ${new Date(tx.timestamp).toLocaleString()}\n`);
    }
  });
```

### 4.2 Success Metrics

Track these metrics weekly:

```typescript
// weaver/src/analytics/metrics-tracker.ts
export interface WeeklyMetrics {
  week: number;
  blockchainUptime: number;        // % uptime
  tasksLogged: number;             // Total tasks logged
  avgCostVariance: number;         // % variance (target: <20%)
  userEngagement: number;          // Active users
  promptQualityAvg: number;        // Avg quality score
  rewardsDistributed: number;      // Total rewards
}
```

---

## Integration Checklist

### Week 1-2: Blockchain
- [ ] Create `weaver/src/ledger/` module
- [ ] Implement SQLite schema for blocks/transactions/accounts
- [ ] Write comprehensive tests for blockchain operations
- [ ] Integrate with existing `shadow-cache/database.ts` for transaction hashes
- [ ] Document API usage

### Week 3-4: Rewards
- [ ] Create `weaver/src/rewards/` module
- [ ] Implement prompt quality scorer
- [ ] Build attribution engine
- [ ] Instrument `seed-generator.ts` and `deep-analyzer.ts`
- [ ] Add ledger tracking to all CLI commands

### Week 5-6: Cost Analytics
- [ ] Create `weaver/src/analytics/` module
- [ ] Build cost analyzer with variance tracking
- [ ] Implement T-shirt size estimator
- [ ] Add budget enforcement
- [ ] Generate weekly cost reports

### Week 7-8: Gamification
- [ ] Add `balance` command to CLI
- [ ] Add `rewards` command to CLI
- [ ] Add `leaderboard` command (show top earners)
- [ ] Create badge system (achievements)
- [ ] Build progress tracking dashboard

---

## Testing Strategy

### Unit Tests

```typescript
// weaver/tests/ledger/blockchain.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Blockchain } from '../../src/ledger/blockchain.js';
import { createCostTransaction, TransactionType } from '../../src/ledger/transaction.js';

describe('Blockchain', () => {
  let blockchain: Blockchain;

  beforeEach(() => {
    blockchain = new Blockchain(':memory:');  // In-memory for testing
  });

  it('should create genesis block', () => {
    const genesis = blockchain.getBlock(0);
    expect(genesis).toBeDefined();
    expect(genesis!.index).toBe(0);
    expect(genesis!.previousHash).toBe('0');
  });

  it('should add transaction and update balance', async () => {
    // Create account with initial balance
    const account = blockchain.createAccount('alice', 'user');

    // Add genesis transaction to give Alice tokens
    const genesisTx = {
      id: '1',
      type: TransactionType.GENESIS,
      from: 'system',
      to: 'alice',
      amount: 100,
      timestamp: Date.now(),
      metadata: {},
    };

    await blockchain.addTransaction(genesisTx);

    // Check balance
    const updatedAccount = blockchain.getAccount('alice');
    expect(updatedAccount!.balance).toBe(100);

    // Deduct cost
    const costTx = createCostTransaction('alice', TransactionType.COMPUTE, 10, {});
    await blockchain.addTransaction(costTx);

    const finalAccount = blockchain.getAccount('alice');
    expect(finalAccount!.balance).toBe(90);
  });

  it('should verify chain integrity', () => {
    expect(blockchain.verifyChain()).toBe(true);
  });
});
```

### Integration Tests

```typescript
// weaver/tests/integration/reward-flow.test.ts
describe('Reward Flow Integration', () => {
  it('should track full lifecycle from prompt to reward', async () => {
    const blockchain = new Blockchain(':memory:');
    const promptScorer = new PromptScorer();
    const attribution = new AttributionEngine();

    // 1. User creates account
    blockchain.createAccount('alice', 'user');

    // 2. User writes high-quality prompt
    const prompt = 'Implement TypeScript interface for User with email, name, and role fields. Include validation.';
    const quality = promptScorer.analyzePrompt(prompt);

    expect(quality.score).toBeGreaterThan(0.7);

    // 3. Reward for quality prompt
    const reward = promptScorer.calculateReward(quality);
    const rewardTx = createRewardTransaction('alice', TransactionType.PROMPT_QUALITY, reward, {
      qualityScore: quality.score,
    });
    await blockchain.addTransaction(rewardTx);

    // 4. Task executes (cost)
    const costTx = createCostTransaction('alice', TransactionType.COMPUTE, 5, {
      executionTime: 2000,
    });
    await blockchain.addTransaction(costTx);

    // 5. Task succeeds (reward)
    const taskAttribution = attribution.attributeTask('task-1', true, quality, {
      agentId: 'coder',
      executionTime: 2000,
    });

    const successTx = createRewardTransaction('alice', TransactionType.TASK_SUCCESS, taskAttribution.rewardTokens, {});
    await blockchain.addTransaction(successTx);

    // 6. Verify net positive balance
    const account = blockchain.getAccount('alice');
    expect(account!.balance).toBeGreaterThan(0);
  });
});
```

---

## Migration Strategy

### Day 1: Foundation
1. Create `weaver/src/ledger/` directory
2. Copy paste type definitions from this document
3. Run `bun test` to ensure no breaking changes

### Day 3: Database
1. Implement blockchain schema in SQLite
2. Test basic CRUD operations
3. Verify chain integrity functions

### Day 7: Integration
1. Add ledger imports to `seed-generator.ts`
2. Instrument 1-2 functions with cost tracking
3. Test end-to-end flow

### Day 14: Rewards
1. Create `weaver/src/rewards/` module
2. Implement prompt scorer
3. Test on sample prompts

### Day 21: Cost Analytics
1. Create `weaver/src/analytics/` module
2. Generate first cost report
3. Compare actual vs estimated costs

### Day 28: CLI
1. Add `balance`, `rewards`, `leaderboard` commands
2. Test with real user data
3. Gather feedback

---

## Success Criteria

### Week 2 Checkpoint
- ✅ Blockchain operational (100% uptime)
- ✅ Genesis block created
- ✅ Account creation working
- ✅ Transaction validation passing all tests
- ✅ Chain integrity verified

### Week 4 Checkpoint
- ✅ All agent tasks automatically logged
- ✅ Prompt quality analysis working
- ✅ Costs attributed to correct accounts
- ✅ Rewards distributed for quality prompts
- ✅ Integration tests passing

### Week 6 Checkpoint
- ✅ Cost variance <20% (improving weekly)
- ✅ T-shirt size estimates accurate
- ✅ Budget enforcement preventing overspend
- ✅ Weekly cost reports generated

### Week 8 Checkpoint
- ✅ User engagement +50% (tracked via CLI usage)
- ✅ Gamification working (badges, leaderboard)
- ✅ Users checking balance regularly
- ✅ Positive feedback on reward system

---

## Appendix A: Database Schema

```sql
-- Blocks table (already defined in blockchain.ts)
CREATE TABLE blocks (
  index_num INTEGER PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  previous_hash TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  merkle_root TEXT NOT NULL,
  nonce INTEGER DEFAULT 0,
  transaction_count INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  block_index INTEGER NOT NULL,
  type TEXT NOT NULL,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  metadata TEXT,  -- JSON
  signature TEXT,
  tx_hash TEXT NOT NULL,
  FOREIGN KEY (block_index) REFERENCES blocks(index_num)
);

-- Accounts table
CREATE TABLE accounts (
  account_id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('user', 'agent', 'system')),
  balance REAL NOT NULL DEFAULT 0,
  metadata TEXT,  -- JSON
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX idx_tx_from ON transactions(from_account);
CREATE INDEX idx_tx_to ON transactions(to_account);
CREATE INDEX idx_tx_type ON transactions(type);
CREATE INDEX idx_tx_timestamp ON transactions(timestamp);
CREATE INDEX idx_tx_block ON transactions(block_index);
```

---

## Appendix B: Example Workflows

### Workflow 1: User Writes Quality Prompt

```typescript
// User writes prompt
const prompt = "Create TypeScript function to validate email addresses with regex. Include tests.";

// System analyzes quality
const quality = promptScorer.analyzePrompt(prompt);
console.log(`Quality: ${quality.score * 100}%`);

// If quality >= 80%, reward immediately
if (quality.score >= 0.8) {
  const reward = promptScorer.calculateReward(quality);
  const tx = createRewardTransaction(userId, TransactionType.PROMPT_QUALITY, reward, {
    promptHash: quality.promptHash,
    qualityScore: quality.score,
  });
  await blockchain.addTransaction(tx);

  console.log(`✅ Earned ${reward} tokens for quality prompt!`);
}
```

### Workflow 2: Task Execution with Cost Tracking

```typescript
// Before task
const startTime = Date.now();

// Execute task
const result = await executeTask(prompt);

// After task
const executionTime = Date.now() - startTime;
const cost = Math.ceil(executionTime / 1000) * 2;  // 2 tokens/second

// Track cost
const costTx = createCostTransaction(userId, TransactionType.COMPUTE, cost, {
  agentId: 'coder',
  taskId: result.taskId,
  executionTime,
});
await blockchain.addTransaction(costTx);

// If successful, reward
if (result.success) {
  const rewardTx = createRewardTransaction(userId, TransactionType.TASK_SUCCESS, 10, {
    taskId: result.taskId,
  });
  await blockchain.addTransaction(rewardTx);
}
```

### Workflow 3: Weekly Cost Report

```typescript
const analyzer = new CostAnalyzer(blockchain);
const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
const now = Date.now();

const report = analyzer.generateReport(userId, oneWeekAgo, now);

console.log(`
📊 Weekly Cost Report
━━━━━━━━━━━━━━━━━━━━
Total Costs:    ${report.totalCosts} tokens
Total Rewards:  ${report.totalRewards} tokens
Net Spend:      ${report.netSpend} tokens

Costs by Type:
${Object.entries(report.costsByType).map(([type, cost]) =>
  `  ${type}: ${cost} tokens`
).join('\n')}

Avg Cost/Task:  ${report.avgCostPerTask.toFixed(2)} tokens
Variance:       ${(report.variance * 100).toFixed(1)}%
`);
```

---

## Next Steps

1. **Start with Phase 1** (blockchain ledger) - most foundational
2. **Add instrumentation gradually** - don't rewrite everything at once
3. **Collect real data** - use actual usage to improve estimates
4. **Iterate on rewards** - adjust token amounts based on user feedback
5. **Scale to L5** - once foundation is solid, build semantic layer on top

**This implementation is ready to go TODAY. Start with `weaver/src/ledger/types.ts` and work through each file sequentially.**
