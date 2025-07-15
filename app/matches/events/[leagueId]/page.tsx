import Link from 'next/link';
import { getEventByLeagueAndSeason } from '../../../lib/events';

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
    debug?: string;
  }>;
}) {
  const { leagueId } = await params;
  const resolvedSearchParams = await searchParams;
  const seasonId = resolvedSearchParams?.season;
  const divisionId = resolvedSearchParams?.division;
  const stageId = resolvedSearchParams?.stage;
  const conferenceId = resolvedSearchParams?.conference;
  const regionId = resolvedSearchParams?.region;
  const debugMode = resolvedSearchParams?.debug === 'true';

  // Get event info from our events configuration
  const eventInfo = seasonId ? getEventByLeagueAndSeason(leagueId, seasonId) : null;

  if (!seasonId) {
    return (
      <main style={{ padding: 20 }}>
        <p>Missing season ID in query string (?season=SEASON_ID)</p>
        <p>Example: <code>?season=3de05c27-da01-4ede-9319-f5b3f16dfb1f</code></p>
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

  // Debug information
  const debugInfo: any = {
    leagueId,
    seasonId,
    divisionId,
    stageId,
    conferenceId,
    regionId,
    eventInfo,
    apiKey: process.env.FACEIT_API_KEY ? 'Present' : 'Missing',
    urls: {}
  };

  let seasonData: any = null;
  let seasonError: string | null = null;

  // Fetch season data to get divisions
  try {
    const seasonUrl = `https://open.faceit.com/data/v4/leagues/${leagueId}/seasons/${seasonId}`;
    debugInfo.urls.season = seasonUrl;

    const seasonRes = await fetch(seasonUrl, {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    debugInfo.seasonResponse = {
      status: seasonRes.status,
      statusText: seasonRes.statusText,
      headers: Object.fromEntries(seasonRes.headers.entries()),
    };

    if (!seasonRes.ok) {
      const errorText = await seasonRes.text();
      seasonError = `${seasonRes.status} ${seasonRes.statusText}: ${errorText}`;
      debugInfo.seasonError = seasonError;
    } else {
      seasonData = await seasonRes.json();
      debugInfo.seasonData = seasonData;
    }
  } catch (error) {
    seasonError = `Network error: ${error}`;
    debugInfo.seasonError = seasonError;
  }

  if (seasonError) {
    return (
      <main style={{ padding: 20 }}>
        <h1>FACEIT API Debug - Season Error</h1>
        <div style={{ backgroundColor: '#ffe6e6', padding: 15, borderRadius: 4, marginBottom: 20 }}>
          <h2>Season API Error</h2>
          <p><strong>Error:</strong> {seasonError}</p>
          <p><strong>URL:</strong> <code>{debugInfo.urls.season}</code></p>
          <p><strong>API Key:</strong> {debugInfo.apiKey}</p>
        </div>
        
        <div style={{ backgroundColor: '#f0f0f0', padding: 15, borderRadius: 4 }}>
          <h3>Debug Information</h3>
          <pre style={{ overflow: 'auto', fontSize: 12 }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div style={{ marginTop: 20 }}>
          <h3>Troubleshooting Steps</h3>
          <ol>
            <li>Verify your FACEIT API key is correct and active</li>
            <li>Check if the league ID and season ID are valid</li>
            <li>Test the API endpoint directly in a tool like Postman</li>
            <li>Ensure your IP is not rate-limited</li>
          </ol>
        </div>
      </main>
    );
  }

  const divisions = seasonData?.organizer_divisions ?? [];
  let matches: any[] = [];
  let selectedDivision = null;
  let matchesError: string | null = null;

  // If a division is selected, fetch matches for that division
  if (divisionId) {
    selectedDivision = divisions.find((div: any) => div.division_id === divisionId);
    
    try {
      // Build the matches URL with all parameters
      const matchesUrl = new URL(`https://open.faceit.com/data/v4/leagues/${leagueId}/seasons/${seasonId}/matches`);
      matchesUrl.searchParams.append('division', divisionId);
      if (stageId) matchesUrl.searchParams.append('stage', stageId);
      if (conferenceId) matchesUrl.searchParams.append('conference', conferenceId);
      if (regionId) matchesUrl.searchParams.append('region', regionId);
      matchesUrl.searchParams.append('limit', '100');

      debugInfo.urls.matches = matchesUrl.toString();

      const matchesRes = await fetch(matchesUrl.toString(), {
        headers: {
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      debugInfo.matchesResponse = {
        status: matchesRes.status,
        statusText: matchesRes.statusText,
        headers: Object.fromEntries(matchesRes.headers.entries()),
      };

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        matches = matchesData.items ?? [];
        debugInfo.matchesData = {
          totalItems: matchesData.items?.length || 0,
          start: matchesData.start,
          end: matchesData.end,
          items: matchesData.items?.slice(0, 3) // Show first 3 matches for debug
        };
      } else {
        const errorText = await matchesRes.text();
        matchesError = `${matchesRes.status} ${matchesRes.statusText}: ${errorText}`;
        debugInfo.matchesError = matchesError;
      }
    } catch (error) {
      matchesError = `Network error: ${error}`;
      debugInfo.matchesError = matchesError;
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
            alignItems: 'center'
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
        <Link
          href={`/matches/events/${leagueId}?season=${seasonId}&debug=true`}
          style={{ color: debugMode ? 'red' : 'green', textDecoration: 'underline' }}
        >
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </Link>
      </nav>

      <div style={{ marginBottom: 20 }}>
        <h1>{eventInfo.name}</h1>
        <p style={{ color: '#666', margin: '5px 0' }}>
          {eventInfo.region} • Started {new Date(eventInfo.startDate).toLocaleDateString()}
        </p>
      </div>

      {debugMode && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: 15, 
          borderRadius: 4, 
          marginBottom: 20,
          border: '1px solid #2196f3'
        }}>
          <h2>🔍 Debug Information</h2>
          <div style={{ marginBottom: 10 }}>
            <strong>API Status:</strong> {debugInfo.apiKey === 'Present' ? '✅ API Key Found' : '❌ API Key Missing'}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>Season API:</strong> {seasonData ? '✅ Success' : '❌ Failed'}
          </div>
          {divisionId && (
            <div style={{ marginBottom: 10 }}>
              <strong>Matches API:</strong> {matches.length > 0 ? '✅ Success' : matchesError ? '❌ Failed' : '⚠️ No data'}
            </div>
          )}
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Full Debug Data</summary>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: 10, 
              borderRadius: 4, 
              overflow: 'auto',
              fontSize: 12,
              marginTop: 10
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {matchesError && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          padding: 15, 
          borderRadius: 4, 
          marginBottom: 20,
          border: '1px solid #f44336'
        }}>
          <h3>⚠️ Matches API Error</h3>
          <p><strong>Error:</strong> {matchesError}</p>
          <p><strong>URL:</strong> <code>{debugInfo.urls.matches}</code></p>
        </div>
      )}
      
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
              if (debugMode) currentParams.set('debug', 'true');
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
        {debugMode && (
          <p style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
            Found {divisions.length} divisions
          </p>
        )}
      </div>

      {selectedDivision && (
        <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <h2 style={{ margin: '0 0 10px 0' }}>Division: {selectedDivision.name}</h2>
          <p style={{ margin: 0, color: '#666' }}>Total matches: {matches.length}</p>
          {debugMode && (
            <div style={{ marginTop: 10, fontSize: 12 }}>
              <p><strong>Division ID:</strong> {selectedDivision.division_id}</p>
              <p><strong>Region:</strong> {selectedDivision.region}</p>
              <p><strong>Organizer:</strong> {selectedDivision.organizer_id}</p>
            </div>
          )}
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

      {divisionId && matches.length === 0 && !matchesError && (
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