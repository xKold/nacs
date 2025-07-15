'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Match {
  match_id: string;
  status: string;
  teams: {
    faction1?: { name: string };
    faction2?: { name: string };
    nickname?: string;
  };
  scheduled_at?: number;
  started_at?: number;
  start_date?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // === Toggle this section ===
  const matchType: 'championship' | 'league' = 'league'; // ← Change to 'championship' if needed

  // For championship:
  const championshipId = 'f56331e8-131a-4c50-b7db-eec8b010ff98';

  // For league:
  const leagueId = 'a14b8616-45b9-4581-8637-4dfd0b5f6af8';
  const seasonId = '3de05c27-da01-4ede-9319-f5b3f16dfb1f';

  useEffect(() => {
    let url = '/api/matches?';

    if (matchType === 'championship') {
      url += `championshipId=${championshipId}`;
    } else {
      url += `leagueId=${leagueId}&seasonId=${seasonId}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.items || []);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [matchType, championshipId, leagueId, seasonId]);

  if (loading) return <p>Loading matches…</p>;

  return (
    <main>
      <h1>{matchType === 'championship' ? 'Championship Matches' : 'League Matches'}</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {matches.length === 0 && <li>No matches found.</li>}
        {matches.map((m) => {
          const faction1 = m.teams?.faction1?.name || m.teams?.[0]?.nickname || 'TBD';
          const faction2 = m.teams?.faction2?.name || m.teams?.[1]?.nickname || 'TBD';
          const rawTime = m.scheduled_at || m.started_at || 0;
          const time = rawTime ? new Date(rawTime * 1000).toLocaleString() : 'Unknown';

          return (
            <li
              key={m.match_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #444',
              }}
            >
              <Link href={`/matches/match/${m.match_id}`} style={{ fontWeight: 'bold', color: '#eee' }}>
                {faction1} vs {faction2}
              </Link>
              <span>{time}</span>
              <span style={{ textTransform: 'capitalize' }}>{m.status}</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
