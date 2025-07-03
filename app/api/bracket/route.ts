import { NextRequest, NextResponse } from 'next/server';
import { mapFaceitToMatches } from 'app/lib/faceitBracketParcer.ts';

export async function GET(req: NextRequest) {
  const championshipId = req.nextUrl.searchParams.get('championshipId');

  if (!championshipId) {
    return NextResponse.json({ error: 'Missing championshipId' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
          Accept: 'application/json'
        },
        next: { revalidate: 60 } // optional ISR-style cache
      }
    );

    if (!response.ok) {
      console.error('FACEIT API error:', response.statusText);
      return NextResponse.json({ error: 'FACEIT API error' }, { status: response.status });
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.warn('Unexpected FACEIT response:', data);
      return NextResponse.json({ error: 'Unexpected data format' }, { status: 500 });
    }

    const matches = mapFaceitToMatches(data.items);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Failed to fetch bracket data:', error);
    // Optional: return fallback mock matches for dev
    return NextResponse.json({ matches: mockMatches }, { status: 200 });
  }
}