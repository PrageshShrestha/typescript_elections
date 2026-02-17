import type { Voter } from "./types"

// Function to extract age from age_gender string
function extractAge(ageGender: string): number {
  const match = ageGender.match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

// Function to extract gender from age_gender string
function extractGender(ageGender: string): string {
  // Check for Nepali Devanagari terms first
  if (ageGender.includes('पुरुष') || ageGender.includes('पुरुष')) return 'Male'
  if (ageGender.includes('महिला') || ageGender.includes('महिला')) return 'Female'
  if (ageGender.includes('अन्य') || ageGender.includes('अन्य')) return 'Other'
  
  // Fallback to English terms
  if (ageGender.includes('Male') || ageGender.includes('male')) return 'Male'
  if (ageGender.includes('Female') || ageGender.includes('female')) return 'Female'
  if (ageGender.includes('Other') || ageGender.includes('other')) return 'Other'
  
  return 'Other'
}

// Function to normalize ward format
function normalizeWard(ward: string): string {
  // Extract ward number from various formats
  const match = ward.match(/(\d+)/)
  return match ? `Ward ${match[1]}` : ward
}

// Function to convert gender to Devanagari for display
function genderToDevanagari(gender: string): string {
  switch (gender) {
    case 'Male': return 'पुरुष'
    case 'Female': return 'महिला'
    case 'Other': return 'अन्य'
    default: return gender
  }
}

// Function to convert ward number to Devanagari
function wardToDevanagari(ward: string): string {
  const match = ward.match(/(\d+)/)
  if (!match) return ward
  
  // This function should be replaced with API call for Devanagari conversion
  return ward
}

// Function to convert booth number to Devanagari
function boothToDevanagari(booth: string): string {
  const match = booth.match(/(\d+)/)
  if (!match) return booth
  
  // This function should be replaced with API call for Devanagari conversion
  return booth
}

// Export empty voter data (loaded from API)
export let sampleVoters: Voter[] = []

// Export utility functions for Devanagari display
export { genderToDevanagari, wardToDevanagari, boothToDevanagari, extractGender, extractAge, normalizeWard }
