export default async function Page(props: any) {
  const { id } = props.params;

  const championshipId = "81e36970-81ec-4e53-b2af-c0a1c0b52938";

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

  return (
    <main style={{ padding: 20 }}>
      <h1>
        {match.teams[0].nickname} vs {match.teams[1].nickname}
      </h1>
      <p>Date: {new Date(match.start_date).toLocaleString()}</p>
      <p>Status: {match.status}</p>

      {match.maps?.map((mp: any, i: number) => (
        <div key={i}>
          <h3>{mp.name}</h3>
          <p>
            {mp.teams[0].rounds
              ? `${mp.teams[0].rounds} - ${mp.teams[1].rounds}`
              : "TBD"}
          </p>
        </div>
      ))}
    </main>
  );
}
