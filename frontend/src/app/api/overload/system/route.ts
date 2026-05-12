import { NextResponse } from 'next/server';
import { detectMechanicOverload } from '@/lib/utils/overload-detection';

export async function GET() {
  try {
    const result = await detectMechanicOverload();
    
    return NextResponse.json({
      systemOverloadPercentage: result.systemOverloadPercentage,
      overloadedCount: result.overloadedCount,
      totalMechanics: result.totalMechanics,
      overloadedMechanics: result.overloadedMechanics
    });
  } catch (error) {
    console.error('Error detecting system overload:', error);
    return NextResponse.json(
      { error: 'Failed to detect system overload' },
      { status: 500 }
    );
  }
}