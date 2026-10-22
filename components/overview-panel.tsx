'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { FavoriteFolder } from '@/types';
import { cn, formatNumber } from '@/lib/utils';
import { ChartColumn, RefreshCw } from 'lucide-react';

/** B站单个收藏夹上限 */
const FOLDER_CAPACITY = 1000;
/** 超过这个数量视为「接近上限」 */
const NEAR_THRESHOLD = 900;
/** 超过这个数量视为「中等占用」 */
const MID_THRESHOLD = 500;

export function OverviewPanel() {
  const { userConfig, favoriteFolders, setFavoriteFolders } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFavoriteFolders = useCallback(async () => {
    if (!userConfig) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          up_mid: userConfig.up_mid,
          cookie: userConfig.cookie,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '加载收藏夹失败');
      }

      setFavoriteFolders((result.data.list ?? []) as FavoriteFolder[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载收藏夹失败');
    } finally {
      setLoading(false);
    }
  }, [userConfig, setFavoriteFolders]);

  useEffect(() => {
    loadFavoriteFolders();
  }, [loadFavoriteFolders]);

  const stats = useMemo(() => {
    const total = favoriteFolders.length;
    const totalItems = favoriteFolders.reduce(
      (sum, folder) => sum + folder.media_count,
      0
    );

    return {
      total,
      totalItems,
      full: favoriteFolders.filter(
        (folder) => folder.media_count >= FOLDER_CAPACITY
      ).length,
      near: favoriteFolders.filter(
        (folder) =>
          folder.media_count >= NEAR_THRESHOLD &&
          folder.media_count < FOLDER_CAPACITY
      ).length,
      mid: favoriteFolders.filter(
        (folder) =>
          folder.media_count >= MID_THRESHOLD &&
          folder.media_count < NEAR_THRESHOLD
      ).length,
      low: favoriteFolders.filter(
        (folder) => folder.media_count > 0 && folder.media_count < MID_THRESHOLD
      ).length,
      empty: favoriteFolders.filter((folder) => folder.media_count === 0).length,
    };
  }, [favoriteFolders]);

  const ranked = useMemo(
    () => [...favoriteFolders].sort((a, b) => b.media_count - a.media_count),
    [favoriteFolders]
  );

  const segments = [
    { key: 'full', label: '已满', count: stats.full, color: 'bg-amber-600' },
    { key: 'near', label: '接近上限', count: stats.near, color: 'bg-amber-400' },
    { key: 'mid', label: '中等', count: stats.mid, color: 'bg-bili-pink' },
    { key: 'low', label: '宽松', count: stats.low, color: 'bg-bili-pink-200' },
    { key: 'empty', label: '空', count: stats.empty, color: 'bg-gray-200' },
  ];

  const tiles = [
    { label: '收藏夹', value: String(stats.total), warn: false },
    { label: '内容总数', value: formatNumber(stats.totalItems), warn: false },
    { label: '接近上限', value: String(stats.near), warn: stats.near > 0 },
    { label: '已满', value: String(stats.full), warn: stats.full > 0 },
  ];

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bili-pink-50">
              <ChartColumn className="h-5 w-5 text-bili-pink" />
            </div>
            <div>
              <CardTitle>数据概览</CardTitle>
              <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
                收藏夹容量分布与占用情况（上限 {FOLDER_CAPACITY} / 个）
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadFavoriteFolders()}
            title="刷新数据"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-6 pt-0">
        {error && (
          <Alert variant="error" className="shrink-0">
            {error}
          </Alert>
        )}

        {loading && favoriteFolders.length === 0 ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-gray-500">
            <Spinner className="h-5 w-5" />
            <span className="text-sm">正在加载收藏夹数据...</span>
          </div>
        ) : favoriteFolders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-gray-50/60 text-center">
            <ChartColumn className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">还没有可统计的收藏夹</p>
          </div>
        ) : (
          <>
            {/* 关键指标 */}
            <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                >
                  <p className="text-xs text-gray-500">{tile.label}</p>
                  <p
                    className={cn(
                      'mt-1 text-2xl font-semibold tabular-nums',
                      tile.warn ? 'text-amber-600' : 'text-gray-900'
                    )}
                  >
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>

            {/* 容量分布 */}
            <div className="shrink-0 rounded-xl border border-gray-100 px-4 py-3.5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-gray-700">容量分布</p>
                <p className="text-xs text-gray-400">
                  共 {formatNumber(stats.totalItems)} 个内容
                </p>
              </div>

              <div className="mt-3 flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-gray-100">
                {segments.map((segment) =>
                  segment.count > 0 ? (
                    <div
                      key={segment.key}
                      className={cn('h-full', segment.color)}
                      style={{ width: `${(segment.count / stats.total) * 100}%` }}
                      title={`${segment.label} ${segment.count} 个`}
                    />
                  ) : null
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {segments.map((segment) => (
                  <span
                    key={segment.key}
                    className="flex items-center gap-1.5 text-xs text-gray-500"
                  >
                    <span
                      className={cn('h-2 w-2 rounded-full', segment.color)}
                    />
                    {segment.label}
                    <span className="font-medium tabular-nums text-gray-700">
                      {segment.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {stats.full > 0 && (
              <Alert variant="warning" className="shrink-0">
                有 {stats.full} 个收藏夹已满（{FOLDER_CAPACITY}），无法再收藏新内容。
                <Link
                  href="/move"
                  className="ml-1 font-medium underline underline-offset-2 hover:text-amber-900"
                >
                  去移动视频
                </Link>
              </Alert>
            )}

            {/* 明细 */}
            <div className="flex shrink-0 items-baseline justify-between">
              <p className="text-sm font-medium text-gray-700">收藏夹占用</p>
              <p className="text-xs text-gray-400">按内容数排序</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-0.5">
                {ranked.map((folder) => {
                  const ratio = Math.min(1, folder.media_count / FOLDER_CAPACITY);
                  const isFull = folder.media_count >= FOLDER_CAPACITY;
                  const isNear =
                    !isFull && folder.media_count >= NEAR_THRESHOLD;

                  return (
                    <div
                      key={folder.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
                    >
                      <span
                        className="w-40 shrink-0 truncate text-sm text-gray-700 sm:w-52"
                        title={folder.title}
                      >
                        {folder.title}
                      </span>
                      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isFull
                              ? 'bg-amber-600'
                              : isNear
                                ? 'bg-amber-400'
                                : 'bg-bili-pink'
                          )}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-sm tabular-nums text-gray-600">
                        {formatNumber(folder.media_count)}
                      </span>
                      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-gray-400">
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
