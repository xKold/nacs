'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Page({
  params,
  searchParams,
}: {
  params: { leagueId: string };
  searchParams: { season?: string };
}) {
  const { leagueId } = params;
  const seasonId = searchParams.season;

  const [loading, setLoading] = useState(true);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');

  useEffect(() => {
    if (!seasonId) return;

    const fetchLeagueSeason = async () => {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_FACEIT_API_KEY}`,
        Accept: 'application/json',
      };

      const res = await fetch(
        `https://open.faceit.com/data/v4/leagues/${leagueId}/seasons/${seasonId}`,
        {
          headers,
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        console.error('Failed to fetch league season data');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setDivisions(data.organizer_divisions ?? []);
      setAllMatches(data.items ?? []);
      setLoading(false);
    };

    fetchLeagueSeason();
  }, [leagueId, seasonId]);

  const now = Date.now();
  const filteredMatches = selectedDivisionId
    ? allMatches.filter(m => m.organizer_division_id === selectedDivisionId)
    : [];

  const ongoing: any[] = [];
  const upcoming: any[] = [];
  const past: any[] = [];

  filteredMatches.forEach((match: any) => {
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

  const sortByStart = (a: any, b: any) => {
    const aStart = (a.scheduled_at ?? a.started_at ?? 0) * 1000;
    const bStart = (b.scheduled_at ?? b.started_at ?? 0) * 1000;
    return aStart - bStart;
  };

  ongoing.sort(sortByStart);
  upcoming.sort(sortByStart);
  past.sort(sortByStart);

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

  if (!seasonId) {
    return (
      <main style={{ padding: 20 }}>
        <p>Missing season ID in query string (?season=SEASON_ID)</p>
      </main>
    );
  }

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
          href={`/matches/event/${leagueId}?season=${seasonId}`}
          style={{ fontWeight: 'bold', color: 'blue', textDecoration: 'underline' }}
        >
          Matches
        </Link>
        <Link href="#" style={{ color: 'gray' }}>
          Standings
        </Link>
      </nav>

      <h1>Matches for League Season</h1>

      <label htmlFor="division" style={{ fontWeight: 'bold' }}>
        Select Division:
      </label>
      <select
        id="division"
        onChange={e => setSelectedDivisionId(e.target.value)}
        value={selectedDivisionId}
        style={{ margin: '10px 0', padding: '6px' }}
      >
        <option value="" disabled>
          -- Choose a Division --
        </option>
        {divisions.map((div: any) => (
          <option key={div.division_id} value={div.division_id}>
            {div.name}
          </option>
        ))}
      </select>

      {loading && <p>Loading matches...</p>}

      {!loading && selectedDivisionId && (
        <>
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

          {filteredMatches.length === 0 && <p>No matches found for this division.</p>}
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
