import { NextRequest, NextResponse } from 'next/server';

/**
 * BFF API route for graph data
 * Proxies requests to the backend API
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/graph - Fetch graph data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeTypes = searchParams.get('nodeTypes');
    const edgeTypes = searchParams.get('edgeTypes');
    const depth = searchParams.get('depth');

    // Build query params for backend
    const params = new URLSearchParams();
    if (nodeTypes) params.set('nodeTypes', nodeTypes);
    if (edgeTypes) params.set('edgeTypes', edgeTypes);
    if (depth) params.set('depth', depth);

    const response = await fetch(`${BACKEND_URL}/api/graph?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: error.message || 'Failed to fetch graph data',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Graph API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graph - Create nodes/edges
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/graph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_ERROR',
            message: error.message || 'Failed to create graph element',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Graph API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
