export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Minimal Test - No Imports</h1>
      <p>This should work without any imports.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}
