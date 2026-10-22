/**
 * B站接口节流与重试。
 *
 * 背景：B站对收藏夹相关接口有风控，短时间内大量请求会返回 -509 / -352 / -412，
 * 触发后可能出现「收藏夹详情拿不到视频」这类持续数小时甚至半天的情况。
 *
 * 策略：
 * 1. 所有出站请求串行执行，保证最小间隔（读 800ms / 写 3000ms）；
 * 2. 同时限制每分钟总量（读 45 次 / 写 12 次），防止某个循环长时间刷接口；
 * 3. 命中风控码时按 5s、15s 退避重试，最多 2 次；
 * 4. 重试仍失败则抛出 BilibiliRateLimitError，由上层立即中止后续任务，避免继续加压。
 *
 * 以上参数均可用环境变量覆盖：
 *   BILI_READ_INTERVAL_MS / BILI_WRITE_INTERVAL_MS
 *   BILI_READ_MAX_PER_MINUTE / BILI_WRITE_MAX_PER_MINUTE / BILI_MAX_RETRIES
 */

export type RequestBucket = 'read' | 'write';

export class BilibiliRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BilibiliRateLimitError';
  }
}

function readEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const READ_INTERVAL_MS = readEnvInt('BILI_READ_INTERVAL_MS', 800);
const WRITE_INTERVAL_MS = readEnvInt('BILI_WRITE_INTERVAL_MS', 3000);
const READ_MAX_PER_MINUTE = readEnvInt('BILI_READ_MAX_PER_MINUTE', 45);
const WRITE_MAX_PER_MINUTE = readEnvInt('BILI_WRITE_MAX_PER_MINUTE', 12);
const MAX_RETRIES = readEnvInt('BILI_MAX_RETRIES', 2);
const BACKOFF_MS = [5000, 15000];
const WINDOW_MS = 60_000;

interface BucketPolicy {
  interval: number;
  maxPerWindow: number;
}

const POLICY: Record<RequestBucket, BucketPolicy> = {
  read: { interval: READ_INTERVAL_MS, maxPerWindow: READ_MAX_PER_MINUTE },
  write: { interval: WRITE_INTERVAL_MS, maxPerWindow: WRITE_MAX_PER_MINUTE },
};

/** B站风控/限流相关返回码 */
const RATE_LIMIT_CODES = new Set([-509, -352, -412, -799]);

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastRequestAt = 0;
let queue: Promise<void> = Promise.resolve();

/** 每个类型最近一分钟内的请求时间戳，用于总量上限 */
const history: Record<RequestBucket, number[]> = { read: [], write: [] };

/**
 * 串行化所有出站请求，并同时保证：
 * 1. 相邻两次请求的间隔不小于该类型的最小间隔；
 * 2. 每分钟请求数不超过上限（防止某个循环长时间刷接口）。
 * 写入(clean/move/sort)比读取更敏感，所以间隔更长、上限更低。
 */
export async function throttleBilibiliRequest(
  bucket: RequestBucket
): Promise<void> {
  const policy = POLICY[bucket];

  const task = queue.then(async () => {
    const now = Date.now();
    const recent = history[bucket].filter((stamp) => now - stamp < WINDOW_MS);
    history[bucket] = recent;

    // 一分钟内的额度用完了，等到最早的一条过期
    if (recent.length >= policy.maxPerWindow) {
      const waitUntil = recent[0] + WINDOW_MS;
      await sleep(Math.max(0, waitUntil - Date.now()));
    }

    const gap = lastRequestAt + policy.interval - Date.now();
    if (gap > 0) {
      await sleep(gap);
    }

    const stamp = Date.now();
    lastRequestAt = stamp;
    history[bucket].push(stamp);
  });

  // 队列不能被失败的任务卡死
  queue = task.catch(() => undefined);
  await task;
}

export function isRateLimitCode(code: unknown): boolean {
  return typeof code === 'number' && RATE_LIMIT_CODES.has(code);
}

/**
 * 带节流与退避重试的请求包装器。
 * @param bucket 请求类型，决定最小间隔
 * @param request 真正发起请求的函数，返回 B站标准响应体
 */
export async function requestWithRateLimit<T>(
  bucket: RequestBucket,
  request: () => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await throttleBilibiliRequest(bucket);

    try {
      const result = await request();
      const code = (result as { code?: unknown } | null)?.code;

      if (!isRateLimitCode(code)) {
        return result;
      }

      if (attempt >= MAX_RETRIES) {
        throw new BilibiliRateLimitError(
          `B站接口限流（code ${code}），已暂停操作。请等待 5-30 分钟后再试。`
        );
      }

      await sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]);
    } catch (error) {
      if (error instanceof BilibiliRateLimitError) {
        throw error;
      }

      const status = (error as { response?: { status?: number } })?.response
        ?.status;

      // B站被风控时有时直接返回 HTTP 412
      if (status === 412 || status === 429) {
        if (attempt >= MAX_RETRIES) {
          throw new BilibiliRateLimitError(
            `B站风控拦截（HTTP ${status}），已暂停操作。请等待 5-30 分钟后再试。`
          );
        }
        await sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]);
        continue;
      }

      throw error;
    }
  }
}
