// app/page.tsx
import Link from 'next/link';

const events = [
  {
    id: '3de05c27-da01-4ede-9319-f5b3f16dfb1f',
    name: 'Off Season Shenanigans S8',
    url: 'https://www.faceit.com/en/championship/f56331e8-131a-4c50-b7db-eec8b010ff98/Off%20Season%20Shenanigans%20S8',
    region: 'North America',
    startDate: '2025-07-01', // example, update if you want
  },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', borderBottom: '2px solid #ddd', paddingBottom: '.5rem' }}>
        Upcoming Events
      </h1>

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

      <footer style={{ marginTop: '3rem', fontSize: '.8rem', color: '#aaa', textAlign: 'center' }}>
        Powered by Faceit API — Data refreshes live
      </footer>
    </main>
  );
}
