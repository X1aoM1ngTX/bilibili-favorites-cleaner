import { NextRequest, NextResponse } from 'next/server';
import { BilibiliApi } from '@/lib/bilibili-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { up_mid, cookie, mediaId } = body;

    // Get favorite folders list
    if (up_mid && cookie && !mediaId) {
      const api = new BilibiliApi(cookie);
      const response = await api.getFavoriteFolders(up_mid);

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
    }

    // Get favorite folder detail (video list)
    if (mediaId && cookie) {
      const api = new BilibiliApi(cookie);
      const response = await api.getFavoriteResources(mediaId);

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
    }

    return NextResponse.json(
      { success: false, error: 'up_mid and cookie, or mediaId and cookie are required' },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
