'use client';

import Link from 'next/link';

type Event = {
  id: string;
  name: string;
  region: string;
  startDate: string;
  type: 'championship' | 'league';
  leagueId?: string;
  seasonId?: string;
};

const events: Event[] = [
  {
    id: 'f56331e8-131a-4c50-b7db-eec8b010ff98',
    name: 'Off Season Shenanigans S8',
    region: 'North America',
    startDate: '2025-06-01',
    type: 'championship',
  },
  {
    id: '81e36970-81ec-4e53-b2af-c0a1c0b52938',
    name: 'Off Season Shenanigans S8 Playoffs',
    region: 'North America',
    startDate: '2025-07-01',
    type: 'championship',
  },
  {
    id: 'S54',
    name: 'ESEA Season 54',
    region: 'North America',
    startDate: '2025-07-10',
    type: 'league',
    leagueId: 'a14b8616-45b9-4581-8637-4dfd0b5f6af8',
    seasonId: '3de05c27-da01-4ede-9319-f5b3f16dfb1f',
  }
];

export default function EventList() {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {events.map((event) => {
        const href =
          event.type === 'championship'
            ? `/matches/event/${event.id}`
            : `/matches/events/${event.leagueId}?season=${event.seasonId}`;

        return (
          <li
            key={event.id}
            style={{
              padding: '1rem',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <Link
              href={href}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div>
                <strong style={{ fontSize: '1.2rem' }}>{event.name}</strong>
                <div style={{ fontSize: '.9rem', color: '#666' }}>{event.region}</div>
              </div>
              <div style={{ color: '#999', fontSize: '.9rem' }}>
                {new Date(event.startDate).toLocaleDateString()}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
