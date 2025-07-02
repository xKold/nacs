// app/matches/[id]/page.tsx

type Props = {
  params: {
    id: string;
  };
};

export default async function MatchDetail({ params }: Props) {
  const championshipId = "3de05c27-da01-4ede-9319-f5b3f16dfb1f";

  const res = await fetch(
    `/api/matches?championshipId=${championshipId}`,
    { cache: "no-store" } // always fetch fresh data
  );

  if (!res.ok) {
    return <p>Failed to load match data.</p>;
  }

  const data = await res.json();
  const match = data.items.find((m: any) => m.match_id === params.id);

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
