import { NextRequest, NextResponse } from 'next/server';
import { BilibiliApi } from '@/lib/bilibili-api';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { up_mid, cookie, mediaId, pn, ps } = body;

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

      // B站对不存在的用户可能返回 code 0 + data:null，统一成空列表
      return NextResponse.json({
        success: true,
        data: {
          ...(response.data ?? {}),
          list: response.data?.list ?? [],
        },
      });
    }

    // Get favorite folder detail (video list)
    if (mediaId && cookie) {
      const api = new BilibiliApi(cookie);
      // B站单页最大 40 条
      const pageSize = Math.min(Math.max(Number(ps) || 40, 1), 40);
      const pageNumber = Math.max(Number(pn) || 1, 1);
      const response = await api.getFavoriteResources(
        mediaId,
        pageNumber,
        pageSize
      );

      if (response.code !== 0) {
        return NextResponse.json(
          { success: false, error: response.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...(response.data ?? {}),
          medias: response.data?.medias ?? [],
          has_more: response.data?.has_more ?? false,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'up_mid and cookie, or mediaId and cookie are required' },
      { status: 400 }
    );
  } catch (error) {
    return apiErrorResponse(error, 'Internal server error');
  }
}
