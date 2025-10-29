import { NextRequest, NextResponse } from 'next/server';
import { start } from '@workflow/core/runtime';
import { documentConnectionWorkflow } from '../../../workflows/document-connection';

interface WorkflowRequestBody {
  filePath: string;
  vaultRoot: string;
  eventType?: 'add' | 'change';
  dryRun?: boolean;
}

/**
 * API Route: Trigger Document Connection Workflow
 *
 * POST /api/workflows
 * Body: { filePath: string, vaultRoot: string, eventType?: 'add' | 'change', dryRun?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WorkflowRequestBody;
    const { filePath, vaultRoot, eventType = 'change' as const, dryRun = false } = body;

    if (!filePath || !vaultRoot) {
      return NextResponse.json(
        { error: 'Missing required fields: filePath, vaultRoot' },
        { status: 400 }
      );
    }

    console.log(`[API] Starting workflow for file: ${filePath}`);

    // Start workflow execution
    const run = await start(documentConnectionWorkflow, [{
      filePath,
      vaultRoot,
      eventType: (eventType || 'change') as 'add' | 'change',
      dryRun,
    }]);

    // Get result
    const result = await run.returnValue;

    console.log(`[API] Workflow completed: ${result.success ? 'success' : 'failed'}`);

    // Log workflow execution details
    if (result.log) {
      console.log('[API] Workflow log:');
      result.log.forEach(line => console.log(`  ${line}`));
    }

    // Generate unique run ID
    const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      runId,
      result,
    });
  } catch (error) {
    console.error('[API] Workflow execution failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows
 * Returns list of available workflows
 */
export async function GET() {
  return NextResponse.json({
    workflows: [
      {
        id: 'document-connection',
        name: 'Document Connection Workflow',
        description: 'Automatically connects documents based on context similarity',
        endpoint: '/api/workflows',
        method: 'POST',
        parameters: {
          filePath: 'string (required)',
          vaultRoot: 'string (required)',
          eventType: 'string (optional, default: change)',
          dryRun: 'boolean (optional, default: false)',
        },
      },
    ],
  });
}
