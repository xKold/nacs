import Link from 'next/link';

export default async function Page({
  params,
  searchParams,
}: {
  params: { leagueId: string } | Promise<{ leagueId: string }>;
  searchParams?: { season?: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const leagueId = resolvedParams.leagueId;
  const seasonId = searchParams?.season;

  if (!seasonId) {
    return (
      <main style={{ padding: 20 }}>
        <p>Missing season ID in query string (?season=SEASON_ID)</p>
      </main>
    );
  }

  // Fetch season details, which include matches and divisions
  const res = await fetch(
    `https://open.faceit.com/data/v4/leagues/${leagueId}/seasons/${seasonId}`,
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
          Failed to load league season data: {res.status} {res.statusText} — {errorText}
        </p>
      </main>
    );
  }

  const seasonData = await res.json();

  const matches = seasonData.items ?? [];
  const divisions = seasonData.organizer_divisions ?? [];

  const now = Date.now();
  const ongoing: any[] = [];
  const upcoming: any[] = [];
  const past: any[] = [];

  matches.forEach((match: any) => {
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
      upcoming.push(match);
    }
  });

  const sortByStartTime = (a: any, b: any) => {
    const aStart = (a.scheduled_at ?? a.started_at ?? 0) * 1000;
    const bStart = (b.scheduled_at ?? b.started_at ?? 0) * 1000;
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

    const timestampAttr = !isNaN(timestamp) ? timestamp : null;

    return (
      <li key={match.match_id}>
        <a href={`/matches/match/${match.match_id}`}>
          {team1} vs {team2} —{' '}
          <span className="match-time" data-timestamp={timestampAttr}>
            {!isNaN(timestamp) ? new Date(timestamp).toLocaleString() : 'Unknown Time'}
          </span>
        </a>
      </li>
    );
  };

  return (
    <main style={{ padding: 20 }}>
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
          href={`/matches/events/${leagueId}?season=${seasonId}`}
          style={{ fontWeight: 'bold', color: 'blue', textDecoration: 'underline' }}
        >
          Matches
        </Link>
        {/* Placeholder for standings or other nav */}
        <Link href="#" style={{ color: 'gray' }}>
          Standings
        </Link>
      </nav>

      <h1>Matches for League Season</h1>

      {divisions.length > 1 && (
        <p style={{ fontStyle: 'italic', marginBottom: 10 }}>
          Note: Multiple divisions exist. Currently showing all matches combined.
        </p>
      )}

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
