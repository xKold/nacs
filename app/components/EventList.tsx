// app/components/EventList.tsx
'use client';

import Link from 'next/link';
import { events, type Event } from '../lib/events';

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