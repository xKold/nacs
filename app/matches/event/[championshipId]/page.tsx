// app/matches/event/[championshipId]/page.tsx

export default async function Page({ params }: { params: { championshipId: string } }) {
  const championshipId = params.championshipId;

  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY ?? ''}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    return <p>Failed to load match data. (Status: {res.status})</p>;
  }

  const data = await res.json();

  return (
    <main style={{ padding: 20 }}>
      <h1>Matches for Championship</h1>
      {data.items?.length === 0 ? (
        <p>No matches found.</p>
      ) : (
        <ul>
          {data.items.map((match: any) => (
            <li key={match.match_id}>
              {match.teams?.[0]?.nickname ?? 'TBD'} vs {match.teams?.[1]?.nickname ?? 'TBD'}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
