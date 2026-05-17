import { createClient } from '@/lib/supabase/server'
import type { GuideBooking } from '@/lib/database.types'

export async function createBooking(data: {
  tourist_id: string
  guide_id: string
  service_id?: string
  date: string
  time?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: booking, error } = await supabase
    .from('guide_bookings')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return booking as GuideBooking
}

export async function getBookings(userId: string): Promise<GuideBooking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guide_bookings')
    .select('*')
    .or(`tourist_id.eq.${userId},guide_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as GuideBooking[]) ?? []
}

export async function updateBookingStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('guide_bookings')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}
