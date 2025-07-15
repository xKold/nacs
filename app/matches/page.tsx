// app/matches/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getEventById, getEventByLeagueAndSeason, events } from '../lib/events';

interface Match {
  match_id: string;
  status: string;
  teams: {
    faction1?: { name: string };
    faction2?: { name: string };
    nickname?: string;
  } | Array<{ nickname?: string; name?: string }>;
  scheduled_at?: number;
  started_at?: number;
  start_date?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get('event');

  useEffect(() => {
    // Set initial event from URL or default to first event
    if (eventIdFromUrl) {
      setSelectedEvent(eventIdFromUrl);
    } else {
      setSelectedEvent(events[0].id);
    }
  }, [eventIdFromUrl]);

  useEffect(() => {
    if (!selectedEvent) return;

    // Find the event by ID first
    let event = getEventById(selectedEvent);
    
    // If not found by ID, try to find by league/season (for backwards compatibility)
    if (!event) {
      const leagueId = searchParams.get('leagueId');
      const seasonId = searchParams.get('seasonId');
      if (leagueId && seasonId) {
        event = getEventByLeagueAndSeason(leagueId, seasonId);
      }
    }

    if (!event) {
      setMatches([]);
      setLoading(false);
      return;
    }

    let url = '/api/matches?';

    if (event.type === 'championship') {
      url += `championshipId=${event.id}`;
    } else if (event.leagueId && event.seasonId) {
      url += `leagueId=${event.leagueId}&seasonId=${event.seasonId}`;
    } else {
      setMatches([]);
      setLoading(false);
      return;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.items || []);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [selectedEvent, searchParams]);

  const currentEvent = getEventById(selectedEvent);

  if (loading) return <p>Loading matches…</p>;

  return (
    <main style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="event-select" style={{ marginRight: '10px' }}>
          Select Event:
        </label>
        <select
          id="event-select"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          style={{
            padding: '5px 10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      <h1>
        {currentEvent?.name || 'Event'} Matches
        {currentEvent && (
          <span style={{ fontSize: '0.7em', color: '#666', marginLeft: '10px' }}>
            ({currentEvent.type === 'championship' ? 'Championship' : 'League'})
          </span>
        )}
      </h1>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {matches.length === 0 && <li>No matches found.</li>}
        {matches.map((m) => {
          // Handle both object and array formats for teams
          let faction1 = 'TBD';
          let faction2 = 'TBD';
          
          if (Array.isArray(m.teams)) {
            faction1 = m.teams[0]?.nickname || m.teams[0]?.name || 'TBD';
            faction2 = m.teams[1]?.nickname || m.teams[1]?.name || 'TBD';
          } else if (m.teams) {
            faction1 = m.teams.faction1?.name || 'TBD';
            faction2 = m.teams.faction2?.name || 'TBD';
          }
          
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