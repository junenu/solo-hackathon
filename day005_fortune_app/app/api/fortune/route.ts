import { NextRequest, NextResponse } from 'next/server';
import { getTodaysFortune, initializeSchema } from '@/lib/db';

// DB初期化
initializeSchema();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const fortune = getTodaysFortune(date);
    
    return NextResponse.json({
      success: true,
      data: fortune,
      date: date
    });
  } catch (error) {
    console.error('Fortune API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get fortune' },
      { status: 500 }
    );
  }
}