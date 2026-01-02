import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, Flight, Hotel } from './supabase'

interface BookingDetails {
  type: 'flight' | 'hotel'
  item: Flight | Hotel
  checkIn?: string
  checkOut?: string
  guests: number
  passengers?: Array<{
    firstName: string
    lastName: string
    email: string
    phone: string
  }>
}

interface AuthState {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

interface BookingState {
  currentBooking: BookingDetails | null
  setCurrentBooking: (booking: BookingDetails | null) => void
  clearBooking: () => void
}

interface SearchState {
  flightSearch: {
    from: string
    to: string
    date: string
    passengers: number
    class: string
  }
  hotelSearch: {
    city: string
    checkIn: string
    checkOut: string
    guests: number
  }
  setFlightSearch: (search: SearchState['flightSearch']) => void
  setHotelSearch: (search: SearchState['hotelSearch']) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      currentBooking: null,
      setCurrentBooking: (currentBooking) => set({ currentBooking }),
      clearBooking: () => set({ currentBooking: null }),
    }),
    {
      name: 'booking-storage',
    }
  )
)

export const useSearchStore = create<SearchState>()((set) => ({
  flightSearch: {
    from: '',
    to: '',
    date: '',
    passengers: 1,
    class: 'economy',
  },
  hotelSearch: {
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  },
  setFlightSearch: (flightSearch) => set({ flightSearch }),
  setHotelSearch: (hotelSearch) => set({ hotelSearch }),
}))
