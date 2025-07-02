import { NextResponse } from 'next/server';

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const championshipId = searchParams.get('championshipId');

  if (!championshipId) {
    return NextResponse.json({ error: 'Missing championshipId query parameter' }, { status: 400 });
  }

  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    {
      headers: {
        Authorization: `Bearer ${FACEIT_API_KEY}`,
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch from FACEIT API' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
