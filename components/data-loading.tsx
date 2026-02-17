"use client"

import { Loader2 } from "lucide-react"

export function DataLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">Loading voter data...</p>
        <p className="text-sm text-muted-foreground">Please wait while we load the real voter records</p>
      </div>
    </div>
  )
}
