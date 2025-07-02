'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Match {
  match_id: string;
  status: string;
  teams: { nickname: string; }[];
  start_date: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const champId = '3de05c27-da01-4ede-9319-f5b3f16dfb1f'; // first event
    fetch(`/api/matches?championshipId=${champId}`)
      .then(res => res.json())
      .then(data => {
        setMatches(data.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading matches…</p>;

  return (
    <main>
      <h1>Upcoming & Recent Matches</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {matches.map(m => (
          <li key={m.match_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #444' }}>
            <Link href={`/matches/${m.match_id}`} style={{ fontWeight: 'bold', color: '#eee' }}>
              {m.teams[0].nickname} vs {m.teams[1]?.nickname}
            </Link>
            <span>{new Date(m.start_date).toLocaleString()}</span>
            <span style={{ textTransform: 'capitalize' }}>{m.status}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
