"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface MinimalVoterContextType {
  isLoading: boolean
  municipalities: string[]
}

const MinimalVoterContext = createContext<MinimalVoterContextType | undefined>(undefined)

export function MinimalVoterProvider({ children }: { children: ReactNode }) {
  const [isLoading] = useState(false)
  const [municipalities] = useState(['Test Municipality'])

  return (
    <MinimalVoterContext.Provider value={{ isLoading, municipalities }}>
      {children}
    </MinimalVoterContext.Provider>
  )
}

export function useMinimalVoters() {
  const context = useContext(MinimalVoterContext)
  if (!context) throw new Error("useMinimalVoters must be used within MinimalVoterProvider")
  return context
}
