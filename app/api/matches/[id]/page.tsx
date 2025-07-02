'use client';
import { useEffect, useState } from 'react';

export default function MatchDetail({ params: { id } }) {
  const [match, setMatch] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/matches?championshipId=3de05c27-da01-4ede-9319-f5b3f16dfb1f`)
      .then(res => res.json())
      .then(data => {
        setMatch(data.items.find((m:any) => m.match_id === id));
      });
  }, [id]);

  if (!match) return <p>Loading...</p>;

  return (
    <main style={{ padding: 20 }}>
      <h1>{match.teams[0].nickname} vs {match.teams[1].nickname}</h1>
      <p>Date: {new Date(match.start_date).toLocaleString()}</p>
      <p>Status: {match.status}</p>

      {match.maps?.map((mp:any, i:number) => (
        <div key={i}>
          <h3>{mp.name}</h3>
          <p>
            {mp.teams[0].rounds ? `${mp.teams[0].rounds} - ${mp.teams[1].rounds}` : 'TBD'}
          </p>
        </div>
      ))}
    </main>
  );
}
