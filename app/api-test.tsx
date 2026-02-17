"use client"

import { useEffect, useState } from "react"

export default function ApiTestPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:8000/api/voters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            limit: 5
          })
        })
        
        const result = await response.json()
        console.log('API Response:', result)
        setData(result)
        setLoading(false)
      } catch (err: any) {
        console.error('API Error:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test Page</h1>
      <p>Total Count: {data?.totalCount || 'N/A'}</p>
      <p>Voters Count: {data?.voters?.length || 0}</p>
      <p>Sample Voter: {data?.voters?.[0]?.name || 'N/A'}</p>
      <p>Sample Gender: {data?.voters?.[0]?.gender || 'N/A'}</p>
      <p>Sample Age: {data?.voters?.[0]?.age || 'N/A'}</p>
    </div>
  )
}
