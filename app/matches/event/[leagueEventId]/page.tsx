import Link from 'next/link';

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

  // Sort matches using scheduled_at or started_at (in seconds), convert to ms
  const now = Date.now();
  const ongoing: any[] = [];
  const upcoming: any[] = [];
  const past: any[] = [];

  matchData.items.forEach((match: any) => {
    // Prefer scheduled_at, fallback to started_at; convert to ms
    const start =
      typeof match.scheduled_at === 'number'
        ? match.scheduled_at * 1000
        : typeof match.started_at === 'number'
        ? match.started_at * 1000
        : NaN;

    if (match.status === 'ongoing') {
      ongoing.push(match);
    } else if (!isNaN(start)) {
      if (start > now) {
        upcoming.push(match);
      } else {
        past.push(match);
      }
    } else {
      // If no valid start time, consider upcoming by default
      upcoming.push(match);
    }
  });

  // Optionally sort each group by start time ascending
  const sortByStartTime = (a: any, b: any) => {
    const aStart =
      (a.scheduled_at ?? a.started_at ?? 0) * 1000;
    const bStart =
      (b.scheduled_at ?? b.started_at ?? 0) * 1000;
    return aStart - bStart;
  };
  ongoing.sort(sortByStartTime);
  upcoming.sort(sortByStartTime);
  past.sort(sortByStartTime);

  const renderMatch = (match: any) => {
    const team1 = match.teams?.faction1?.name || 'TBD';
    const team2 = match.teams?.faction2?.name || 'TBD';

    const timestamp =
      typeof match.scheduled_at === 'number'
        ? match.scheduled_at * 1000
        : typeof match.started_at === 'number'
        ? match.started_at * 1000
        : NaN;

    // Create timestamp data attribute for client-side rendering
    const timestampAttr = !isNaN(timestamp) ? timestamp : null;

    const result = resultMap.get(match.match_id);
    const score =
      result && result.factions_score
        ? ` — ${result.factions_score.faction1} : ${result.factions_score.faction2}`
        : '';

    return (
      <li key={match.match_id}>
        <a href={`/matches/match/${match.match_id}`}>
          {team1} vs {team2} — 
          <span 
            className="match-time" 
            data-timestamp={timestampAttr}
          >
            {!isNaN(timestamp) ? new Date(timestamp).toLocaleString() : 'Unknown Time'}
          </span>
          {score}
        </a>
      </li>
    );
  };

  return (
    <main style={{ padding: 20 }}>
      {/* TAB NAV */}
      <nav
        style={{
          marginBottom: 20,
          borderBottom: '1px solid #ccc',
          paddingBottom: 10,
          display: 'flex',
          gap: 20,
        }}
      >
        <Link
          href={`/matches/event/${championshipId}`}
          style={{ fontWeight: 'bold', color: 'blue', textDecoration: 'underline' }}
        >
          Matches
        </Link>
        <Link href={`/matches/league/${leagueId}/${seasonId}`} style={{ color: 'gray' }}>
          Bracket
        </Link>
      </nav>

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

      {/* Client-side script to format times in user's timezone */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const timeElements = document.querySelectorAll('.match-time');
              timeElements.forEach(element => {
                const timestamp = element.getAttribute('data-timestamp');
                if (timestamp) {
                  const date = new Date(parseInt(timestamp));
                  element.textContent = date.toLocaleString();
                }
              });
            });
          `,
        }}
      />
    </main>
  );
}