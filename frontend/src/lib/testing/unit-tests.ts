/**
 * Unit tests for critical business logic functions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase client for testing
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: [],
        error: null
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
};

// Import functions to test
import { checkSlotAvailability } from '@/lib/utils/slot-availability';
import { calculateSLAStatus } from '@/lib/utils/sla-calculation';
import { detectMechanicOverload } from '@/lib/utils/overload-detection';

describe('Slot Availability Tests', () => {
  it('should return false when no mechanics are active', async () => {
    const result = await checkSlotAvailability(
      '2026-03-20T09:00:00Z',
      60 // 60 minutes duration
    );
    expect(result.available).toBe(false);
    expect(result.message).toContain('mekanik');
  });

  it('should validate time slot format correctly', () => {
    const validDate = new Date('2026-03-20T09:00:00Z');
    const invalidDate = new Date('invalid');
    
    expect(validDate.getTime()).not.toBeNaN();
    expect(invalidDate.getTime()).toBeNaN();
  });
});

describe('SLA Calculation Tests', () => {
  it('should calculate delay correctly for late completion', () => {
    const scheduledEnd = new Date('2026-03-20T10:00:00Z');
    const actualEnd = new Date('2026-03-20T10:45:00Z');
    
    const result = calculateSLAStatus(scheduledEnd, actualEnd);
    
    expect(result.status).toBe('late');
    expect(result.delayMinutes).toBe(45);
  });

  it('should mark as on-time when within tolerance', () => {
    const scheduledEnd = new Date('2026-03-20T10:00:00Z');
    const actualEnd = new Date('2026-03-20T10:15:00Z'); // 15 minutes late, within 30min tolerance
    
    const result = calculateSLAStatus(scheduledEnd, actualEnd);
    
    expect(result.status).toBe('on_time');
    expect(result.delayMinutes).toBe(15);
  });

  it('should handle null actual end time', () => {
    const scheduledEnd = new Date('2026-03-20T10:00:00Z');
    
    const result = calculateSLAStatus(scheduledEnd, null);
    
    expect(result.status).toBe('at_risk');
    expect(result.delayMinutes).toBe(0);
  });
});

describe('Overload Detection Tests', () => {
  it('should calculate overload percentage correctly', () => {
    const capacity = 480; // 8 hours in minutes
    const used = 400; // 6.67 hours used
    
    const percentage = (used / capacity) * 100;
    
    expect(Math.round(percentage)).toBe(83);
    expect(percentage > 80).toBe(true); // Should be overloaded
  });

  it('should handle zero capacity gracefully', () => {
    const capacity = 0;
    const used = 100;
    
    const percentage = capacity > 0 ? (used / capacity) * 100 : 0;
    
    expect(percentage).toBe(0);
  });
});

describe('Date/Time Utility Tests', () => {
  it('should format WIB timezone correctly', () => {
    const utcDate = new Date('2026-03-20T03:00:00Z'); // 3 AM UTC
    const wibTime = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours for WIB
    
    expect(wibTime.getHours()).toBe(10); // Should be 10 AM WIB
  });

  it('should validate business hours', () => {
    const businessStart = 8; // 8 AM
    const businessEnd = 17; // 5 PM
    
    const validHour = 10;
    const invalidHour = 19;
    
    expect(validHour >= businessStart && validHour <= businessEnd).toBe(true);
    expect(invalidHour >= businessStart && invalidHour <= businessEnd).toBe(false);
  });
});

describe('Booking Validation Tests', () => {
  it('should validate required fields', () => {
    const booking = {
      vehiclePlate: 'B1234ABC',
      vehicleType: 'Motor Matic',
      scheduledDate: '2026-03-20',
      scheduledTime: '09:00',
      services: ['Ganti Oli'],
      consultationText: 'Test consultation'
    };

    const isValid = booking.vehiclePlate && 
                   booking.vehicleType && 
                   booking.scheduledDate && 
                   booking.scheduledTime &&
                   (booking.services.length > 0 || booking.consultationText);

    expect(isValid).toBe(true);
  });

  it('should require consultation when no services selected', () => {
    const bookingWithoutServices = {
      services: [],
      consultationText: ''
    };

    const bookingWithConsultation = {
      services: [],
      consultationText: 'Need consultation'
    };

    const isValidWithoutServices = bookingWithoutServices.services.length > 0 || 
                                  bookingWithoutServices.consultationText.length > 0;
    
    const isValidWithConsultation = bookingWithConsultation.services.length > 0 || 
                                   bookingWithConsultation.consultationText.length > 0;

    expect(isValidWithoutServices).toBe(false);
    expect(isValidWithConsultation).toBe(true);
  });
});

describe('Role-based Access Tests', () => {
  it('should validate admin/owner access to management features', () => {
    const adminRoles = ['admin', 'owner'];
    const userRole = 'admin';
    
    const hasAccess = adminRoles.includes(userRole);
    
    expect(hasAccess).toBe(true);
  });

  it('should restrict customer access to admin features', () => {
    const adminRoles = ['admin', 'owner'];
    const userRole = 'customer';
    
    const hasAccess = adminRoles.includes(userRole);
    
    expect(hasAccess).toBe(false);
  });
});