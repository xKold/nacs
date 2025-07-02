import EventList from './components/EventList';

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: '2rem auto',
        padding: '0 1rem',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          borderBottom: '2px solid #ddd',
          paddingBottom: '.5rem',
        }}
      >
        Upcoming Events
      </h1>
      <EventList />
      <footer
        style={{ marginTop: '3rem', fontSize: '.8rem', color: '#aaa', textAlign: 'center' }}
      >
        Powered by Faceit API — Data refreshes live
      </footer>
    </main>
  );
}
