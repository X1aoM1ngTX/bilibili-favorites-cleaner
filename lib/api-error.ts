import { NextResponse } from 'next/server';
import { BilibiliRateLimitError } from '@/lib/rate-limit';

/**
 * 统一的接口错误输出。
 * 命中 B 站风控时返回 429 + rateLimited 标记，前端据此立即中止后续批量任务。
 */
export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof BilibiliRateLimitError) {
    return NextResponse.json(
      { success: false, error: error.message, rateLimited: true },
      { status: 429 }
    );
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}
