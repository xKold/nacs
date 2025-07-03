// app/matches/match/[id]/page.tsx
import MatchStatsDisplay from './MatchStatsDisplay';

interface Params {
  id: string;
}

export default async function Page({ params }: { params: Params }) {
  const { id } = params;

  const headers = {
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
    Accept: "application/json",
  };

  // Fetch match details
  const matchDetailRes = await fetch(`https://open.faceit.com/data/v4/matches/${id}`, { headers, cache: 'no-store' });
  if (!matchDetailRes.ok) {
    return (
      <main style={{ padding: 20 }}>
        <p>Match not found (status: {matchDetailRes.status})</p>
      </main>
    );
  }
  const matchDetails = await matchDetailRes.json();

  // Fetch match stats
  const matchStatsRes = await fetch(`https://open.faceit.com/data/v4/matches/${id}/stats`, { headers, cache: 'no-store' });
  const matchStats = matchStatsRes.ok ? await matchStatsRes.json() : { rounds: [] };

  return (
    <main style={{ padding: 20 }}>
      <h1>{matchDetails.teams?.faction1?.name ?? "TBD"} vs {matchDetails.teams?.faction2?.name ?? "TBD"}</h1>
      <p><strong>Date:</strong> {matchDetails.start_date ? new Date(matchDetails.start_date).toLocaleString() : "Unknown"}</p>
      <p><strong>Status:</strong> {matchDetails.status ?? "Unknown"}</p>

      <MatchStatsDisplay matchStats={matchStats} />
    </main>
  );
}
