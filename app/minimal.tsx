export default function MinimalPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Minimal Test</h1>
      <p>This should work</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}
