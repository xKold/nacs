export default async function Page(props: any) {
  const { id } = props.params;

  const championshipId = "f56331e8-131a-4c50-b7db-eec8b010ff98";

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
    return <p>Failed to load match data.</p>;
  }

  const data = await res.json();
  const match = data.items.find((m: any) => m.match_id === id);

  if (!match) {
    return <p>Match not found.</p>;
  }

  const team1 = match.teams?.faction1?.name || "TBD";
  const team2 = match.teams?.faction2?.name || "TBD";
  const startTime = match.start_date
    ? new Date(match.start_date).toLocaleString()
    : "Unknown Time";

  return (
    <main style={{ padding: 20 }}>
      <h1>
        {team1} vs {team2}
      </h1>
      <p>Date: {startTime}</p>
      <p>Status: {match.status || "Unknown"}</p>

      {/* Optional: if you later get maps info from another endpoint */}
      {match.maps?.length > 0 && (
        <section>
          <h2>Maps</h2>
          {match.maps.map((mp: any, i: number) => (
            <div key={i}>
              <h3>{mp.name}</h3>
              <p>
                {mp.teams?.[0]?.rounds
                  ? `${mp.teams[0].rounds} - ${mp.teams[1].rounds}`
                  : "TBD"}
              </p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
