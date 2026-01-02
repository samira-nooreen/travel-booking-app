"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface HotelsFilterProps {
  initialParams: {
    city?: string
    checkIn?: string
    checkOut?: string
    guests?: string
    minPrice?: string
    maxPrice?: string
  }
}

export function HotelsFilter({ initialParams }: HotelsFilterProps) {
  const router = useRouter()
  
  const [filters, setFilters] = useState({
    city: initialParams.city || '',
    checkIn: initialParams.checkIn || '',
    checkOut: initialParams.checkOut || '',
    priceRange: [
      initialParams.minPrice ? parseInt(initialParams.minPrice) : 0,
      initialParams.maxPrice ? parseInt(initialParams.maxPrice) : 3000
    ] as [number, number],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.checkIn) params.set('checkIn', filters.checkIn)
    if (filters.checkOut) params.set('checkOut', filters.checkOut)
    if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString())
    if (filters.priceRange[1] < 3000) params.set('maxPrice', filters.priceRange[1].toString())
    router.push(`/hotels?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({ city: '', checkIn: '', checkOut: '', priceRange: [0, 3000] })
    router.push('/hotels')
  }

  const hasFilters = filters.city || filters.checkIn || filters.checkOut || filters.priceRange[0] > 0 || filters.priceRange[1] < 3000

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-slate-400 text-sm">Destination</Label>
          <Input
            placeholder="City or hotel name"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-sm">Check-in</Label>
          <Input
            type="date"
            value={filters.checkIn}
            onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
            className="bg-slate-900/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-sm">Check-out</Label>
          <Input
            type="date"
            value={filters.checkOut}
            onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
            className="bg-slate-900/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-slate-400 text-sm">Price Range</Label>
            <span className="text-white text-sm font-medium">
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </span>
          </div>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
            min={0}
            max={3000}
            step={50}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Hotels
        </Button>
      </div>
    </form>
  )
}
