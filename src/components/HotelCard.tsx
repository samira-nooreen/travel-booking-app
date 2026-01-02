"use client"

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Wifi, Dumbbell, UtensilsCrossed, Car, Waves } from 'lucide-react'
import type { Hotel } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HotelCardProps {
  hotel: Hotel
}

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3 h-3" />,
  Gym: <Dumbbell className="w-3 h-3" />,
  Restaurant: <UtensilsCrossed className="w-3 h-3" />,
  'Valet Parking': <Car className="w-3 h-3" />,
  Pool: <Waves className="w-3 h-3" />,
  Spa: <Waves className="w-3 h-3" />,
}

function getAvailabilityStatus(roomsAvailable: number, totalRooms: number) {
  const occupancyRate = ((totalRooms - roomsAvailable) / totalRooms) * 100
  
  if (roomsAvailable === 0) {
    return { label: 'FULL', color: 'bg-red-500/20 border-red-500/30 text-red-400', dotColor: 'bg-red-400' }
  } else if (occupancyRate >= 80) {
    return { label: 'ALMOST FULL', color: 'bg-orange-500/20 border-orange-500/30 text-orange-400', dotColor: 'bg-orange-400' }
  } else if (occupancyRate >= 50) {
    return { label: 'FILLING UP', color: 'bg-amber-500/20 border-amber-500/30 text-amber-400', dotColor: 'bg-amber-400' }
  } else {
    return { label: 'AVAILABLE', color: 'bg-green-500/20 border-green-500/30 text-green-400', dotColor: 'bg-green-400' }
  }
}

export function HotelCard({ hotel }: HotelCardProps) {
  const totalRooms = hotel.total_rooms || 50
  const availability = getAvailabilityStatus(hotel.rooms_available, totalRooms)
  const occupancyPercent = Math.round(((totalRooms - hotel.rooms_available) / totalRooms) * 100)

  return (
    <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      <div className="relative h-56 overflow-hidden">
        <Image
          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
          alt={hotel.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${availability.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${availability.dotColor} animate-pulse`} />
            <span className="text-xs font-medium">{availability.label}</span>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <Badge className="bg-amber-500/90 text-slate-950 font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            {hotel.rating}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{hotel.name}</h3>
          <div className="flex items-center gap-1 text-slate-300 text-sm">
            <MapPin className="w-3 h-3 text-amber-400" />
            {hotel.city}, {hotel.country}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">{hotel.rooms_available} of {totalRooms} rooms available</span>
            <span className="text-slate-500">{occupancyPercent}% occupied</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent >= 80 ? 'bg-red-500' : 
                occupancyPercent >= 50 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{hotel.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities?.slice(0, 5).map((amenity) => (
            <Badge
              key={amenity}
              variant="secondary"
              className="bg-slate-700/50 text-slate-300 flex items-center gap-1 text-xs"
            >
              {amenityIcons[amenity] || null}
              {amenity}
            </Badge>
          ))}
          {hotel.amenities && hotel.amenities.length > 5 && (
            <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 text-xs">
              +{hotel.amenities.length - 5} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div>
            <p className="text-2xl font-bold text-white">{formatCurrency(hotel.price_per_night)}</p>
            <p className="text-slate-400 text-sm">per night</p>
          </div>
          <Link href={`/hotels/${hotel.id}`}>
            <Button 
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600"
              disabled={hotel.rooms_available === 0}
            >
              {hotel.rooms_available === 0 ? 'Fully Booked' : 'View Details'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
