import { NextRequest, NextResponse } from 'next/server';
import { BilibiliApi } from '@/lib/bilibili-api';

export async function POST(request: NextRequest) {
  try {
    const {
      resources,
      srcMediaId,
      tarMediaId,
      mid,
      cookie,
      csrf,
    } = await request.json();

    if (!resources || !srcMediaId || !tarMediaId || !mid || !cookie || !csrf) {
      return NextResponse.json(
        { success: false, error: 'All parameters are required' },
        { status: 400 }
      );
    }

    const api = new BilibiliApi(cookie);
    const response = await api.moveVideos(
      resources,
      srcMediaId,
      tarMediaId,
      mid,
      csrf
    );

    if (response.code !== 0) {
      return NextResponse.json(
        { success: false, error: response.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
