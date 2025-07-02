'use client';
import { useEffect, useState } from 'react';

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/matches?leagueId=PLACEHOLDER_ID') // replace with real ID
      .then(res => res.json())
      .then(data => {
        setMatches(data.items || []);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load matches.');
      });
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Matches</h1>
      {error && <p>{error}</p>}
      <ul>
        {matches.map((match) => (
          <li key={match.id}>{match.title || match.id}</li>
        ))}
      </ul>
    </main>
  );
}
