import { NextRequest, NextResponse } from 'next/server';
import { BilibiliApi } from '@/lib/bilibili-api';
import { apiErrorResponse } from '@/lib/api-error';

/**
 * 清理单个收藏夹的失效视频。
 *
 * 这里只发一次 clean 请求：B站自己会返回清理数量（data）。
 * 之前是在前后各查一次收藏夹列表来算差值，等于每个夹 3 次请求，
 * 批量清理时极易触发风控，已改为由调用方（前端）用整批刷新后的数量差回填。
 */
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

    // B站返回的清理数量（拿不到时由前端用刷新后的数量差计算）
    const cleaned = typeof response.data === 'number' ? response.data : null;

    // 诊断用：确认 clean 接口 data 字段的真实含义
    console.log(
      '[clean] media_id=%s code=%s data=%j cleaned=%j',
      mediaId,
      response.code,
      response.data,
      cleaned
    );

    return NextResponse.json({
      success: true,
      data: { cleaned },
    });
  } catch (error) {
    console.error('Clean API error:', error);
    return apiErrorResponse(error, 'Internal server error');
  }
}
