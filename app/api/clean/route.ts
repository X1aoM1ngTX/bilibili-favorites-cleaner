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

    // 清理前：获取收藏夹当前视频数量
    const beforeFolders = await api.getFavoriteFolders(
      // 从 cookie 中提取 up_mid
      cookie.match(/DedeUserID=(\d+)/)?.[1] || ''
    );
    const beforeFolder = beforeFolders.data?.list?.find(
      (f: { id: number }) => f.id === mediaId
    );
    const beforeCount = beforeFolder?.media_count ?? 0;

    // 执行清理
    const response = await api.cleanFavoriteMedia(mediaId, csrf);

    if (response.code !== 0) {
      return NextResponse.json(
        { success: false, error: response.message || 'Clean failed' },
        { status: 500 }
      );
    }

    // 清理后：重新获取视频数量，计算差值
    const afterFolders = await api.getFavoriteFolders(
      cookie.match(/DedeUserID=(\d+)/)?.[1] || ''
    );
    const afterFolder = afterFolders.data?.list?.find(
      (f: { id: number }) => f.id === mediaId
    );
    const afterCount = afterFolder?.media_count ?? 0;
    const cleanedCount = Math.max(0, beforeCount - afterCount);

    return NextResponse.json({
      success: true,
      data: cleanedCount,
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
