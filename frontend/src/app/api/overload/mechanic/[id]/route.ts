import { NextResponse } from 'next/server';
import { getMechanicOverloadStatus } from '@/lib/utils/overload-detection';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mechanicId = params.id;
    
    // Validate mechanic ID format (UUID validation)
    if (!mechanicId || typeof mechanicId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid mechanic ID' },
        { status: 400 }
      );
    }
    
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mechanicId)) {
      return NextResponse.json(
        { error: 'Invalid mechanic ID format' },
        { status: 400 }
      );
    }
    
    // Get real-time overload status from database
    const status = await getMechanicOverloadStatus(mechanicId);
    
    if (!status) {
      return NextResponse.json(
        { error: 'Mechanic not found or inactive' },
        { status: 404 }
      );
    }
    
    // Return real-time status regardless of whether mechanic is overloaded
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting mechanic overload status:', error);
    
    // Return detailed error for debugging while keeping user-facing message generic
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    
    // Check for specific database errors
    if (errorMessage.includes('Failed to fetch')) {
      return NextResponse.json(
        { error: 'Database query failed. Please try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get mechanic overload status' },
      { status: 500 }
    );
  }
}