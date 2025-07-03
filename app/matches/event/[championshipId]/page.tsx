export default async function Page({ params }: any) {
  const { championshipId } = params;

  // Fetch match schedule data
  const res = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    return (
      <main style={{ padding: 20 }}>
        <p>
          Failed to load matches: {res.status} {res.statusText} — {errorText}
        </p>
      </main>
    );
  }

  const matchData = await res.json();

  // Fetch results for past matches
  const resultRes = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/results`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  const resultsData = resultRes.ok ? await resultRes.json() : { items: [] };

  // Build a map of match_id -> result
  const resultMap = new Map();
  resultsData.items.forEach((result: any) => {
    resultMap.set(result.match_id, result);
  });

  // Sort matches
  const now = Date.now();
  const ongoing: any[] = [];
  const upcoming: any[] = [];
  const past: any[] = [];

  matchData.items.forEach((match: any) => {
    const start = match.start_date ? new Date(match.start_date).getTime() : 0;
    if (match.status === 'ongoing') {
      ongoing.push(match);
    } else if (start > now) {
      upcoming.push(match);
    } else {
      past.push(match);
    }
  });

  const renderMatch = (match: any) => {
    const team1 = match.teams?.faction1?.name || 'TBD';
    const team2 = match.teams?.faction2?.name || 'TBD';
    const matchTime = match.start_date
      ? new Date(match.start_date).toLocaleString()
      : 'Unknown Time';

    const result = resultMap.get(match.match_id);
    const score =
      result && result.factions_score
        ? ` — ${result.factions_score.faction1} : ${result.factions_score.faction2}`
        : '';

    return (
      <li key={match.match_id}>
        <a href={`/matches/match/${match.match_id}`}>
          {team1} vs {team2} — {matchTime}{score}
        </a>
      </li>
    );
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Matches for Championship</h1>

      {ongoing.length > 0 && (
        <>
          <h2>Ongoing Matches</h2>
          <ul>{ongoing.map(renderMatch)}</ul>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <h2>Upcoming Matches</h2>
          <ul>{upcoming.map(renderMatch)}</ul>
        </>
      )}

      {past.length > 0 && (
        <>
          <h2>Past Matches</h2>
          <ul>{past.map(renderMatch)}</ul>
        </>
      )}
    </main>
  );
}
