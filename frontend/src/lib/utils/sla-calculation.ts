'use server';

import { createClient } from '@/lib/supabase/server';

export interface SLAStatus {
  bookingId: string;
  customerName: string;
  serviceName: string;
  scheduledStart: string;
  estimatedEnd: string;
  actualEnd: string | null;
  delayMinutes: number;
  isLate: boolean;
  isAtRisk: boolean;
  status: string;
}

export interface SLAReport {
  onTimeBookings: SLAStatus[];
  lateBookings: SLAStatus[];
  atRiskBookings: SLAStatus[];
  totalBookings: number;
  onTimePercentage: number;
  averageDelayMinutes: number;
}

/**
 * Calculate SLA delay for completed bookings
 * SLA tolerance: 30 minutes (configurable)
 */
export async function calculateSLADelay(
  startDate?: string,
  endDate?: string,
  slaToleranceMinutes: number = 30
): Promise<SLAReport> {
  const supabase = await createClient();

  // Default to last 7 days if no date range provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get bookings with service progress data
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      schedule_start,
      status,
      customer:users!bookings_customer_id_fkey(name),
      booking_services(
        service_type:service_types(name, default_duration_minutes)
      ),
      service_progress(
        start_time,
        end_time,
        status
      )
    `)
    .gte('schedule_start', start.toISOString())
    .lte('schedule_start', end.toISOString())
    .in('status', ['done', 'in_progress', 'queued']);

  if (error || !bookings) {
    throw new Error('Failed to fetch bookings for SLA calculation: ' + error?.message);
  }

  const slaStatuses: SLAStatus[] = [];

  for (const booking of bookings) {
    const scheduledStart = new Date(booking.schedule_start);
    
    // Calculate estimated duration from booking services
    let estimatedDurationMinutes = 60; // Default 1 hour for consultation
    
    if (booking.booking_services && Array.isArray(booking.booking_services) && booking.booking_services.length > 0) {
      estimatedDurationMinutes = 0;
      for (const bs of booking.booking_services) {
        const serviceType = bs.service_type as { name?: string; default_duration_minutes?: number };
        if (serviceType && serviceType.default_duration_minutes) {
          estimatedDurationMinutes += serviceType.default_duration_minutes;
        }
      }
      // Fallback to 60 if no valid duration found
      if (estimatedDurationMinutes === 0) {
        estimatedDurationMinutes = 60;
      }
    }
    
    const estimatedEnd = new Date(scheduledStart.getTime() + estimatedDurationMinutes * 60 * 1000);

    // Get service name (first service or 'Konsultasi' if no services)
    let serviceName = 'Konsultasi';
    if (booking.booking_services && Array.isArray(booking.booking_services) && booking.booking_services.length > 0) {
      const firstService = booking.booking_services[0];
      const serviceType = firstService.service_type as { name?: string; default_duration_minutes?: number };
      if (serviceType && serviceType.name) {
        serviceName = serviceType.name;
      }
    }

    const progress = Array.isArray(booking.service_progress) 
      ? booking.service_progress[0] 
      : booking.service_progress;

    let delayMinutes = 0;
    let isLate = false;
    let isAtRisk = false;
    let actualEnd: string | null = null;

    if (progress?.end_time) {
      // Completed booking - calculate actual delay (24-hour basis)
      actualEnd = progress.end_time;
      if (actualEnd) {
        const actualEndTime = new Date(actualEnd);
        // Calculate delay in minutes (includes all hours, not just working hours)
        delayMinutes = Math.max(0, Math.round((actualEndTime.getTime() - estimatedEnd.getTime()) / (1000 * 60)));
        isLate = delayMinutes > slaToleranceMinutes;
      }
    } else if (booking.status === 'in_progress' && progress?.start_time) {
      // In progress - check if at risk of being late (24-hour basis)
      const now = new Date();
      const startTime = new Date(progress.start_time);
      // Calculate elapsed time including all hours (24/7)
      const elapsedMinutes = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));
      const remainingMinutes = estimatedDurationMinutes - elapsedMinutes;
      
      // At risk if less than 15 minutes remaining and not finished
      isAtRisk = remainingMinutes <= 15 && remainingMinutes > 0;
      
      // Calculate potential delay if continues at current pace (24-hour basis)
      if (elapsedMinutes > estimatedDurationMinutes) {
        delayMinutes = elapsedMinutes - estimatedDurationMinutes;
        isLate = delayMinutes > slaToleranceMinutes;
      }
    } else if (booking.status === 'queued') {
      // Queued - check if already past scheduled time (24-hour basis)
      const now = new Date();
      if (now > estimatedEnd) {
        // Calculate delay including all hours (not just working hours)
        delayMinutes = Math.round((now.getTime() - estimatedEnd.getTime()) / (1000 * 60));
        isAtRisk = true;
      }
    }

    slaStatuses.push({
      bookingId: booking.id,
      customerName: (booking.customer as { name?: string })?.name || 'Unknown',
      serviceName,
      scheduledStart: booking.schedule_start,
      estimatedEnd: estimatedEnd.toISOString(),
      actualEnd,
      delayMinutes,
      isLate,
      isAtRisk,
      status: booking.status
    });
  }

  const onTimeBookings = slaStatuses.filter(s => !s.isLate && !s.isAtRisk);
  const lateBookings = slaStatuses.filter(s => s.isLate);
  const atRiskBookings = slaStatuses.filter(s => s.isAtRisk && !s.isLate);

  const onTimePercentage = slaStatuses.length > 0 
    ? Math.round((onTimeBookings.length / slaStatuses.length) * 100)
    : 100;

  const totalDelay = lateBookings.reduce((sum, booking) => sum + booking.delayMinutes, 0);
  const averageDelayMinutes = lateBookings.length > 0 
    ? Math.round(totalDelay / lateBookings.length)
    : 0;

  return {
    onTimeBookings,
    lateBookings,
    atRiskBookings,
    totalBookings: slaStatuses.length,
    onTimePercentage,
    averageDelayMinutes
  };
}

/**
 * Get SLA status for specific booking
 */
export async function getBookingSLAStatus(bookingId: string): Promise<SLAStatus | null> {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      schedule_start,
      status,
      customer:users!bookings_customer_id_fkey(name),
      booking_services(
        service_type:service_types(name, default_duration_minutes)
      ),
      service_progress(
        start_time,
        end_time,
        status
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return null;
  }

  const scheduledStart = new Date(booking.schedule_start);
  
  // Calculate estimated duration from booking services
  let estimatedDurationMinutes = 60; // Default 1 hour for consultation
  
  if (booking.booking_services && Array.isArray(booking.booking_services) && booking.booking_services.length > 0) {
    estimatedDurationMinutes = 0;
    for (const bs of booking.booking_services) {
      const serviceType = bs.service_type as { name?: string; default_duration_minutes?: number };
      if (serviceType && serviceType.default_duration_minutes) {
        estimatedDurationMinutes += serviceType.default_duration_minutes;
      }
    }
    // Fallback to 60 if no valid duration found
    if (estimatedDurationMinutes === 0) {
      estimatedDurationMinutes = 60;
    }
  }
  
  const estimatedEnd = new Date(scheduledStart.getTime() + estimatedDurationMinutes * 60 * 1000);
  
  // Get service name
  let serviceName = 'Konsultasi';
  if (booking.booking_services && Array.isArray(booking.booking_services) && booking.booking_services.length > 0) {
    const firstService = booking.booking_services[0];
    const serviceType = firstService.service_type as { name?: string; default_duration_minutes?: number };
    if (serviceType && serviceType.name) {
      serviceName = serviceType.name;
    }
  }

  const progress = Array.isArray(booking.service_progress) 
    ? booking.service_progress[0] 
    : booking.service_progress;

  let delayMinutes = 0;
  let isLate = false;
  let isAtRisk = false;
  let actualEnd: string | null = null;

  if (progress?.end_time) {
    actualEnd = progress.end_time;
    if (actualEnd) {
      const actualEndTime = new Date(actualEnd);
      // Calculate delay in minutes (24-hour basis, includes all hours)
      delayMinutes = Math.max(0, Math.round((actualEndTime.getTime() - estimatedEnd.getTime()) / (1000 * 60)));
      isLate = delayMinutes > 30; // 30 minutes tolerance
    }
  } else if (booking.status === 'in_progress' && progress?.start_time) {
    const now = new Date();
    const startTime = new Date(progress.start_time);
    // Calculate elapsed time including all hours (24/7, not just working hours)
    const elapsedMinutes = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));
    const remainingMinutes = estimatedDurationMinutes - elapsedMinutes;
    
    isAtRisk = remainingMinutes <= 15 && remainingMinutes > 0;
    
    // Calculate delay if service is taking longer than estimated (24-hour basis)
    if (elapsedMinutes > estimatedDurationMinutes) {
      delayMinutes = elapsedMinutes - estimatedDurationMinutes;
      isLate = delayMinutes > 30;
    }
  }

  return {
    bookingId: booking.id,
    customerName: (booking.customer as { name?: string })?.name || 'Unknown',
    serviceName,
    scheduledStart: booking.schedule_start,
    estimatedEnd: estimatedEnd.toISOString(),
    actualEnd,
    delayMinutes,
    isLate,
    isAtRisk,
    status: booking.status
  };
}