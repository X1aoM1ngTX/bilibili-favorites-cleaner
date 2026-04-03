'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { VideoInfo, FavoriteFolder } from '@/types';
import { formatNumber, formatTimestamp } from '@/lib/utils';

const MAX_VIDEOS_PER_FOLDER = 1000;
const MAX_MOVE_PER_BATCH = 40;

interface MoveResult {
  success: boolean;
  count: number;
  message: string;
}

export function MovePanel() {
  const { userConfig, favoriteFolders, setFavoriteFolders } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [srcFolderId, setSrcFolderId] = useState<number | null>(null);
  const [tarFolderId, setTarFolderId] = useState<number | null>(null);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [moveResult, setMoveResult] = useState<MoveResult | null>(null);

  const loadFavoriteFolders = useCallback(async (silent = false) => {
    if (!userConfig) return;

    if (!silent) setLoading(true);
    if (!silent) setError('');

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

      setFavoriteFolders(result.data.list);
    } catch (err) {
      if (!silent) {
        const errorMessage = err instanceof Error ? err.message : '加载收藏夹失败';
        setError(errorMessage);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userConfig, setFavoriteFolders]);

  useEffect(() => {
    loadFavoriteFolders();
  }, [loadFavoriteFolders]);

  const loadVideos = async (folderId: number) => {
    if (!userConfig) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: folderId,
          cookie: userConfig.cookie,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '加载视频失败');
      }

      setVideos(result.data.medias || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载视频失败';
      setError(errorMessage);
    }
  };

  const handleSrcFolderChange = (folderId: number) => {
    setSrcFolderId(folderId);
    setSelectedVideos(new Set());
    setMoveResult(null);
    loadVideos(folderId);
  };

  const handleTarFolderChange = (folderId: number) => {
    setTarFolderId(folderId);
    setMoveResult(null);
  };

  const handleToggleVideo = (videoId: number) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      // 手动勾选也考虑目标容量
      const capacity = getCapacityInfo();
      const remaining = capacity ? capacity.remaining : MAX_MOVE_PER_BATCH;
      const limit = Math.min(MAX_MOVE_PER_BATCH, remaining);
      if (newSelected.size >= limit) {
        setError(`当前最多可选 ${limit} 个视频（单次上限 ${MAX_MOVE_PER_BATCH}，目标剩余容量 ${remaining}）`);
        return;
      }
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
    setError('');
    setMoveResult(null);
  };

  const handleToggleAllVideos = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      // 自动补差值：实际可选 = min(单次上限, 目标剩余容量, 源视频数)
      const capacity = getCapacityInfo();
      const remaining = capacity ? capacity.remaining : MAX_VIDEOS_PER_FOLDER;
      const limit = Math.min(MAX_MOVE_PER_BATCH, remaining, videos.length);
      const maxVideos = videos.slice(0, limit);
      setSelectedVideos(new Set(maxVideos.map((v) => v.id)));

      if (limit < videos.length) {
        const reasons: string[] = [];
        if (remaining < MAX_MOVE_PER_BATCH) reasons.push(`目标剩余容量 ${remaining}`);
        if (remaining >= MAX_MOVE_PER_BATCH && limit === MAX_MOVE_PER_BATCH) reasons.push(`单次上限 ${MAX_MOVE_PER_BATCH}`);
        setError(`已选择前 ${limit} 个视频（${reasons.join('，')}）`);
      }
    }
    setMoveResult(null);
  };

  // 容量检查
  const getCapacityInfo = () => {
    if (!tarFolderId) return null;
    const tarFolder = favoriteFolders.find((f) => f.id === tarFolderId);
    if (!tarFolder) return null;
    const remaining = MAX_VIDEOS_PER_FOLDER - tarFolder.media_count;
    return { current: tarFolder.media_count, remaining, max: MAX_VIDEOS_PER_FOLDER };
  };

  // 计算自动选择数量
  const getAutoSelectCount = () => {
    if (!tarFolderId || srcFolderId === tarFolderId) return 0;
    const capacity = getCapacityInfo();
    const remaining = capacity ? capacity.remaining : MAX_VIDEOS_PER_FOLDER;
    return Math.min(MAX_MOVE_PER_BATCH, remaining, videos.length);
  };

  // 一键移动：自动勾选最佳数量并直接执行
  const handleQuickMove = async () => {
    const count = getAutoSelectCount();
    if (count === 0) return;
    const ids = new Set(videos.slice(0, count).map((v) => v.id));
    setSelectedVideos(ids);
    // 直接执行移动
    if (!userConfig || !srcFolderId || !tarFolderId) return;

    setMoving(true);
    setError('');
    setMoveResult(null);

    try {
      const favRes = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ up_mid: userConfig.up_mid, cookie: userConfig.cookie }),
      });
      const favResult = await favRes.json();
      if (favResult.success) {
        setFavoriteFolders(favResult.data.list);
      }

      const latestTar = favResult.success
        ? favResult.data.list.find((f: FavoriteFolder) => f.id === tarFolderId)
        : null;
      const tarCount = latestTar ? latestTar.media_count : favoriteFolders.find((f) => f.id === tarFolderId)?.media_count ?? 0;
      const remaining = MAX_VIDEOS_PER_FOLDER - tarCount;

      if (count > remaining) {
        setError(
          `目标收藏夹容量已变化：还可容纳 ${remaining} 个，无法移动 ${count} 个`
        );
        setMoving(false);
        return;
      }
    } catch {
      // 刷新失败不阻塞
    }

    try {
      const resources = videos
        .slice(0, count)
        .map((v) => `${v.id}:2`)
        .join(',');

      const response = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resources,
          srcMediaId: srcFolderId,
          tarMediaId: tarFolderId,
          mid: userConfig.up_mid,
          cookie: userConfig.cookie,
          csrf: userConfig.csrf_token,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '移动失败');
      }

      setMoveResult({
        success: true,
        count,
        message: `成功移动 ${count} 个视频`,
      });

      loadVideos(srcFolderId);
      loadFavoriteFolders(true);
      setSelectedVideos(new Set());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '移动失败';
      setMoveResult({ success: false, count: 0, message: errorMessage });
    } finally {
      setMoving(false);
    }
  };

  const handleMove = async () => {
    if (!userConfig || !srcFolderId || !tarFolderId || selectedVideos.size === 0) return;

    if (srcFolderId === tarFolderId) {
      setError('源收藏夹和目标收藏夹不能相同');
      return;
    }

    setMoving(true);
    setError('');
    setMoveResult(null);

    // 执行前先刷新收藏夹数据，获取最新容量
    try {
      const favRes = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ up_mid: userConfig.up_mid, cookie: userConfig.cookie }),
      });
      const favResult = await favRes.json();
      if (favResult.success) {
        setFavoriteFolders(favResult.data.list);
      }

      // 用最新数据做容量检查
      const latestTar = favResult.success
        ? favResult.data.list.find((f: FavoriteFolder) => f.id === tarFolderId)
        : null;
      const tarCount = latestTar ? latestTar.media_count : favoriteFolders.find((f) => f.id === tarFolderId)?.media_count ?? 0;
      const remaining = MAX_VIDEOS_PER_FOLDER - tarCount;

      if (selectedVideos.size > remaining) {
        setError(
          `目标收藏夹剩余容量不足：还可容纳 ${remaining} 个视频，已选择 ${selectedVideos.size} 个`
        );
        setMoving(false);
        return;
      }
    } catch {
      // 刷新失败不阻塞，用已有数据继续
    }

    try {
      const resources = Array.from(selectedVideos)
        .map((id) => `${id}:2`)
        .join(',');

      const response = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resources,
          srcMediaId: srcFolderId,
          tarMediaId: tarFolderId,
          mid: userConfig.up_mid,
          cookie: userConfig.cookie,
          csrf: userConfig.csrf_token,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '移动失败');
      }

      setMoveResult({
        success: true,
        count: selectedVideos.size,
        message: `成功移动 ${selectedVideos.size} 个视频`,
      });

      // 刷新数据（静默，不触发 loading 状态）
      loadVideos(srcFolderId);
      loadFavoriteFolders(true);
      setSelectedVideos(new Set());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '移动失败';
      setMoveResult({ success: false, count: 0, message: errorMessage });
    } finally {
      setMoving(false);
    }
  };

  const capacity = getCapacityInfo();

  if (loading) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="mr-2" />
          <p className="text-lg text-gray-600">加载中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>移动视频</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {moveResult && (
          <Alert variant={moveResult.success ? 'success' : 'error'}>
            {moveResult.message}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              源收藏夹
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={srcFolderId || ''}
              onChange={(e) => handleSrcFolderChange(Number(e.target.value))}
              disabled={moving}
            >
              <option value="">请选择源收藏夹</option>
              {favoriteFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.title} ({formatNumber(folder.media_count)} 个视频)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              目标收藏夹
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={tarFolderId || ''}
              onChange={(e) => handleTarFolderChange(Number(e.target.value))}
              disabled={moving}
            >
              <option value="">请选择目标收藏夹</option>
              {favoriteFolders
                .filter((f) => f.id !== srcFolderId)
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title} ({formatNumber(folder.media_count)} 个视频)
                  </option>
                ))}
            </select>
            {capacity && (
              <p className="mt-1 text-xs text-gray-500">
                剩余容量：{capacity.remaining}/{capacity.max}
              </p>
            )}
          </div>
        </div>

        {srcFolderId && tarFolderId && videos.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-bili-pink/20 bg-bili-pink-50/50 p-3">
            <p className="text-sm text-gray-600">
              可自动移动 <span className="font-semibold text-gray-900">{getAutoSelectCount()}</span> 个视频到目标收藏夹
            </p>
            <Button
              variant="bili"
              size="sm"
              onClick={handleQuickMove}
              disabled={moving || getAutoSelectCount() === 0}
            >
              {moving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  移动中...
                </>
              ) : (
                `一键移动 (${getAutoSelectCount()})`
              )}
            </Button>
          </div>
        )}

        {srcFolderId && videos.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                共 {formatNumber(videos.length)} 个视频，已选 {selectedVideos.size} 个
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleToggleAllVideos}
                  variant="outline"
                  disabled={moving}
                >
                  {selectedVideos.size === videos.length ? '取消全选' : '全选'}
                </Button>
                <Button
                  onClick={handleMove}
                  disabled={
                    selectedVideos.size === 0 || !tarFolderId || moving
                  }
                >
                  {moving ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      移动中...
                    </>
                  ) : (
                    `移动选中的视频 (${selectedVideos.size})`
                  )}
                </Button>
              </div>
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`flex items-start gap-3 rounded-md border p-3 ${
                    selectedVideos.has(video.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVideos.has(video.id)}
                    onChange={() => handleToggleVideo(video.id)}
                    disabled={moving}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{video.title}</p>
                    <p className="text-sm text-gray-500">
                      {video.upper.name} · 收藏于{' '}
                      {formatTimestamp(video.fav_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {srcFolderId && videos.length === 0 && !loading && (
          <div className="py-8 text-center text-gray-500">该收藏夹暂无视频</div>
        )}

        {!srcFolderId && (
          <div className="py-8 text-center text-gray-500">请先选择源收藏夹</div>
        )}
      </CardContent>
    </Card>
  );
}
