import { NextRequest, NextResponse } from 'next/server';
import { BilibiliApi } from '@/lib/bilibili-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId, cookie, csrf } = body;

    if (!mediaId || !cookie || !csrf) {
      return NextResponse.json(
        { success: false, error: 'mediaId, cookie, and csrf are required' },
        { status: 400 }
      );
    }

    const api = new BilibiliApi(cookie);
    const response = await api.cleanFavoriteMedia(mediaId, csrf);

    if (response.code !== 0) {
      return NextResponse.json(
        { success: false, error: response.message || 'Clean failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Clean API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
