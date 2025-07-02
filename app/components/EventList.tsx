'use client';

type Event = {
  id: string;
  name: string;
  url: string;
  region: string;
  startDate: string;
};

const events: Event[] = [
  {
    id: '3de05c27-da01-4ede-9319-f5b3f16dfb1f',
    name: 'Off Season Shenanigans S8',
    url: 'https://www.faceit.com/en/championship/f56331e8-131a-4c50-b7db-eec8b010ff98/Off%20Season%20Shenanigans%20S8',
    region: 'North America',
    startDate: '2025-07-01',
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
          onClick={() => window.open(event.url, '_blank')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') window.open(event.url, '_blank');
          }}
          role="link"
          tabIndex={0}
        >
          <div>
            <strong style={{ fontSize: '1.2rem' }}>{event.name}</strong>
            <div style={{ fontSize: '.9rem', color: '#666' }}>{event.region}</div>
          </div>
          <div style={{ color: '#999', fontSize: '.9rem' }}>{new Date(event.startDate).toLocaleDateString()}</div>
        </li>
      ))}
    </ul>
  );
}
