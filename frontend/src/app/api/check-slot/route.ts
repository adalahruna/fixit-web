import { NextRequest, NextResponse } from 'next/server';
import { checkSlotAvailability } from '@/lib/utils/slot-availability';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleStart, estimatedDurationMinutes } = body;

    if (!scheduleStart || !estimatedDurationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await checkSlotAvailability(scheduleStart, estimatedDurationMinutes);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Check slot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
