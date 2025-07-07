import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return new Response('Socket.io endpoint - upgrade to WebSocket required', {
    status: 426,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    },
  });
}

export async function POST(request: NextRequest) {
  // Handle socket.io polling requests
  try {
    const body = await request.text();
    
    // Forward to your actual backend server
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3006';
    
    const response = await fetch(`${backendUrl}/socket.io/`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'text/plain',
      },
      body,
    });
    
    const responseText = await response.text();
    
    return new Response(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Socket.io proxy error:', error);
    return new Response('Backend connection failed', { status: 503 });
  }
}