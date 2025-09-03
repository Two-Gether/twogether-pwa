import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    console.log('API Base URL:', apiBase);
    
    if (!apiBase) {
      return NextResponse.json({ error: 'API_BASE_URL is not configured' }, { status: 500 });
    }

    // 받은 JSON을 그대로 전달
    const body = await request.json();
    console.log('Request body:', body);

    const upstreamUrl = `${apiBase}/v1/member/email/send`;
    console.log('Upstream URL:', upstreamUrl);
    
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('Upstream response status:', upstream.status);

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => 'Upstream error');
      return new NextResponse(text, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
      });
    }

    const responseText = await upstream.text();
    return new NextResponse(responseText, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}


