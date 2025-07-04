'use client';

import Link from 'next/link';

type Event = {
  id: string;
  name: string;
  region: string;
  startDate: string;
};

const events: Event[] = [
  {
    id: 'f56331e8-131a-4c50-b7db-eec8b010ff98',
    name: 'Off Season Shenanigans S8',
    region: 'North America',
    startDate: '2025-06-01',
  },
  {
    id: '81e36970-81ec-4e53-b2af-c0a1c0b52938',
    name: 'Off Season Shenanigans S8 Playoffs',
    region: 'North America',
    startDate: '2025-07-1', // put actual date if you want
  },
];

export default function EventList() {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {events.map((event) => (
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
            href={`/matches/event/${event.id}`}
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
      ))}
    </ul>
  );
}
