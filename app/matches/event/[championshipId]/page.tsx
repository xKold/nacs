export default async function Page({ params }: any) {
  const { championshipId } = params;

 const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}
`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const errorText = await res.text();  // get error details from response body
    return (
      <main style={{ padding: 20 }}>
        <p>
          Failed to load matches: {res.status} {res.statusText} — {errorText}
        </p>
      </main>
    );
  }

  const data = await res.json();

  return (
    <main style={{ padding: 20 }}>
      <h1>Matches for Championship</h1>
      <ul>
        {data.items.map((match: any) => (
          <li key={match.match_id}>
            <a href={`/matches/match/${match.match_id}`}>
              {match.teams[0].nickname} vs {match.teams[1].nickname} —{" "}
              {new Date(match.start_date).toLocaleString()}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
