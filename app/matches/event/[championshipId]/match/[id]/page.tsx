import Link from "next/link";

export default async function MatchDetailPage({ params }: any) {
  const { eventType, eventId, matchId } = params;

  const res = await fetch(`https://open.faceit.com/data/v4/championships/${championshipId}/matches`, {
    headers: {
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return <p>Failed to load match data.</p>;
  }

  const data = await res.json();
  const match = data.items.find((m: any) => m.match_id === matchId);

  if (!match) {
    return <p>Match not found.</p>;
  }

  const team1 = match.teams?.faction1?.name || "TBD";
  const team2 = match.teams?.faction2?.name || "TBD";
  const startTime = match.start_date ? new Date(match.start_date).toLocaleString() : "Unknown Time";

  return (
    <main style={{ padding: 20 }}>
      <Link href={`/matches/${eventType}/${eventId}`} style={{ marginBottom: 20, display: "inline-block" }}>
        ← Back to {eventType} Match List
      </Link>

      <h1>{team1} vs {team2}</h1>
      <p>Date: {startTime}</p>
      <p>Status: {match.status || "Unknown"}</p>

      {match.maps?.length > 0 && (
        <section>
          <h2>Maps</h2>
          {match.maps.map((mp: any, i: number) => (
            <div key={i}>
              <h3>{mp.name}</h3>
              <p>
                {mp.teams?.faction1?.rounds != null
                  ? `${mp.teams.faction1.rounds} - ${mp.teams.faction2.rounds}`
                  : "TBD"}
              </p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
