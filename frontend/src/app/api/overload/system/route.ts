import { NextResponse } from 'next/server';
import { detectMechanicOverload } from '@/lib/utils/overload-detection';

export async function GET() {
  try {
    // Get real-time overload detection data from database
    const result = await detectMechanicOverload();
    
    // Return complete real-time system overload status
    return NextResponse.json({
      systemOverloadPercentage: result.systemOverloadPercentage,
      overloadedCount: result.overloadedCount,
      totalMechanics: result.totalMechanics,
      overloadedMechanics: result.overloadedMechanics
    });
  } catch (error) {
    console.error('Error detecting system overload:', error);
    
    // Return detailed error for debugging while keeping user-facing message generic
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to detect system overload' },
      { status: 500 }
    );
  }
}