import { NextResponse } from 'next/server';

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const championshipId = searchParams.get('championshipId');
  const leagueId = searchParams.get('leagueId');
  const seasonId = searchParams.get('seasonId');

  let url = '';
  if (championshipId) {
    url = `https://open.faceit.com/data/v4/championships/${championshipId}/matches`;
  } else if (leagueId && seasonId) {
    url = `https://open.faceit.com/data/v4/leagues/${leagueId}/seasons/${seasonId}`;
  } else {
    return NextResponse.json(
      { error: 'Missing required parameters: either championshipId or leagueId + seasonId' },
      { status: 400 }
    );
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${FACEIT_API_KEY}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch from FACEIT API' },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
