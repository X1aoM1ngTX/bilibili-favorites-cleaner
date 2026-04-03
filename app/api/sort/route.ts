import { NextRequest, NextResponse } from 'next/server';
import { BilibiliApi } from '@/lib/bilibili-api';

export async function POST(request: NextRequest) {
  try {
    const { folderIds, cookie, csrf, mid } = await request.json();

    if (!folderIds || !Array.isArray(folderIds) || !cookie || !csrf || !mid) {
      return NextResponse.json(
        { success: false, error: 'folderIds (array), cookie, csrf, and mid are required' },
        { status: 400 }
      );
    }

    const api = new BilibiliApi(cookie);
    const sort = folderIds.join(',');
    const response = await api.sortFolders(sort, csrf, mid);

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
