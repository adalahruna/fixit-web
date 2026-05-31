'use server';

import { createClient } from '@/lib/supabase/server';

// Type definitions for Supabase query results
interface ServiceType {
  price: number;
  default_duration_minutes: number;
  name: string;
}

interface BookingService {
  service_type: ServiceType;
}

interface ServiceProgress {
  start_time: string | null;
  end_time: string | null;
  actual_duration: number | null;
}

interface BookingData {
  id: string;
  status: string;
  schedule_start: string;
  schedule_end: string;
  created_at: string;
  booking_services: BookingService[] | null;
  service_progress: ServiceProgress[] | ServiceProgress | null;
}

/**
 * Helper function to calculate real mechanic performance metrics
 * Queries all active mechanics and their completed bookings to calculate:
 * - Completed jobs count
 * - Average service time from service_progress
 * - On-time rate based on scheduled vs actual duration
 * 
 * Includes mechanics with zero completed jobs (showing zero metrics)
 * 
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of mechanic performance data
 */
async function getMechanicPerformance(
  startDate: Date,
  endDate: Date
): Promise<Array<{ name: string; completedJobs: number; avgTime: number; onTimeRate: number }>> {
  const supabase = await createClient();

  // 1. Get all active mechanics
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('id, name')
    .eq('is_active', true);

  if (!mechanics || mechanics.length === 0) {
    return [];
  }

  const performance = [];

  // 2. For each mechanic, calculate real metrics
  for (const mechanic of mechanics) {
    // 3. Get completed bookings assigned to this mechanic
    const { data: assignments } = await supabase
      .from('assignments')
      .select(`
        booking:bookings!inner(
          id,
          schedule_start,
          schedule_end,
          status,
          service_progress(
            actual_duration,
            start_time,
            end_time
          )
        )
      `)
      .eq('mechanic_id', mechanic.id)
      .eq('booking.status', 'done')
      .gte('booking.schedule_start', startDate.toISOString())
      .lte('booking.schedule_start', endDate.toISOString()) as {
        data: Array<{
          booking: {
            id: string;
            schedule_start: string;
            schedule_end: string;
            status: string;
            service_progress: ServiceProgress[] | ServiceProgress | null;
          };
        }> | null;
      };

    const completedJobs = assignments?.length || 0;

    // 4. Calculate average service time from actual_duration
    const totalTime = assignments?.reduce((sum, a) => {
      const progress = Array.isArray(a.booking.service_progress)
        ? a.booking.service_progress[0]
        : a.booking.service_progress;
      return sum + (progress?.actual_duration || 0);
    }, 0) || 0;

    const avgTime = completedJobs > 0 
      ? Math.round(totalTime / completedJobs) 
      : 0;

    // 5. Calculate on-time rate (scheduled duration vs actual duration)
    const onTimeJobs = assignments?.filter(a => {
      const progress = Array.isArray(a.booking.service_progress)
        ? a.booking.service_progress[0]
        : a.booking.service_progress;
      
      if (!progress?.actual_duration) return false;
      
      const scheduledDuration = 
        new Date(a.booking.schedule_end).getTime() - 
        new Date(a.booking.schedule_start).getTime();
      const actualDuration = progress.actual_duration * 60 * 1000; // convert minutes to milliseconds
      
      // On-time if actual duration is within scheduled duration + 30 min tolerance
      return actualDuration <= scheduledDuration + (30 * 60 * 1000);
    }).length || 0;

    const onTimeRate = completedJobs > 0
      ? Math.round((onTimeJobs / completedJobs) * 100)
      : 0;

    // 6. Add to performance array (include mechanics with zero completed jobs)
    performance.push({
      name: mechanic.name,
      completedJobs,
      avgTime,
      onTimeRate
    });
  }

  return performance;
}

export interface KPIMetrics {
  // Booking metrics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  
  // Performance metrics
  averageServiceTime: number; // in minutes
  onTimeCompletionRate: number; // percentage
  customerSatisfactionRate: number; // placeholder for future implementation
  
