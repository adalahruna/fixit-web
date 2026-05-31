/**
 * Unit tests for mechanic overload detection API endpoint
 * Tests requirement 8.5: API returns real-time data with proper error handling
 * @jest-environment node
 */

import { GET } from './route';
import { getMechanicOverloadStatus } from '@/lib/utils/overload-detection';
import { NextResponse } from 'next/server';

// Mock the overload detection function
jest.mock('@/lib/utils/overload-detection', () => ({
  getMechanicOverloadStatus: jest.fn()
}));

describe('Overload Detection API Endpoint', () => {
  const mockMechanicId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful requests', () => {
    it('should return overload status for valid mechanic ID', async () => {
      const mockStatus = {
        mechanicId: mockMechanicId,
        mechanicName: 'Test Mechanic',
        currentLoad: 400,
        maxCapacity: 480,
        isOverloaded: true,
        overloadPercentage: 83,
        queuedBookings: 3,
        inProgressBookings: 1
      };

      (getMechanicOverloadStatus as jest.Mock).mockResolvedValue(mockStatus);

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response = await GET(request, { params: { id: mockMechanicId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockStatus);
      expect(getMechanicOverloadStatus).toHaveBeenCalledWith(mockMechanicId);
    });

    it('should return status even when mechanic is not overloaded', async () => {
      const mockStatus = {
        mechanicId: mockMechanicId,
        mechanicName: 'Test Mechanic',
        currentLoad: 200,
        maxCapacity: 480,
        isOverloaded: false,
        overloadPercentage: 42,
        queuedBookings: 2,
        inProgressBookings: 0
      };

      (getMechanicOverloadStatus as jest.Mock).mockResolvedValue(mockStatus);

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response = await GET(request, { params: { id: mockMechanicId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isOverloaded).toBe(false);
      expect(data.currentLoad).toBe(200);
    });
  });

  describe('Error handling - Invalid input', () => {
    it('should return 400 for missing mechanic ID', async () => {
      const request = new Request('http://localhost:3000/api/overload/mechanic/');
      const response = await GET(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid mechanic ID');
      expect(getMechanicOverloadStatus).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'not-a-valid-uuid';
      const request = new Request('http://localhost:3000/api/overload/mechanic/' + invalidId);
      const response = await GET(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid mechanic ID format');
      expect(getMechanicOverloadStatus).not.toHaveBeenCalled();
    });

    it('should return 400 for malformed UUID', async () => {
      const malformedId = '123-456-789';
      const request = new Request('http://localhost:3000/api/overload/mechanic/' + malformedId);
      const response = await GET(request, { params: { id: malformedId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid mechanic ID format');
    });
  });

  describe('Error handling - Not found', () => {
    it('should return 404 when mechanic not found', async () => {
      (getMechanicOverloadStatus as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response = await GET(request, { params: { id: mockMechanicId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Mechanic not found or inactive');
    });

    it('should return 404 when mechanic is inactive', async () => {
      (getMechanicOverloadStatus as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response = await GET(request, { params: { id: mockMechanicId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found or inactive');
    });
  });

  describe('Error handling - Database failures', () => {
    it('should return 503 for database query failures', async () => {
      (getMechanicOverloadStatus as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch mechanics: Connection timeout')
      );

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response = await GET(request, { params: { id: mockMechanicId } });
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database query failed. Please try again.');
    });

    it('should return 500 for unexpected errors', async () => {
      (getMechanicOverloadStatus as jest.Mock).mockRejectedValue(
        new Error('Unexpected error occurred')
      );

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response = await GET(request, { params: { id: mockMechanicId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get mechanic overload status');
    });

    it('should handle non-Error exceptions', async () => {
      (getMechanicOverloadStatus as jest.Mock).mockRejectedValue('String error');

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response = await GET(request, { params: { id: mockMechanicId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get mechanic overload status');
    });
  });

  describe('Real-time data verification', () => {
    it('should call getMechanicOverloadStatus which queries database', async () => {
      const mockStatus = {
        mechanicId: mockMechanicId,
        mechanicName: 'Test Mechanic',
        currentLoad: 300,
        maxCapacity: 480,
        isOverloaded: false,
        overloadPercentage: 63,
        queuedBookings: 2,
        inProgressBookings: 1
      };

      (getMechanicOverloadStatus as jest.Mock).mockResolvedValue(mockStatus);

      const request = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      await GET(request, { params: { id: mockMechanicId } });

      // Verify the function that queries real-time data was called
      expect(getMechanicOverloadStatus).toHaveBeenCalledTimes(1);
      expect(getMechanicOverloadStatus).toHaveBeenCalledWith(mockMechanicId);
    });

    it('should return fresh data on each request', async () => {
      const firstStatus = {
        mechanicId: mockMechanicId,
        mechanicName: 'Test Mechanic',
        currentLoad: 300,
        maxCapacity: 480,
        isOverloaded: false,
        overloadPercentage: 63,
        queuedBookings: 2,
        inProgressBookings: 1
      };

      const secondStatus = {
        ...firstStatus,
        currentLoad: 400,
        isOverloaded: true,
        overloadPercentage: 83,
        queuedBookings: 3
      };

      (getMechanicOverloadStatus as jest.Mock)
        .mockResolvedValueOnce(firstStatus)
        .mockResolvedValueOnce(secondStatus);

      const request1 = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response1 = await GET(request1, { params: { id: mockMechanicId } });
      const data1 = await response1.json();

      const request2 = new Request('http://localhost:3000/api/overload/mechanic/' + mockMechanicId);
      const response2 = await GET(request2, { params: { id: mockMechanicId } });
      const data2 = await response2.json();

      // Verify each request gets fresh data
      expect(data1.currentLoad).toBe(300);
      expect(data2.currentLoad).toBe(400);
      expect(getMechanicOverloadStatus).toHaveBeenCalledTimes(2);
    });
  });
});
