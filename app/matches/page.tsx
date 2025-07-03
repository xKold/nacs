'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Match {
  match_id: string;
  status: string;
  teams: { nickname: string }[];
  start_date: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const TOURNAMENT_ID = 'f56331e8-131a-4c50-b7db-eec8b010ff98';

  useEffect(() => {
    fetch(`/api/matches?championshipId=${TOURNAMENT_ID}`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.items || []);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading matches…</p>;

  return (
    <main>
      <h1>Off Season Shenanigans S8 Matches</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {matches.length === 0 && <li>No matches found.</li>}
        {matches.map((m) => (
          <li
            key={m.match_id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #444',
            }}
          >
            <Link href={`/matches/event/${TOURNAMENT_ID}/match/${m.match_id}`} style={{ fontWeight: 'bold', color: '#eee' }}>
              {m.teams[0]?.nickname} vs {m.teams[1]?.nickname}
            </Link>
            <span>{new Date(m.start_date).toLocaleString()}</span>
            <span style={{ textTransform: 'capitalize' }}>{m.status}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
