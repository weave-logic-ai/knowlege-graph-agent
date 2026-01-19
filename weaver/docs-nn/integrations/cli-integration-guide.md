---
title: "CLI INTEGRATION GUIDE"
type: integration
status: active
category: integrations
description: "**Purpose:** Complete the integration between recovery modules and PM2/CLI"
created: 2025-12-29
updated: 2025-12-29
original: "docs/CLI-INTEGRATION-GUIDE.md"
---

# CLI INTEGRATION GUIDE

## Overview

**Purpose:** Complete the integration between recovery modules and PM2/CLI

> [!info] Original Documentation
> See [[docs/CLI-INTEGRATION-GUIDE.md|original document]] for full details.

## Key Concepts

- **Overview**
- **Phase 1: Complete Test Helpers (2 hours)**
- **Phase 2: Wire PM2 Event Bus (3 hours)**
- **Phase 3: Add Missing Singleton Exports (30 minutes)**
- **Phase 4: Integration Testing (2-3 hours)**
- **Purpose:**
- **Estimated Time:**
- **Current Status:**
- **Recovery Modules (1,200 LOC):**
- **Performance Modules (600 LOC):**

## Research Needed

> [!warning] Areas Requiring Further Research
> - 1 Implement `execCLI()` Function

```typescript
/**
 * Execute CLI command for testing
 */
export async function execCLI(
  command: string,
  args: string[],
  options: { timeout?
> - : number; env?
> - url === '/health') {
    requestCount++;

    ${shouldFail ?
> - Has empty sections that need content

## TODOs

- [ ] Implement `execCLI()`
- [ ] Implement `createMockService()`
- [ ] Implement `waitForService()`
- [ ] Implement `waitForServiceStop()`
- [ ] Implement `simulateCrash()`
- [ ] Implement `createMockDatabase()`
- [ ] Implement `corruptDatabase()`
- [ ] Implement `isPortInUse()`
- [ ] Implement `getProcessMetrics()`
- [ ] Add `initializeEventBus()` to ProcessManager

## Tags