  // Utilization metrics
  mechanicUtilization: number; // percentage
  dailyBookingTrend: Array<{ date: string; count: number }>;
  
  // Revenue metrics (placeholder)
  totalRevenue: number;
  averageBookingValue: number;

  // Enhanced metrics
  bookingsByStatus: Array<{ status: string; count: number; color: string }>;
  serviceTypeDistribution: Array<{ name: string; count: number; revenue: number }>;
  mechanicPerformance: Array<{ name: string; completedJobs: number; avgTime: number; onTimeRate: number }>;
  hourlyBookingDistribution: Array<{ hour: number; count: number }>;
  weeklyTrend: Array<{ week: string; bookings: number; revenue: number }>;
  
  // Quality metrics
  rescheduleRate: number;
  averageWaitTime: number; // minutes from booking to service start
  peakHours: Array<{ hour: number; load: number }>;
}

export async function calculateKPIMetrics(
  startDate?: string,
  endDate?: string
): Promise<KPIMetrics> {
  const supabase = await createClient();

  // Default to last 30 days if no date range provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get booking statistics
  // Filter by schedule_start instead of created_at to include all bookings in the period
  // Use lte with end of day to include bookings on the end date
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      schedule_start,
      schedule_end,
      created_at,
      booking_services(
        service_type:service_types(price, default_duration_minutes, name)
      ),
      service_progress(
        start_time,
        end_time,
        actual_duration
      )
    `)
    .gte('schedule_start', start.toISOString())
    .lte('schedule_start', endOfDay.toISOString()) as { data: BookingData[] | null };

  const totalBookings = bookings?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'done').length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
  const pendingBookings = bookings?.filter(b => ['pending', 'confirmed', 'queued', 'in_progress'].includes(b.status)).length || 0;

  // Calculate average service time
  const completedWithProgress = bookings?.filter(b => {
    if (b.status !== 'done' || !b.service_progress) return false;
    
    // Handle both array and single object
    const progress = Array.isArray(b.service_progress) 
      ? b.service_progress[0] 
      : b.service_progress;
    
    return progress?.actual_duration != null && progress.actual_duration > 0;
  }) || [];
  
  const totalServiceTime = completedWithProgress.reduce((sum, booking) => {
    const progress = Array.isArray(booking.service_progress) 
      ? booking.service_progress[0] 
      : booking.service_progress;
    return sum + (progress?.actual_duration || 0);
  }, 0);
  
  const averageServiceTime = completedWithProgress.length > 0 
    ? Math.round(totalServiceTime / completedWithProgress.length)
    : 0;

  // Calculate on-time completion rate (simplified)
  const onTimeBookings = completedWithProgress.filter(booking => {
    const progress = Array.isArray(booking.service_progress) ? booking.service_progress[0] : booking.service_progress;
    const scheduledDuration = new Date(booking.schedule_end).getTime() - new Date(booking.schedule_start).getTime();
    const actualDuration = (progress?.actual_duration || 0) * 60 * 1000; // convert to milliseconds
    return actualDuration <= scheduledDuration + (30 * 60 * 1000); // 30 minutes tolerance
  }).length;

  const onTimeCompletionRate = completedBookings > 0 
    ? Math.round((onTimeBookings / completedBookings) * 100)
    : 100;

  // Calculate daily booking trend
  const dailyBookingTrend = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayBookings = bookings?.filter(b => 
      b.created_at.startsWith(dateStr)
    ).length || 0;
    
    dailyBookingTrend.push({
      date: dateStr,
      count: dayBookings
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get mechanic utilization
  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('id, daily_capacity_minutes')
    .eq('is_active', true);

  const totalCapacityMinutes = mechanics?.reduce((sum, m) => sum + (m.daily_capacity_minutes || 480), 0) || 0;
  const totalUsedMinutes = totalServiceTime;
  const mechanicUtilization = totalCapacityMinutes > 0 
    ? Math.round((totalUsedMinutes / totalCapacityMinutes) * 100)
    : 0;

  // Calculate revenue (placeholder - using service prices)
  let totalRevenue = 0;
  let totalBookingValue = 0;
  
  bookings?.forEach(booking => {
    if (booking.booking_services && Array.isArray(booking.booking_services)) {
      const bookingRevenue = booking.booking_services.reduce((sum, bs) => {
        const serviceType = bs.service_type;
        return sum + (serviceType?.price || 0);
      }, 0);
      totalRevenue += bookingRevenue;
      totalBookingValue += bookingRevenue;
    }
  });

  const averageBookingValue = totalBookings > 0 
    ? Math.round(totalBookingValue / totalBookings)
    : 0;

  // Enhanced metrics calculations
  
  // Bookings by status for donut chart
  const bookingsByStatus = [
    { status: 'Completed', count: completedBookings, color: '#10b981' },
    { status: 'In Progress', count: pendingBookings, color: '#3b82f6' },
    { status: 'Cancelled', count: cancelledBookings, color: '#ef4444' }
  ].filter(item => item.count > 0);

  // Service type distribution
  const serviceTypeMap = new Map<string, { count: number; revenue: number }>();
  bookings?.forEach(booking => {
    if (booking.booking_services && Array.isArray(booking.booking_services)) {
      booking.booking_services.forEach(bs => {
        const serviceType = bs.service_type;
        if (serviceType) {
          const existing = serviceTypeMap.get(serviceType.name) || { count: 0, revenue: 0 };
          serviceTypeMap.set(serviceType.name, {
            count: existing.count + 1,
            revenue: existing.revenue + (serviceType.price || 0)
          });
        }
      });
    }
  });

  const serviceTypeDistribution = Array.from(serviceTypeMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    revenue: data.revenue
  }));

  // Mechanic performance (real data from database)
  const mechanicPerformance = await getMechanicPerformance(start, end);

  // Hourly booking distribution
  const hourlyDistribution = new Map<number, number>();
  bookings?.forEach(booking => {
    const hour = new Date(booking.schedule_start).getHours();
    hourlyDistribution.set(hour, (hourlyDistribution.get(hour) || 0) + 1);
  });

  const hourlyBookingDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourlyDistribution.get(hour) || 0
  })).filter(item => item.count > 0);

  // Weekly trend (last 4 weeks)
  const weeklyTrend = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(end);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekBookings = bookings?.filter(b => {
      const bookingDate = new Date(b.created_at);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }) || [];

    const weekRevenue = weekBookings.reduce((sum, booking) => {
      if (booking.booking_services && Array.isArray(booking.booking_services)) {
        return sum + booking.booking_services.reduce((serviceSum, bs) => {
          const serviceType = bs.service_type;
          return serviceSum + (serviceType?.price || 0);
        }, 0);
      }
      return sum;
    }, 0);

    weeklyTrend.push({
      week: `Week ${4 - i}`,
      bookings: weekBookings.length,
      revenue: weekRevenue
    });
  }

  // Quality metrics
  const rescheduleRate = 5; // Placeholder - would need reschedule tracking
  const averageWaitTime = 30; // Placeholder - would calculate from booking to service start

  // Peak hours analysis
  const peakHours = hourlyBookingDistribution
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => ({ hour: item.hour, load: item.count }));

  return {
    totalBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    averageServiceTime,
    onTimeCompletionRate,
    customerSatisfactionRate: 85, // Placeholder
    mechanicUtilization,
    dailyBookingTrend,
    totalRevenue,
    averageBookingValue,
    bookingsByStatus,
    serviceTypeDistribution,
    mechanicPerformance,
    hourlyBookingDistribution,
    weeklyTrend,
    rescheduleRate,
    averageWaitTime,
    peakHours
  };
}