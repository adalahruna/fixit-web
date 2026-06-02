/**
 * Testing utilities for the FixIt booking system
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'mechanic' | 'owner';
  name: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  customer: {
    email: 'customer@test.com',
    password: 'test123',
    role: 'customer',
    name: 'Test Customer'
  },
  admin: {
    email: 'admin@bengkel.com',
    password: 'admin123',
    role: 'admin',
    name: 'Test Admin'
  },
  mechanic: {
    email: 'mechanic@bengkel.com',
    password: 'mechanic123',
    role: 'mechanic',
    name: 'Test Mechanic'
  },
  owner: {
    email: 'owner@bengkel.com',
    password: 'owner123',
    role: 'owner',
    name: 'Test Owner'
  }
};

export interface TestBooking {
  scheduledDate: string;
  scheduledTime: string;
  vehiclePlate: string;
  vehicleType: string;
  services: string[];
  consultationText?: string;
}

export const TEST_BOOKINGS: TestBooking[] = [
  {
    scheduledDate: '2026-03-20',
    scheduledTime: '09:00',
    vehiclePlate: 'B1234ABC',
    vehicleType: 'Motor Matic',
    services: ['Ganti Oli'],
    consultationText: 'Motor terasa berat saat digas'
  },
  {
    scheduledDate: '2026-03-21',
    scheduledTime: '10:00',
    vehiclePlate: 'B5678DEF',
    vehicleType: 'Motor Sport',
    services: ['Tune Up', 'Ganti Oli'],
    consultationText: 'Mesin kasar dan boros bensin'
  },
  {
    scheduledDate: '2026-03-22',
    scheduledTime: '14:00',
    vehiclePlate: 'B9012GHI',
    vehicleType: 'Motor Bebek',
    services: [],
    consultationText: 'Konsultasi masalah rem'
  }
];

export interface TestScenario {
  name: string;
  description: string;
  role: keyof typeof TEST_USERS;
  steps: string[];
  expectedResults: string[];
}

export const BLACK_BOX_SCENARIOS: TestScenario[] = [
  {
    name: 'Customer Booking Flow',
    description: 'Test complete customer booking process',
    role: 'customer',
    steps: [
      'Login as customer',
      'Navigate to new booking page',
      'Fill booking form with valid data',
      'Submit booking',
      'View booking in list',
      'Check booking details'
    ],
    expectedResults: [
      'Login successful',
      'Booking form accessible',
      'Form validation works',
      'Booking created successfully',
      'Booking appears in list',
      'Details show correct information'
    ]
  },
  {
    name: 'Admin Assignment Flow',
    description: 'Test admin assigning mechanic to booking',
    role: 'admin',
    steps: [
      'Login as admin',
      'Navigate to bookings list',
      'Select pending booking',
      'Assign available mechanic',
      'Confirm assignment',
      'Check booking status updated'
    ],
    expectedResults: [
      'Admin dashboard accessible',
      'Bookings list shows pending items',
      'Assignment form available',
      'Mechanic assigned successfully',
      'Status changed to confirmed',
      'Assignment visible in booking details'
    ]
  },
  {
    name: 'Mechanic Service Flow',
    description: 'Test mechanic completing service',
    role: 'mechanic',
    steps: [
      'Login as mechanic',
      'View assigned queue',
      'Start service for booking',
      'Complete service',
      'Check service progress updated'
    ],
    expectedResults: [
      'Mechanic dashboard accessible',
      'Queue shows assigned bookings',
      'Service can be started',
      'Service can be completed',
      'Progress tracked correctly'
    ]
  },
  {
    name: 'Owner Monitoring Flow',
    description: 'Test owner viewing reports and analytics',
    role: 'owner',
    steps: [
      'Login as owner',
      'View KPI dashboard',
      'Check SLA monitoring',
      'Review audit logs',
      'Analyze overload reports'
    ],
    expectedResults: [
      'Owner dashboard accessible',
      'KPI metrics displayed',
      'SLA data available',
      'Audit logs viewable',
      'Overload status shown'
    ]
  }
];

/**
 * Generate test data for different scenarios
 */
export function generateTestData() {
  return {
    users: TEST_USERS,
    bookings: TEST_BOOKINGS,
    scenarios: BLACK_BOX_SCENARIOS
  };
}

/**
 * Validate test results
 */
export function validateTestResult(
  scenario: string,
  step: string,
  expected: string,
  actual: string
): boolean {
  // Simple validation - in real testing, this would be more sophisticated
  return actual.toLowerCase().includes(expected.toLowerCase());
}

/**
 * Format test report
 */
export function formatTestReport(results: Array<{
  scenario: string;
  step: string;
  expected: string;
  actual: string;
  passed: boolean;
}>) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  return {
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: `${passRate}%`
    },
    results,
    timestamp: new Date().toISOString()
  };
}