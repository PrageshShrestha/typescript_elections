const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'http://localhost:8000'

export interface Voter {
  voter_id: string
  name: string
  age_gender: string
  age: number
  gender: string
  parent_name: string
  spouse: string
  picture: string
  municipality: string
  ward: string
  booth: string
  pratinidhi: string
  pradesh: string
  sn: string
}

export interface QueryParams {
  search?: string
  gender?: string
  municipality?: string
  ward?: string
  booth?: string
  limit?: number
}

export interface VoterQueryResult {
  voters: Voter[]
  totalCount: number
  error?: string
}

export interface Options {
  municipalities: string[]
  wards: string[]
  booths: string[]
  genderOptions: string[]
}

export interface HierarchicalData {
  municipalities: string[]
  real_dataset: Record<string, Record<string, string[]>>
}

// API functions
export async function getOptions(): Promise<Options> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/options`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching options:', error)
    // Return empty options if database fails
    return {
      municipalities: [],
      wards: [],
      booths: [],
      genderOptions: []
    }
  }
}

export async function getHierarchicalData(): Promise<HierarchicalData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hierarchical-data`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching hierarchical data:', error)
    return {
      municipalities: [],
      real_dataset: {}
    }
  }
}

export async function queryVoters(params: QueryParams): Promise<VoterQueryResult> {
  try {
    console.log('🌐 Making API request to voters endpoint with params:', params)
    const response = await fetch(`${API_BASE_URL}/api/voters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search: params.search || undefined,
        gender: params.gender || undefined,
        municipality: params.municipality || undefined,
        ward: params.ward || undefined,
        booth: params.booth || undefined,
       
        ...(params.limit && { limit: params.limit })  // Only include limit if specified
      }),
    })
    
    console.log('📡 Response status:', response.status)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('📊 API response:', result)
    return result
  } catch (error) {
    console.error('❌ Error querying voters:', error)
    return {
      voters: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getGenderStats(params: Omit<QueryParams, 'limit'>): Promise<{ label: string; count: number; percentage: number }[]> {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.search) queryParams.append('search', params.search)
    if (params.gender) queryParams.append('gender', params.gender)
    if (params.municipality) queryParams.append('municipality', params.municipality)
    if (params.ward) queryParams.append('ward', params.ward)
    if (params.booth) queryParams.append('booth', params.booth)
   
    
    const response = await fetch(`${API_BASE_URL}/api/stats/gender?${queryParams}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching gender stats:', error)
    return []
  }
}

export async function getAgeStats(params: Omit<QueryParams, 'limit'>): Promise<{ label: string; count: number; percentage: number }[]> {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.search) queryParams.append('search', params.search)
    if (params.gender) queryParams.append('gender', params.gender)
    if (params.municipality) queryParams.append('municipality', params.municipality)
    if (params.ward) queryParams.append('ward', params.ward)
    if (params.booth) queryParams.append('booth', params.booth)
   
    
    const response = await fetch(`${API_BASE_URL}/api/stats/age?${queryParams}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching age stats:', error)
    return []
  }
}
