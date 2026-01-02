"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, Building2, Calendar, Users, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SearchForm() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('flights')

  const [flightSearch, setFlightSearch] = useState({
    from: '',
    to: '',
    date: '',
    passengers: '1',
    class: 'economy',
  })

  const [hotelSearch, setHotelSearch] = useState({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
  })

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (flightSearch.from) params.set('from', flightSearch.from)
    if (flightSearch.to) params.set('to', flightSearch.to)
    if (flightSearch.date) params.set('date', flightSearch.date)
    if (flightSearch.passengers) params.set('passengers', flightSearch.passengers)
    if (flightSearch.class) params.set('class', flightSearch.class)
    router.push(`/flights?${params.toString()}`)
  }

  const handleHotelSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (hotelSearch.city) params.set('city', hotelSearch.city)
    if (hotelSearch.checkIn) params.set('checkIn', hotelSearch.checkIn)
    if (hotelSearch.checkOut) params.set('checkOut', hotelSearch.checkOut)
    if (hotelSearch.guests) params.set('guests', hotelSearch.guests)
    router.push(`/hotels?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-800/50 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="flights"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg transition-all"
          >
            <Plane className="w-4 h-4" />
            Flights
          </TabsTrigger>
          <TabsTrigger
            value="hotels"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg transition-all"
          >
            <Building2 className="w-4 h-4" />
            Hotels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flights" className="mt-0">
          <form onSubmit={handleFlightSearch} className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Departure city"
                    value={flightSearch.from}
                    onChange={(e) => setFlightSearch({ ...flightSearch, from: e.target.value })}
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Arrival city"
                    value={flightSearch.to}
                    onChange={(e) => setFlightSearch({ ...flightSearch, to: e.target.value })}
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="date"
                    value={flightSearch.date}
                    onChange={(e) => setFlightSearch({ ...flightSearch, date: e.target.value })}
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Passengers</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Select value={flightSearch.passengers} onValueChange={(v) => setFlightSearch({ ...flightSearch, passengers: v })}>
                    <SelectTrigger className="pl-10 bg-slate-900/50 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={n.toString()} className="text-white hover:bg-slate-800">{n} {n === 1 ? 'Passenger' : 'Passengers'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Class</Label>
                <Select value={flightSearch.class} onValueChange={(v) => setFlightSearch({ ...flightSearch, class: v })}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="economy" className="text-white hover:bg-slate-800">Economy</SelectItem>
                    <SelectItem value="business" className="text-white hover:bg-slate-800">Business</SelectItem>
                    <SelectItem value="first" className="text-white hover:bg-slate-800">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-500/25 h-12 text-base"
            >
              Search Flights
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="hotels" className="mt-0">
          <form onSubmit={handleHotelSearch} className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Destination</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="City or destination"
                    value={hotelSearch.city}
                    onChange={(e) => setHotelSearch({ ...hotelSearch, city: e.target.value })}
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Check-in</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="date"
                    value={hotelSearch.checkIn}
                    onChange={(e) => setHotelSearch({ ...hotelSearch, checkIn: e.target.value })}
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Check-out</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="date"
                    value={hotelSearch.checkOut}
                    onChange={(e) => setHotelSearch({ ...hotelSearch, checkOut: e.target.value })}
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider">Guests</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Select value={hotelSearch.guests} onValueChange={(v) => setHotelSearch({ ...hotelSearch, guests: v })}>
                    <SelectTrigger className="pl-10 bg-slate-900/50 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={n.toString()} className="text-white hover:bg-slate-800">{n} {n === 1 ? 'Guest' : 'Guests'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-500/25 h-12 text-base"
            >
              Search Hotels
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
