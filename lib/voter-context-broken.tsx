"use client"

import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from "react"
import type { Voter, FilterState } from "./types"
import { getOptions, queryVoters, getGenderStats as getGenderStatsFromAPI, getAgeStats as getAgeStatsFromAPI, getHierarchicalData, type QueryParams, type HierarchicalData } from "./api"

// Helper function to normalize ward format
function normalizeWard(ward: string): string {
  const match = ward.match(/(\d+)/)
  return match ? `Ward ${match[1]}` : ward
}

interface VoterContextType {
  voters: Voter[]
  filteredVoters: Voter[]
  filters: FilterState
  setFilters: (filters: FilterState) => void
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  loadCsvData: (csvText: string) => void // Keep for compatibility
  selectedVoter: Voter | null
  setSelectedVoter: (voter: Voter | null) => void
  municipalities: string[]
  wards: string[]
  booths: string[]
  // New hierarchical data
  hierarchicalData: HierarchicalData
  availableWards: string[]
  availableBooths: string[]
  isUsingCsvData: boolean
  isLoading: boolean
  isLoadingOptions: boolean
  // Statistics functions with Devanagari support - now async
  getGenderStats: () => Promise<{ label: string; count: number; percentage: number }[]>
  getAgeGroupStats: () => Promise<{ label: string; count: number; percentage: number }[]>
  getTotalVoters: () => string
  // Lazy loading functions
  refreshData: () => Promise<void>
  totalCount: number
}

const defaultFilters: FilterState = {
  search: "",
  gender: "all",
  municipality: "all",
  ward: "all",
  booth: "all",
  ageRange: [18, 80],
}

const VoterContext = createContext<VoterContextType | undefined>(undefined)

