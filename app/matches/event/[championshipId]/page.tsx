// app/matches/event/[championshipId]/page.tsx

interface PageProps {
  params: {
    championshipId: string;
  };
}

export default async function Page({ params }: PageProps) {
  const { championshipId } = params;

  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      },
      cache: "no-store",
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
              {match.teams[0]?.nickname} vs {match.teams[1]?.nickname}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
