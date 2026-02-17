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
  selectedVoter: Voter | null
  setSelectedVoter: (voter: Voter | null) => void
  municipalities: string[]
  wards: string[]
  booths: string[]
  hierarchicalData: HierarchicalData
  availableWards: string[]
  availableBooths: string[]
  isUsingCsvData: boolean
  isLoading: boolean
  isLoadingOptions: boolean
  getGenderStats: () => Promise<{ label: string; count: number; percentage: number }[]>
  getAgeGroupStats: () => Promise<{ label: string; count: number; percentage: number }[]>
  getTotalVoters: () => string
  refreshData: () => Promise<void>
  totalCount: number
}

const defaultFilters: FilterState = {
  search: "",
  gender: "all",
  municipality: "all",
  ward: "all",
  booth: "all",
 
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
  
  // Hierarchical data state
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({
    municipalities: [],
    real_dataset: {}
  })
  const [availableWards, setAvailableWards] = useState<string[]>([])
  const [availableBooths, setAvailableBooths] = useState<string[]>([])

  // Initial data load on mount - API only version
  useEffect(() => {
    console.log('🚀 VoterProvider mounting...')
    const loadData = async () => {
      if (typeof window === 'undefined') return
      
      console.log('📋 Starting data load...')
      setIsLoadingOptions(true)
      try {
        // Load all data from API
        console.log('🌐 Loading API data...')
        const [options, hierarchical] = await Promise.all([
          getOptions(),
          getHierarchicalData()
        ])
        
        console.log('📊 Setting data from API...')
        setMunicipalities(options.municipalities)
        setWards(options.wards)
        setBooths(options.booths)
        setHierarchicalData(hierarchical)
        
        // Load initial voter data
        console.log('👥 Loading initial voter data...')
        const queryParams: QueryParams = {
          // No limit - load all voters from database
        }
        
        const result = await queryVoters(queryParams)
        console.log('📊 Initial load result - voters count:', result.voters.length, 'totalCount:', result.totalCount)
        setVoters(result.voters)
        setTotalCount(result.totalCount)
        
        setIsUsingCsvData(false)
      } catch (error) {
        console.error('❌ Error loading data from API:', error)
        // Set empty state on API failure
        setMunicipalities([])
        setWards([])
        setBooths([])
        setVoters([])
        setTotalCount(0)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    loadData()
  }, [])

  // Simple data refresh
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
      
        // No limit - load all matching voters from database
      }
      
      const result = await queryVoters(queryParams)
      console.log('📊 API result - voters count:', result.voters.length, 'totalCount:', result.totalCount)
      setVoters(result.voters)
      setTotalCount(result.totalCount)
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
      setVoters([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [filters.search, filters.gender, filters.municipality, filters.ward, filters.booth])

  // Load data when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshData()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [refreshData])

  // Update available options based on filters - simplified without infinite loops
  useEffect(() => {
    if (filters.municipality === 'all') {
      setAvailableWards(wards)
      setAvailableBooths(booths)
    } else {
      // Use hierarchical data if available, otherwise use all wards
      const municipalityData = hierarchicalData.real_dataset[filters.municipality]
      if (municipalityData) {
        const municipalityWards = Object.keys(municipalityData).map(ward => `Ward ${ward}`)
        setAvailableWards(municipalityWards)
      } else {
        setAvailableWards(wards)
      }
    }
  }, [filters.municipality, hierarchicalData.real_dataset, wards])

  useEffect(() => {
    if (filters.municipality === 'all' || filters.ward === 'all') {
      setAvailableBooths(booths)
    } else {
      // Use hierarchical data if available
      const municipalityData = hierarchicalData.real_dataset[filters.municipality]
      if (municipalityData) {
        const wardMatch = filters.ward.match(/Ward\s*(.+)/)
        const wardNumber = wardMatch ? wardMatch[1] : filters.ward.replace('Ward ', '')
        const wardBooths = municipalityData[wardNumber] || []
        setAvailableBooths(wardBooths)
      } else {
        setAvailableBooths(booths)
      }
    }
  }, [filters.municipality, filters.ward, hierarchicalData.real_dataset, booths])

  const filteredVoters = useMemo(() => {
    // No client-side filtering needed - API already handles filtering
    return voters
  }, [voters])

  const filteredWards = useMemo(() => availableWards, [availableWards])
  const filteredBooths = useMemo(() => availableBooths, [availableBooths])

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

  // Statistics functions
  const getGenderStats = useCallback(async () => {
    try {
      const queryParams: QueryParams = {
        search: filters.search || undefined,
        municipality: filters.municipality !== 'all' ? filters.municipality : undefined,
        ward: filters.ward !== 'all' ? filters.ward : undefined,
        booth: filters.booth !== 'all' ? filters.booth : undefined,
     
      }
      return await getGenderStatsFromAPI(queryParams)
    } catch (error) {
      console.error('Error fetching gender stats:', error)
      return []
    }
  }, [filters])

  const getAgeGroupStats = useCallback(async () => {
    try {
      const queryParams: QueryParams = {
        search: filters.search || undefined,
        municipality: filters.municipality !== 'all' ? filters.municipality : undefined,
        ward: filters.ward !== 'all' ? filters.ward : undefined,
        booth: filters.booth !== 'all' ? filters.booth : undefined,
    
      }
      return await getAgeStatsFromAPI(queryParams)
    } catch (error) {
      console.error('Error fetching age stats:', error)
      return []
    }
  }, [filters])

  const getTotalVoters = useCallback(() => {
    // Return regular number for now - Devanagari conversion should be done via API
    return totalCount.toString()
  }, [totalCount])

  return (
    <VoterContext.Provider
      value={{
        voters,
        filteredVoters,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
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
