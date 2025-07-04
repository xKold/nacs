import EventList from './components/EventList';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#090c1a',
        color: 'white',
        padding: '2rem 1rem',
        fontFamily: 'Arial, sans-serif',
        margin: 0,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: '2rem',
          color: 'black',
          maxWidth: 900,
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <h1>Events Overview</h1>
        <EventList />
        <footer
        style={{ marginTop: '3rem', fontSize: '.8rem', color: '#aaa', textAlign: 'center' }}
      >
        Powered by North American Counter Strike
      </footer>
      </div>
    </main>
  );
}
