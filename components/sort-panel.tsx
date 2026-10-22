'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { FavoriteFolder } from '@/types';
import { formatNumber } from '@/lib/utils';
import { ArrowUpDown, GripVertical } from 'lucide-react';

export function SortPanel() {
  const { userConfig } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [sortedFolders, setSortedFolders] = useState<FavoriteFolder[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

      setSortedFolders(result.data.list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载收藏夹失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userConfig]);

  useEffect(() => {
    loadFavoriteFolders();
  }, [loadFavoriteFolders]);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === targetId) return;

    const draggedFolder = sortedFolders.find((f) => f.id === draggedItem);
    const targetFolder = sortedFolders.find((f) => f.id === targetId);

    if (!draggedFolder || !targetFolder) return;

    // 默认收藏夹不能移动
    if (draggedFolder.attr === 0) {
      setError('默认收藏夹无法移动，始终保持在第一位');
      setDraggedItem(null);
      return;
    }

    // 不能拖到默认收藏夹前面
    const targetIndex = sortedFolders.findIndex((f) => f.id === targetId);
    const defaultIndex = sortedFolders.findIndex((f) => f.attr === 0);
    if (defaultIndex !== -1 && targetIndex === defaultIndex) {
      setError('不能将收藏夹拖到默认收藏夹前面');
      setDraggedItem(null);
      return;
    }

    const draggedIndex = sortedFolders.findIndex((f) => f.id === draggedItem);

    const newFolders = [...sortedFolders];
    newFolders.splice(draggedIndex, 1);
    newFolders.splice(targetIndex, 0, draggedFolder);

    setSortedFolders(newFolders);
    setDraggedItem(null);
    setError('');
    setSuccessMsg('');
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSaveSort = async () => {
    if (!userConfig || sortedFolders.length === 0) return;

    setSorting(true);
    setError('');
    setSuccessMsg('');

    try {
      const folderIds = sortedFolders.map((f) => f.id);

      const response = await fetch('/api/sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderIds,
          cookie: userConfig.cookie,
          csrf: userConfig.csrf_token,
          mid: userConfig.up_mid,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '排序失败');
      }

      setSuccessMsg('排序保存成功！');
      loadFavoriteFolders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '排序失败';
      setError(errorMessage);
    } finally {
      setSorting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="mr-2" />
          <p className="text-lg text-gray-600">加载中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bili-pink-50">
            <ArrowUpDown className="h-5 w-5 text-bili-pink" />
          </div>
          <div>
            <CardTitle>收藏夹排序</CardTitle>
            <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
              拖拽调整显示顺序，默认收藏夹固定第一位
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-6 pt-0">
        {error && (
          <Alert variant="error" className="shrink-0">
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert variant="success" className="shrink-0">
            {successMsg}
          </Alert>
        )}

        <Alert variant="warning" className="shrink-0">
          拖拽收藏夹来调整顺序。默认收藏夹无法移动，始终保持在第一位。一次最多排序 20 个收藏夹。
        </Alert>

        <div className="flex shrink-0 justify-end">
          <Button
            variant="bili"
            onClick={handleSaveSort}
            disabled={sorting || sortedFolders.length === 0}
          >
            {sorting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                保存中...
              </>
            ) : (
              '保存排序'
            )}
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {sortedFolders.map((folder) => (
            <div
              key={folder.id}
              draggable={folder.attr !== 0}
              onDragStart={(e) => handleDragStart(e, folder.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, folder.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                draggedItem === folder.id
                  ? 'border-bili-pink/50 bg-bili-pink-50'
                  : folder.attr === 0
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white cursor-move hover:bg-gray-50/60'
              }`}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                  {folder.title}
                  {folder.attr === 0 && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                      默认
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-gray-500">
                {formatNumber(folder.media_count)} 个视频
              </span>
            </div>
          ))}
        </div>

        {sortedFolders.length === 0 && (
          <div className="py-8 text-center text-gray-500">暂无收藏夹</div>
        )}
      </CardContent>
    </Card>
  );
}
