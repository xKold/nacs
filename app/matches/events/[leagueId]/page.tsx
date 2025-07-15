import Link from 'next/link';
import { getEventByLeagueAndSeason } from '../../../lib/events/events';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>;
  searchParams?: Promise<{ 
    season?: string; 
    division?: string;
    stage?: string;
    conference?: string;
    region?: string;
  }>;
}) {
  const { leagueId } = await params;
  const resolvedSearchParams = await searchParams;
  const seasonId = resolvedSearchParams?.season;
  const divisionId = resolvedSearchParams?.division;
  const stageId = resolvedSearchParams?.stage;
  const conferenceId = resolvedSearchParams?.conference;
  const regionId = resolvedSearchParams?.region;

  // Get event info from our events configuration
  const eventInfo = seasonId ? getEventByLeagueAndSeason(leagueId, seasonId) : null;

  if (!seasonId) {
    return (
      <main style={{ padding: 20 }}>
        <p>Missing season ID in query string (?season=SEASON_ID)</p>
      </main>
    );
  }

  if (!eventInfo) {
    return (
      <main style={{ padding: 20 }}>
        <p>Event not found for league {leagueId} and season {seasonId}</p>
        <p>Please check your events configuration.</p>
      </main>
    );
  }

  // Fetch season data to get divisions
  const seasonRes = await fetch(
    `https://open.faceit.com/data/v4/leagues/${leagueId}/seasons/${seasonId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!seasonRes.ok) {
    const errorText = await seasonRes.text();
    return (
      <main style={{ padding: 20 }}>
        <p>Failed to load season data: {seasonRes.status} {seasonRes.statusText} — {errorText}</p>
        <p>Event: {eventInfo.name}</p>
      </main>
    );
  }

  const seasonData = await seasonRes.json();
  const divisions = seasonData.organizer_divisions ?? [];

  let matches: any[] = [];
  let selectedDivision = null;

  // If a division is selected, fetch matches for that division
  if (divisionId) {
    selectedDivision = divisions.find((div: any) => div.division_id === divisionId);
    
    // Build the matches URL with all parameters
    const matchesUrl = new URL(`https://open.faceit.com/data/v4/leagues/${leagueId}/seasons/${seasonId}/matches`);
    matchesUrl.searchParams.append('division', divisionId);
    if (stageId) matchesUrl.searchParams.append('stage', stageId);
    if (conferenceId) matchesUrl.searchParams.append('conference', conferenceId);
    if (regionId) matchesUrl.searchParams.append('region', regionId);
    matchesUrl.searchParams.append('limit', '100');

    const matchesRes = await fetch(matchesUrl.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (matchesRes.ok) {
      const matchesData = await matchesRes.json();
      matches = matchesData.items ?? [];
    } else {
      const errorText = await matchesRes.text();
      console.error('Failed to fetch matches:', errorText);
    }
  }

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
      <li key={match.match_id} style={{ marginBottom: 10 }}>
        <a href={`/matches/match/${match.match_id}`} style={{ textDecoration: 'none' }}>
          <div style={{ 
            padding: 10, 
            border: '1px solid #ddd', 
            borderRadius: 4,
            backgroundColor: '#f9f9f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background-color 0.2s'
          }}>
            <span style={{ fontWeight: 'bold' }}>{team1} vs {team2}</span>
            <span className="match-time" data-timestamp={timestampAttr} style={{ color: '#666' }}>
              {!isNaN(timestamp) ? new Date(timestamp).toLocaleString() : 'Unknown Time'}
            </span>
          </div>
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
        <Link href="#" style={{ color: 'gray' }}>
          Standings
        </Link>
      </nav>

      <div style={{ marginBottom: 20 }}>
        <h1>{eventInfo.name}</h1>
        <p style={{ color: '#666', margin: '5px 0' }}>
          {eventInfo.region} • Started {new Date(eventInfo.startDate).toLocaleDateString()}
        </p>
      </div>
      
      <div style={{ marginBottom: 20 }}>
        <label htmlFor="division-select" style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
          Select Division:
        </label>
        <select 
          id="division-select"
          style={{ 
            padding: 8, 
            fontSize: 16, 
            borderRadius: 4, 
            border: '1px solid #ccc',
            minWidth: 200
          }}
          value={divisionId || ''}
          onChange={(e) => {
            const newDivisionId = e.target.value;
            if (newDivisionId) {
              const currentParams = new URLSearchParams(window.location.search);
              currentParams.set('division', newDivisionId);
              window.location.search = currentParams.toString();
            }
          }}
        >
          <option value="">-- Select a Division --</option>
          {divisions.map((division: any) => (
            <option key={division.division_id} value={division.division_id}>
              {division.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDivision && (
        <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <h2 style={{ margin: '0 0 10px 0' }}>Division: {selectedDivision.name}</h2>
          <p style={{ margin: 0, color: '#666' }}>Total matches: {matches.length}</p>
        </div>
      )}

      {!divisionId && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 4, 
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontStyle: 'italic', color: '#666' }}>
            Please select a division above to view matches.
          </p>
        </div>
      )}

      {divisionId && matches.length === 0 && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#fff3cd', 
          borderRadius: 4, 
          border: '1px solid #ffeaa7',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            No matches found for {selectedDivision?.name || 'this division'}.
          </p>
        </div>
      )}

      {ongoing.length > 0 && (
        <>
          <h2 style={{ color: '#d32f2f', marginBottom: 15 }}>
            🔴 Ongoing Matches ({ongoing.length})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 30 }}>
            {ongoing.map(renderMatch)}
          </ul>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 style={{ color: '#1976d2', marginBottom: 15 }}>
            📅 Upcoming Matches ({upcoming.length})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 30 }}>
            {upcoming.map(renderMatch)}
          </ul>
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 style={{ color: '#388e3c', marginBottom: 15 }}>
            ✅ Past Matches ({past.length})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 30 }}>
            {past.map(renderMatch)}
          </ul>
        </>
      )}

      <style jsx>{`
        a:hover div {
          background-color: #f0f0f0 !important;
        }
      `}</style>

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