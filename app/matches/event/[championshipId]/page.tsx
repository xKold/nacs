import Link from 'next/link';

export default async function EventMatchesPage({ params }: { params: { championshipId: string } }) {
  const { championshipId } = params;

  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    {
      headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` },
      cache: 'no-store',
    }
  );

  if (!res.ok) return <p>Failed to load matches.</p>;

  const data = await res.json();

  return (
    <main style={{ padding: 20 }}>
      <h1>Matches for Championship</h1>
      <ul>
        {data.items.map((match: any) => (
          <li key={match.match_id}>
            <Link href={`/matches/match/${match.match_id}`}>
              {match.teams[0].nickname} vs {match.teams[1].nickname} —{' '}
              {new Date(match.start_date).toLocaleString()}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
