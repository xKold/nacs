export async function GET(req: Request) {
  const url = new URL(req.url);
  const championshipId = url.searchParams.get('championshipId');
  if (!championshipId) return new Response('championshipId missing', { status: 400 });

  const resp = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    { headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` } }
  );

  if (!resp.ok) {
    return new Response(await resp.text(), { status: resp.status });
  }

  const data = await resp.json();
  return new Response(JSON.stringify(data), { status: 200 });
}
