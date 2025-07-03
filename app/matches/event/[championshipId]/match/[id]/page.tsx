// app/matches/championship/[championshipId]/match/[id]/page.tsx

import Link from "next/link";

export default async function Page({ params }: { params: { championshipId: string; id: string } }) {
  const { championshipId, id } = params;

  const headers = {
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
    Accept: "application/json",
  };

  // Fetch match list to get basic info
  const matchesRes = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    { headers, cache: "no-store" }
  );
  const matchesData = await matchesRes.json();
  const match = matchesData.items.find((m: any) => m.match_id === id);

  if (!match) {
    return <p>Match not found.</p>;
  }

  // Fetch detailed match info
  const matchDetailRes = await fetch(
    `https://open.faceit.com/data/v4/matches/${id}`,
    { headers, cache: "no-store" }
  );
  const matchDetails = await matchDetailRes.json();

  // Fetch match stats
  const matchStatsRes = await fetch(
    `https://open.faceit.com/data/v4/matches/${id}/stats`,
    { headers, cache: "no-store" }
  );
  const matchStatsData = await matchStatsRes.json();

  const team1 = match.teams?.faction1?.name || "TBD";
  const team2 = match.teams?.faction2?.name || "TBD";
  const startTime = match.start_date
    ? new Date(match.start_date).toLocaleString()
    : "Unknown Time";

  return (
    <main style={{ padding: 20 }}>
      <Link href={`/matches/championship/${championshipId}`}>← Back to Match List</Link>
      <h1>{team1} vs {team2}</h1>
      <p><strong>Date:</strong> {startTime}</p>
      <p><strong>Status:</strong> {match.status || "Unknown"}</p>

      <h2>Match Details</h2>
      <p><strong>Region:</strong> {match.region}</p>
      <p><strong>Location:</strong> {match.voting?.location?.pick?.[0] || "TBD"}</p>

      {matchStatsData.rounds?.map((round: any, i: number) => (
        <div key={i} style={{ marginTop: 30 }}>
          <h3>Map: {round.round_stats?.Map}</h3>
          <p>
            {round.teams[0].team_stats?.FinalScore} - {round.teams[1].team_stats?.FinalScore}
          </p>

          {round.teams.map((team: any, idx: number) => (
            <div key={idx}>
              <h4>{team.team_name}</h4>
              <table style={{ width: "100%", marginBottom: 20, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th align="left">Player</th>
                    <th>Kills</th>
                    <th>Deaths</th>
                    <th>Assists</th>
                    <th>Headshots</th>
                  </tr>
                </thead>
                <tbody>
                  {team.players.map((player: any) => (
                    <tr key={player.player_id}>
                      <td>{player.nickname}</td>
                      <td>{player.player_stats.Kills}</td>
                      <td>{player.player_stats.Deaths}</td>
                      <td>{player.player_stats.Assists}</td>
                      <td>{player.player_stats["Headshots %"]}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}
