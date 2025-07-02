// app/api/matches/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');

  if (!leagueId) {
    return new Response(JSON.stringify({ error: 'Missing leagueId' }), { status: 400 });
  }

  const res = await fetch(`https://open.faceit.com/data/v4/championships/${leagueId}/matches`, {
    headers: {
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
    },
    next: { revalidate: 60 }, // Optional: cache for 60s
  });

  if (!res.ok) {
    const error = await res.text();
    return new Response(error, { status: res.status });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data));
}
