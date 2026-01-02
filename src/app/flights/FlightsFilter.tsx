"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FlightsFilterProps {
  initialParams: {
    from?: string
    to?: string
    date?: string
    class?: string
  }
}

export function FlightsFilter({ initialParams }: FlightsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    from: initialParams.from || '',
    to: initialParams.to || '',
    date: initialParams.date || '',
    class: initialParams.class || 'all',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.date) params.set('date', filters.date)
    if (filters.class && filters.class !== 'all') params.set('class', filters.class)
    router.push(`/flights?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({ from: '', to: '', date: '', class: 'all' })
    router.push('/flights')
  }

  const hasFilters = filters.from || filters.to || filters.date || (filters.class && filters.class !== 'all')

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
          <Label className="text-slate-400 text-sm">From</Label>
          <Input
            placeholder="Departure city"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-sm">To</Label>
          <Input
            placeholder="Arrival city"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-sm">Date</Label>
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="bg-slate-900/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-sm">Class</Label>
          <Select value={filters.class} onValueChange={(v) => setFilters({ ...filters, class: v })}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-slate-800">All Classes</SelectItem>
              <SelectItem value="economy" className="text-white hover:bg-slate-800">Economy</SelectItem>
              <SelectItem value="business" className="text-white hover:bg-slate-800">Business</SelectItem>
              <SelectItem value="first" className="text-white hover:bg-slate-800">First Class</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Flights
        </Button>
      </div>
    </form>
  )
}
