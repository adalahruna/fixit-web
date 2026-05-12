import { NextResponse } from 'next/server';
import { getMechanicOverloadStatus } from '@/lib/utils/overload-detection';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mechanicId = params.id;
    const status = await getMechanicOverloadStatus(mechanicId);
    
    if (!status) {
      return NextResponse.json(
        { error: 'Mechanic not found or not overloaded' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting mechanic overload status:', error);
    return NextResponse.json(
      { error: 'Failed to get mechanic overload status' },
      { status: 500 }
    );
  }
}