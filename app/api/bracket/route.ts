// app/api/brackets/route.ts
import { NextRequest, NextResponse } from 'next/server';

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
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
        },
        next: { revalidate: 60 } // Optional ISR cache
      }
    );

    if (!response.ok) {
      throw new Error(`FACEIT API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 🧠 This assumes you'll add a real parser in lib later
    // import { mapFaceitToMatches } from '@/lib/faceitBracketParser';
    // const matches = mapFaceitToMatches(data.items);

    return NextResponse.json({ matches: data.items });
  } catch (error) {
    console.error('Failed to fetch FACEIT bracket:', error);
    return NextResponse.json({ error: 'Failed to fetch FACEIT bracket' }, { status: 500 });
  }
}
