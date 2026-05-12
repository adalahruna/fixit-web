'use server';

import { createClient } from '@/lib/supabase/server';

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
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      schedule_start,
      schedule_end,
      created_at,
      booking_services(
        service_type:service_types(price, default_duration_minutes)
      ),
      service_progress(
        start_time,
        end_time,
        actual_duration
      )
    `)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const totalBookings = bookings?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'done').length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
  const pendingBookings = bookings?.filter(b => ['pending', 'confirmed', 'queued', 'in_progress'].includes(b.status)).length || 0;

  // Calculate average service time
  const completedWithProgress = bookings?.filter(b => 
    b.status === 'done' && 
    b.service_progress && 
    Array.isArray(b.service_progress) && 
    b.service_progress[0]?.actual_duration
  ) || [];
  
  const totalServiceTime = completedWithProgress.reduce((sum, booking) => {
    const progress = Array.isArray(booking.service_progress) ? booking.service_progress[0] : booking.service_progress;
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
        const serviceType = bs.service_type as any;
        return sum + (serviceType?.price || 0);
      }, 0);
      totalRevenue += bookingRevenue;
      totalBookingValue += bookingRevenue;
    }
  });

  const averageBookingValue = totalBookings > 0 
    ? Math.round(totalBookingValue / totalBookings)
    : 0;

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
    averageBookingValue
  };
}