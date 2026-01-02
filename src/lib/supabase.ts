import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export type FlightStatus = 'on_time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived'

export type Flight = {
  id: string
  airline: string
  flight_number: string
  departure_city: string
  arrival_city: string
  departure_airport: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  price: number
  seats_available: number
  class: 'economy' | 'business' | 'first'
  image_url: string | null
  created_at: string
  status: FlightStatus
  delay_minutes: number
  delay_reason: string | null
  gate: string | null
  terminal: string | null
  updated_at: string
}

export type Hotel = {
  id: string
  name: string
  city: string
  country: string
  address: string
  description: string | null
  price_per_night: number
  rating: number
  amenities: string[]
  rooms_available: number
  total_rooms: number
  image_url: string | null
  images: string[]
  created_at: string
}

export type Booking = {
  id: string
  user_id: string
  booking_type: 'flight' | 'hotel'
  flight_id: string | null
  hotel_id: string | null
  check_in_date: string | null
  check_out_date: string | null
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  passenger_details: Record<string, unknown> | null
  created_at: string
  updated_at: string
  flight?: Flight
  hotel?: Hotel
}

export type Payment = {
  id: string
  booking_id: string
  amount: number
  currency: string
  payment_method: string | null
  stripe_payment_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
}

export type NotificationType = 'flight_delay' | 'gate_change' | 'price_drop' | 'booking_confirmed' | 'booking_cancelled' | 'refund_processed' | 'general'

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export type PriceAlert = {
  id: string
  user_id: string
  flight_id: string | null
  hotel_id: string | null
  target_price: number
  current_price: number
  is_active: boolean
  triggered_at: string | null
  created_at: string
  flight?: Flight
  hotel?: Hotel
}

export type PriceHistory = {
  id: string
  flight_id: string | null
  hotel_id: string | null
  price: number
  recorded_at: string
}

export type SearchHistory = {
  id: string
  user_id: string | null
  search_type: 'flight' | 'hotel'
  departure_city: string | null
  arrival_city: string | null
  city: string | null
  search_date: string
}

export type TaxiProvider = {
  id: string
  name: string
  logo_url: string | null
  base_fare: number
  per_km_rate: number
  surge_multiplier: number
  eta_minutes: number
  available_cars: number
  rating: number
  car_types: string[]
  is_active: boolean
  created_at: string
}

export type TaxiBookingStatus = 'searching' | 'driver_assigned' | 'driver_arriving' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'

export type TaxiBooking = {
  id: string
  user_id: string | null
  provider_id: string
  pickup_location: string
  dropoff_location: string
  distance_km: number
  fare_amount: number
  status: TaxiBookingStatus
  driver_name: string | null
  driver_phone: string | null
  car_number: string | null
  car_model: string | null
  driver_rating: number | null
  eta_minutes: number | null
  otp: string | null
  created_at: string
  updated_at: string
}
