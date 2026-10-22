import { NextRequest, NextResponse } from 'next/server';
import { BilibiliApi } from '@/lib/bilibili-api';

/** 申请二维码：GET /api/login/qrcode */
export async function GET() {
  try {
    const api = new BilibiliApi();
    const data = await api.generateQrCode();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '生成登录二维码失败';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/** 轮询扫码状态：POST /api/login/qrcode { qrcode_key } */
export async function POST(request: NextRequest) {
  try {
    const { qrcode_key } = await request.json();

    if (!qrcode_key || typeof qrcode_key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'qrcode_key is required' },
        { status: 400 }
      );
    }

    const api = new BilibiliApi();
    const data = await api.pollQrCode(qrcode_key);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '查询扫码状态失败';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
