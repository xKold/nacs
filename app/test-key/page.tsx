export default function TestKeyPage() {
  return <pre>{process.env.FACEIT_API_KEY ? 'Key loaded' : 'No key found'}</pre>;
}
