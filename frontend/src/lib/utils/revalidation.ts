import { revalidatePath } from 'next/cache';

/**
 * Centralized revalidation helpers to ensure consistent cache invalidation
 */

export function revalidateBookingPaths(bookingId: string) {
  // Admin paths
  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${bookingId}`);
  
  // Mechanic paths
  revalidatePath('/mechanic');
  revalidatePath('/mechanic/queue');
  revalidatePath(`/mechanic/queue/${bookingId}`);
  
  // Customer paths
  revalidatePath('/customer/bookings');
  revalidatePath(`/customer/bookings/${bookingId}`);
}

export function revalidateMechanicPaths() {
  // Admin paths
  revalidatePath('/admin/mechanics');
  revalidatePath('/admin/mechanics/link');
  
  // Mechanic paths
  revalidatePath('/mechanic');
  revalidatePath('/mechanic/queue');
}

export function revalidateAssignmentPaths(bookingId?: string) {
  // Admin paths
  revalidatePath('/admin/bookings');
  if (bookingId) {
    revalidatePath(`/admin/bookings/${bookingId}`);
  }
  
  // Mechanic paths
  revalidatePath('/mechanic');
  revalidatePath('/mechanic/queue');
  if (bookingId) {
    revalidatePath(`/mechanic/queue/${bookingId}`);
  }
}

export function revalidateServicePaths() {
  revalidatePath('/admin/services');
}

export function revalidateAllDashboards() {
  revalidatePath('/admin');
  revalidatePath('/admin/dashboard');
  revalidatePath('/mechanic');
  revalidatePath('/customer');
  revalidatePath('/owner');
}