export function VoterProvider({ children }: { children: ReactNode }) {
  const [voters, setVoters] = useState<Voter[]>([])
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null)
  const [isUsingCsvData, setIsUsingCsvData] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  
  // State for dropdown options
  const [municipalities, setMunicipalities] = useState<string[]>([])
  const [wards, setWards] = useState<string[]>([])
  const [booths, setBooths] = useState<string[]>([])
  
  // New hierarchical data state
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({
    municipalities: [],
    real_dataset: {}
  })
  const [availableWards, setAvailableWards] = useState<string[]>([])
  const [availableBooths, setAvailableBooths] = useState<string[]>([])

  // Update available wards and booths based on municipality and ward selection
  useEffect(() => {
    if (filters.municipality === 'all') {
      // Show all wards
      setAvailableWards(wards)
      setAvailableBooths(booths)
    } else {
      // Show wards for selected municipality
      const municipalityData = hierarchicalData.real_dataset[filters.municipality]
      if (municipalityData) {
        const municipalityWards = Object.keys(municipalityData).map(ward => `Ward ${ward}`)
        setAvailableWards(municipalityWards)
      } else {
        setAvailableWards([])
        setAvailableBooths([])
      }
    }
  }, [filters.municipality, hierarchicalData, wards, booths])
  
  useEffect(() => {
    if (filters.municipality === 'all' || filters.ward === 'all') {
      // Show all booths or no booths based on municipality selection
      setAvailableBooths(booths)
    } else {
      // Show booths for selected municipality and ward
      const municipalityData = hierarchicalData.real_dataset[filters.municipality]
      if (municipalityData) {
        // Extract ward number from "Ward X" format
        const wardMatch = filters.ward.match(/Ward\s*(.+)/)
        const wardNumber = wardMatch ? wardMatch[1] : filters.ward.replace('Ward ', '')
        
        const wardBooths = municipalityData[wardNumber] || []
        setAvailableBooths(wardBooths)
      } else {
        setAvailableBooths([])
      }
    }
  }, [filters.municipality, filters.ward, hierarchicalData, booths])
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') return
      
      setIsLoadingOptions(true)
      try {
        // Load both regular options and hierarchical data in parallel
        const [options, hierarchical] = await Promise.all([
          getOptions(),
          getHierarchicalData()
        ])
        
        setMunicipalities(options.municipalities)
        setWards(options.wards)
        setBooths(options.booths)
        setHierarchicalData(hierarchical)
        setIsUsingCsvData(false) // Using API data now
      } catch (error) {
        console.error('Error loading options:', error)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    loadData()
  }, [])

  // Function to refresh data based on current filters
  const refreshData = useCallback(async () => {
    if (typeof window === 'undefined') return
    
    setIsLoading(true)
    try {
      const queryParams: QueryParams = {
        search: filters.search || undefined,
        gender: filters.gender !== 'all' ? filters.gender : undefined,
        municipality: filters.municipality !== 'all' ? filters.municipality : undefined,
        ward: filters.ward !== 'all' ? filters.ward : undefined,
        booth: filters.booth !== 'all' ? filters.booth : undefined,
        min_age: filters.ageRange[0],
        max_age: filters.ageRange[1],
        limit: 100 // Limit to 100 results for performance
      }
      
      const result = await queryVoters(queryParams)
      setVoters(result.voters)
      setTotalCount(result.totalCount)
    } catch (error) {
      console.error('Error refreshing data:', error)
      setVoters([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Load data when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshData()
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [refreshData])

  // Update filtered wards and booths based on municipality selection
  // Update filtered wards and booths based on municipality selection
  const filteredWards = useMemo(() => {
    return availableWards
  }, [availableWards])

  const filteredBooths = useMemo(() => {
    return availableBooths
  }, [availableBooths])

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "municipality") {
        next.ward = "all"
        next.booth = "all"
      }
      if (key === "ward") {
        next.booth = "all"
      }
      return next
    })
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const loadCsvData = useCallback((csvText: string) => {
    // CSV upload functionality disabled for now
    console.warn('CSV upload functionality is disabled when using API backend')
  }, [])

  // Statistics functions with Devanagari support
  const getGenderStats = useCallback(async () => {
    const total = totalCount
    if (total === 0) return []

    try {
      const queryParams: QueryParams = {
        search: filters.search || undefined,
        municipality: filters.municipality !== 'all' ? filters.municipality : undefined,
        ward: filters.ward !== 'all' ? filters.ward : undefined,
        booth: filters.booth !== 'all' ? filters.booth : undefined,
        min_age: filters.ageRange[0],
        max_age: filters.ageRange[1]
      }
      
      return await getGenderStatsFromAPI(queryParams)
    } catch (error) {
      console.error('Error fetching gender stats:', error)
      return []
    }
  }, [filters, totalCount])

  const getAgeGroupStats = useCallback(async () => {
    const total = totalCount
    if (total === 0) return []

    try {
      const queryParams: QueryParams = {
        search: filters.search || undefined,
        municipality: filters.municipality !== 'all' ? filters.municipality : undefined,
        ward: filters.ward !== 'all' ? filters.ward : undefined,
        booth: filters.booth !== 'all' ? filters.booth : undefined,
        min_age: filters.ageRange[0],
        max_age: filters.ageRange[1]
      }
      
      return await getAgeStatsFromAPI(queryParams)
    } catch (error) {
      console.error('Error fetching age stats:', error)
      return []
    }
  }, [filters, totalCount])

  const getTotalVoters = useCallback(() => {
    // Convert number to Devanagari
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
    return totalCount.toString().split('').map(digit => devanagariDigits[parseInt(digit)]).join('')
  }, [totalCount])

  return (
    <VoterContext.Provider
      value={{
        voters,
        filteredVoters: voters, // voters are already filtered by queryVoters
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        loadCsvData,
        selectedVoter,
        setSelectedVoter,
        municipalities,
        wards: filteredWards,
        booths: filteredBooths,
        hierarchicalData,
        availableWards,
        availableBooths,
        isUsingCsvData,
        isLoading,
        isLoadingOptions,
        getGenderStats,
        getAgeGroupStats,
        getTotalVoters,
        refreshData,
        totalCount,
      }}
    >
      {children}
    </VoterContext.Provider>
  )
}

export function useVoters() {
  const context = useContext(VoterContext)
  if (!context) throw new Error("useVoters must be used within VoterProvider")
  return context
}
