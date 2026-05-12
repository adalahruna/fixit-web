import { requireRole } from '@/lib/auth/utils';

export default async function TestingPage() {
  await requireRole(['admin', 'owner']);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Testing Dashboard</h1>
      </div>

      {/* Testing Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Testing Overview</h2>
        <p className="text-gray-600 mb-4">
          Comprehensive testing suite for the FixIt booking system including unit tests, 
          integration tests, and black-box testing scenarios for all user roles.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Unit Tests</h3>
            <p className="text-sm text-blue-600 mt-1">
              Test individual functions and business logic
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Integration Tests</h3>
            <p className="text-sm text-green-600 mt-1">
              Test complete user workflows and interactions
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Black-box Tests</h3>
            <p className="text-sm text-purple-600 mt-1">
              Test system behavior from user perspective
            </p>
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Scenarios by Role</h2>
        
        <div className="space-y-6">
          {/* Customer Tests */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-lg">Customer Role Tests</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Booking Creation Flow</span>
                  <p className="text-sm text-gray-600">Test complete booking process from form to confirmation</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Ready</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Booking Management</span>
                  <p className="text-sm text-gray-600">Test viewing, rescheduling, and canceling bookings</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Ready</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Real-time Updates</span>
                  <p className="text-sm text-gray-600">Test real-time status updates and notifications</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Ready</span>
              </div>
            </div>
          </div>

          {/* Admin Tests */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg">Admin Role Tests</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Booking Management</span>
                  <p className="text-sm text-gray-600">Test assigning mechanics and managing bookings</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Ready</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Master Data CRUD</span>
                  <p className="text-sm text-gray-600">Test service types and mechanics management</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Ready</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">SLA Monitoring</span>
                  <p className="text-sm text-gray-600">Test overload detection and SLA tracking</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Ready</span>
              </div>
            </div>
          </div>

          {/* Mechanic Tests */}
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-lg">Mechanic Role Tests</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Queue Management</span>
                  <p className="text-sm text-gray-600">Test viewing and managing assigned bookings</p>
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Ready</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Service Progress</span>
                  <p className="text-sm text-gray-600">Test starting and completing services</p>
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Ready</span>
              </div>
            </div>
          </div>

          {/* Owner Tests */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-lg">Owner Role Tests</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">KPI Dashboard</span>
                  <p className="text-sm text-gray-600">Test business metrics and analytics</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Ready</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Audit Logs</span>
                  <p className="text-sm text-gray-600">Test audit trail and system monitoring</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Data */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Data & Users</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Test Users</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">customer@test.com</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Customer</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">admin@bengkel.com</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Admin</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">mechanic@bengkel.com</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">Mechanic</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">owner@bengkel.com</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">Owner</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Test Scenarios</h3>
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 rounded">
                <span className="font-medium">Standard Booking</span>
                <p className="text-sm text-gray-600">Motor Matic - Ganti Oli</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="font-medium">Multiple Services</span>
                <p className="text-sm text-gray-600">Motor Sport - Tune Up + Ganti Oli</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="font-medium">Consultation Only</span>
                <p className="text-sm text-gray-600">Motor Bebek - Konsultasi Rem</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Manual Testing Steps</h3>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
              <li>Use the test users provided above to login with different roles</li>
              <li>Follow the test scenarios for each role systematically</li>
              <li>Verify that all features work as expected</li>
              <li>Test error handling and edge cases</li>
              <li>Document any issues or unexpected behavior</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold">Automated Testing</h3>
            <p className="text-gray-700 mt-2">
              Run the automated test suite using the following commands:
            </p>
            <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-sm">
              <div>npm run test:unit    # Run unit tests</div>
              <div>npm run test:integration    # Run integration tests</div>
              <div>npm run test:e2e    # Run end-to-end tests</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Test Coverage Goals</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
              <li>Unit test coverage: &gt;80% for business logic functions</li>
              <li>Integration test coverage: All major user workflows</li>
              <li>Black-box test coverage: All user roles and scenarios</li>
              <li>Error handling: All error conditions and edge cases</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}