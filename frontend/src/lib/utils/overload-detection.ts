'use server';

import { createClient } from '@/lib/supabase/server';

interface BookingData {
  id: string;
  schedule_start: string;
  status: string;
  booking_services?: Array<{
    duration_minutes: number;
  }>;
}

interface AssignmentData {
  booking: BookingData;
}

export interface OverloadStatus {
  mechanicId: string;
  mechanicName: string;
  currentLoad: number;
  maxCapacity: number;
  isOverloaded: boolean;
  overloadPercentage: number;
  queuedBookings: number;
  inProgressBookings: number;
}

export interface OverloadDetectionResult {
  overloadedMechanics: OverloadStatus[];
  totalMechanics: number;
  overloadedCount: number;
  systemOverloadPercentage: number;
}

/**
 * Deteksi overload mekanik berdasarkan kapasitas dan booking aktif
 * Overload threshold: 80% dari kapasitas harian
 */
export async function detectMechanicOverload(): Promise<OverloadDetectionResult> {
  const supabase = await createClient();

  // Get all active mechanics with their capacity
  const { data: mechanics, error: mechanicsError } = await supabase
    .from('mechanics')
    .select('id, name, daily_capacity_minutes, is_active')
    .eq('is_active', true);

  if (mechanicsError || !mechanics) {
    throw new Error('Failed to fetch mechanics: ' + mechanicsError?.message);
  }

  const overloadStatuses: OverloadStatus[] = [];

  for (const mechanic of mechanics) {
    // Default capacity: 8 hours = 480 minutes per day
    const maxCapacityMinutes = mechanic.daily_capacity_minutes || 480;
    
    // Convert to approximate number of bookings (assuming 60 min average per booking)
    const maxCapacity = Math.floor(maxCapacityMinutes / 60);

    // Count current bookings (queued + in_progress) for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get bookings assigned to this mechanic for today
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        booking:bookings!inner(
          id,
          schedule_start,
          status,
          booking_services(
            duration_minutes
          )
        )
      `)
      .eq('mechanic_id', mechanic.id)
      .gte('booking.schedule_start', startOfDay.toISOString())
      .lt('booking.schedule_start', endOfDay.toISOString())
      .in('booking.status', ['queued', 'in_progress']);

    if (assignmentsError) {
      console.error(`Error fetching assignments for mechanic ${mechanic.id}:`, assignmentsError);
      continue;
    }

    const bookings = (assignments as unknown as AssignmentData[])?.map(a => a.booking) || [];
    const queuedBookings = bookings.filter((b: BookingData) => b.status === 'queued').length;
    const inProgressBookings = bookings.filter((b: BookingData) => b.status === 'in_progress').length;
    
    // Calculate total workload in minutes
    let totalWorkloadMinutes = 0;
    for (const booking of bookings) {
      if (booking.booking_services && Array.isArray(booking.booking_services)) {
        const bookingDuration = booking.booking_services.reduce((sum: number, bs: { duration_minutes: number }) => sum + (bs.duration_minutes || 60), 0);
        totalWorkloadMinutes += bookingDuration;
      } else {
        totalWorkloadMinutes += 60; // Default 1 hour if no services
      }
    }

    const currentLoad = queuedBookings + inProgressBookings;
    const workloadPercentage = (totalWorkloadMinutes / maxCapacityMinutes) * 100;
    const isOverloaded = workloadPercentage >= 80; // 80% threshold

    overloadStatuses.push({
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      currentLoad,
      maxCapacity,
      isOverloaded,
      overloadPercentage: Math.round(workloadPercentage),
      queuedBookings,
      inProgressBookings
    });
  }

  const overloadedCount = overloadStatuses.filter(s => s.isOverloaded).length;
  const systemOverloadPercentage = mechanics.length > 0 
    ? Math.round((overloadedCount / mechanics.length) * 100)
    : 0;

  return {
    overloadedMechanics: overloadStatuses.filter(s => s.isOverloaded),
    totalMechanics: mechanics.length,
    overloadedCount,
    systemOverloadPercentage
  };
}

/**
 * Get overload status for specific mechanic
 */
export async function getMechanicOverloadStatus(mechanicId: string): Promise<OverloadStatus | null> {
  const result = await detectMechanicOverload();
  // Return status for the mechanic regardless of overload state
  const allStatuses = [...result.overloadedMechanics];
  
  // If not in overloaded list, we need to get all mechanics status
  let mechanicStatus = allStatuses.find(m => m.mechanicId === mechanicId);
  
  if (!mechanicStatus) {
    // Re-run detection to get all mechanics, not just overloaded ones
    const supabase = await createClient();
    const { data: mechanic } = await supabase
      .from('mechanics')
      .select('id, name, daily_capacity_minutes, is_active')
      .eq('id', mechanicId)
      .eq('is_active', true)
      .single();
      
    if (!mechanic) return null;
    
    // Calculate status for this specific mechanic
    const maxCapacityMinutes = mechanic.daily_capacity_minutes || 480;
    const maxCapacity = Math.floor(maxCapacityMinutes / 60);
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const { data: assignments } = await supabase
      .from('assignments')
      .select(`
        booking:bookings!inner(
          id,
          schedule_start,
          status,
          booking_services(
            duration_minutes
          )
        )
      `)
      .eq('mechanic_id', mechanic.id)
      .gte('booking.schedule_start', startOfDay.toISOString())
      .lt('booking.schedule_start', endOfDay.toISOString())
      .in('booking.status', ['queued', 'in_progress']);

    const bookings = (assignments as unknown as AssignmentData[])?.map(a => a.booking) || [];
    const queuedBookings = bookings.filter((b: BookingData) => b.status === 'queued').length;
    const inProgressBookings = bookings.filter((b: BookingData) => b.status === 'in_progress').length;
    
    let totalWorkloadMinutes = 0;
    for (const booking of bookings) {
      if (booking.booking_services && Array.isArray(booking.booking_services)) {
        const bookingDuration = booking.booking_services.reduce((sum: number, bs: { duration_minutes: number }) => sum + (bs.duration_minutes || 60), 0);
        totalWorkloadMinutes += bookingDuration;
      } else {
        totalWorkloadMinutes += 60;
      }
    }

    const currentLoad = queuedBookings + inProgressBookings;
    const workloadPercentage = (totalWorkloadMinutes / maxCapacityMinutes) * 100;
    const isOverloaded = workloadPercentage >= 80;

    mechanicStatus = {
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      currentLoad,
      maxCapacity,
      isOverloaded,
      overloadPercentage: Math.round(workloadPercentage),
      queuedBookings,
      inProgressBookings
    };
  }
  
  return mechanicStatus;
}

/**
 * Check if system is in critical overload state (>50% mechanics overloaded)
 */
export async function isSystemCriticallyOverloaded(): Promise<boolean> {
  const result = await detectMechanicOverload();
  return result.systemOverloadPercentage > 50;
}