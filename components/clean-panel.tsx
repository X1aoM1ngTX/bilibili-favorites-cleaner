'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { FavoriteFolder } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { formatNumber } from '@/lib/utils';
import {
  FolderOpen,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
  Inbox,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

interface CleanResult {
  id: number;
  title: string;
  count: number;
  success: boolean;
  message?: string;
  /** B站 clean 接口自己返回的清理数量，刷新失败时作为兜底 */
  serverCleaned?: number | null;
  /** 数量还没同步回来，界面显示“同步中” */
  pending?: boolean;
}

/** B站收藏夹数量有同步延迟，清理结束后分几次回查 */
const CLEAN_SYNC_DELAYS = [2500, 6000, 12000];

/** 用「清理前快照 - 刷新后数量」回填每个夹的清理数量 */
function resolveCounts(
  list: FavoriteFolder[] | null,
  results: CleanResult[],
  beforeCounts: Map<number, number>
): CleanResult[] {
  return results.map((item) => {
    if (!item.success) return item;

    const before = beforeCounts.get(item.id);
    const after = list?.find((folder) => folder.id === item.id)?.media_count;

    let count = item.serverCleaned ?? 0;
    if (before !== undefined && after !== undefined) {
      count = Math.max(count, before - after);
    }

    const hasServerCount = typeof item.serverCleaned === 'number';
    const pending = count === 0 && !hasServerCount;

    return {
      ...item,
      count,
      pending,
      message: pending
        ? '清理完成，数量同步中…'
        : count > 0
          ? `清理了 ${count} 个失效视频`
          : '未发现失效视频',
    };
  });
}

/* ---------- Skeleton Loader ---------- */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="h-5 w-5 rounded bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/5 rounded bg-gray-200" />
        <div className="h-3 w-1/4 rounded bg-gray-100" />
      </div>
      <div className="h-4 w-8 rounded bg-gray-100" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/* ---------- Empty State ---------- */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bili-pink-50">
        <Inbox className="h-8 w-8 text-bili-pink" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">暂无收藏夹</h3>
      <p className="mt-1 text-sm text-gray-600">您还没有创建任何收藏夹</p>
    </div>
  );
}

/* ---------- Error State ---------- */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">加载失败</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-600">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        重新加载
      </Button>
    </div>
  );
}

/* ---------- Confirm Dialog ---------- */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                清理中...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Progress Bar ---------- */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          正在清理... {current}/{total}
        </span>
        <span className="font-medium text-bili-pink">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-bili-pink to-bili-pink-dark transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- Result Banner ---------- */
function ResultBanner({
  results,
  onDismiss,
}: {
  results: CleanResult[];
  onDismiss: () => void;
}) {
  const totalCount = results.reduce((sum, r) => sum + r.count, 0);
  const allSuccess = results.every((r) => r.success);
  const hasError = results.some((r) => !r.success);

  return (
    <div
      className={`rounded-xl border p-4 ${
        allSuccess
          ? 'bg-emerald-50 border-emerald-200'
          : hasError
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {allSuccess ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            <span
              className={`font-semibold ${
                allSuccess ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              清理完成
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {results.map((result) => (
              <div key={result.id} className="flex items-center gap-2 text-sm">
                {result.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                )}
                <span className="text-gray-700 truncate">{result.title}</span>
                <span className="text-gray-500 shrink-0">
                  {result.message}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600">
            共清理 {totalCount} 个失效视频
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Folder List Item ---------- */
function FolderItem({
  folder,
  selected,
  onToggle,
  disabled,
}: {
  folder: { id: number; title: string; media_count: number; attr: number };
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const isDefault = folder.attr === 0;

  return (
    <div
      onClick={disabled ? undefined : onToggle}
      className={`group relative flex flex-col items-center rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none ${
        selected
          ? 'border-bili-pink/40 bg-bili-pink-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
      } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Checkbox + Default badge */}
      <div className="mb-2 flex w-full items-center justify-between">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ${
            selected
              ? 'border-bili-pink bg-bili-pink'
              : 'border-gray-300 group-hover:border-gray-400'
          }`}
        >
          {selected && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        {isDefault && (
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
            默认
          </span>
        )}
      </div>

      {/* Folder Icon */}
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200 ${
          selected ? 'bg-bili-pink/15' : 'bg-gray-50 group-hover:bg-gray-100'
        }`}
      >
        <FolderOpen
          className={`h-6 w-6 transition-colors duration-200 ${
            selected ? 'text-bili-pink' : 'text-gray-400 group-hover:text-gray-500'
          }`}
        />
      </div>

      {/* Content */}
      <div className="w-full min-w-0 text-center">
        <p className="truncate text-sm font-medium text-gray-900">{folder.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatNumber(folder.media_count)} 个内容
        </p>
      </div>
    </div>
  );
}

/* ---------- Main CleanPanel ---------- */
export function CleanPanel() {
  const { userConfig, favoriteFolders, setFavoriteFolders } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<number>>(new Set());
  const [cleanResults, setCleanResults] = useState<CleanResult[]>([]);
  const [cleanProgress, setCleanProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  /** 每轮清理一个编号，用于丢弃过期的延迟刷新结果 */
  const cleanRunRef = useRef(0);

  const loadFavoriteFolders = useCallback(
    async (silent = false): Promise<FavoriteFolder[] | null> => {
      if (!userConfig) return null;

      if (!silent) {
        setLoading(true);
        setError('');
      }

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

        const list = (result.data.list ?? []) as FavoriteFolder[];
        setFavoriteFolders(list);
        return list;
      } catch (err) {
        if (!silent) {
          const errorMessage =
            err instanceof Error ? err.message : '加载收藏夹失败';
          setError(errorMessage);
        }
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userConfig, setFavoriteFolders]
  );

  useEffect(() => {
    loadFavoriteFolders();
  }, [loadFavoriteFolders]);

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return favoriteFolders;
    const q = searchQuery.toLowerCase();
    return favoriteFolders.filter((f) =>
      f.title.toLowerCase().includes(q)
    );
  }, [favoriteFolders, searchQuery]);

  const isAllSelected =
    favoriteFolders.length > 0 && selectedFolders.size === favoriteFolders.length;
  const selectedCount = selectedFolders.size;

  const handleToggleFolder = (id: number) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFolders(newSelected);
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(favoriteFolders.map((f) => f.id)));
    }
  };

  const handleClean = async () => {
    if (!userConfig || selectedFolders.size === 0) return;

    const runId = ++cleanRunRef.current;

    setCleaning(true);
    setCleanResults([]);
    setError('');

    const folderIds = Array.from(selectedFolders);
    // 清理前的数量快照（来自当前列表，不额外发请求）
    const beforeCounts = new Map<number, number>(
      favoriteFolders
        .filter((folder) => selectedFolders.has(folder.id))
        .map((folder) => [folder.id, folder.media_count] as [number, number])
    );

    setCleanProgress({ current: 0, total: folderIds.length });

    const results: CleanResult[] = [];
    let rateLimited = false;

    for (let i = 0; i < folderIds.length; i++) {
      const folderId = folderIds[i];
      const folder = favoriteFolders.find((f) => f.id === folderId);
      if (!folder) continue;

      setCleanProgress({ current: i + 1, total: folderIds.length });

      try {
        // 服务端已做串行限速（写请求间隔约 3 秒），这里不再额外 sleep
        const response = await fetch('/api/clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId: folderId,
            cookie: userConfig.cookie,
            csrf: userConfig.csrf_token,
          }),
        });

        const result = await response.json();

        // 命中限流：立刻停止剩余任务，避免把账号风险放大
        if (result.rateLimited) {
          rateLimited = true;
          results.push({
            id: folderId,
            title: folder.title,
            count: 0,
            success: false,
            message: result.error || '触发 B 站限流',
          });
          break;
        }

        results.push({
          id: folderId,
          title: folder.title,
          count: 0,
          success: result.success,
          message: result.success ? '' : result.error || '清理失败',
          serverCleaned: result.data?.cleaned ?? null,
        });
      } catch {
        results.push({
          id: folderId,
          title: folder.title,
          count: 0,
          success: false,
          message: '请求失败',
        });
      }
    }

    // 整批只刷新一次列表，用「清理前快照 - 清理后数量」回填每个夹清理了多少
    const latest = await loadFavoriteFolders(true);
    setCleanResults(resolveCounts(latest, results, beforeCounts));
    setSelectedFolders(new Set());
    setCleaning(false);
    setConfirmOpen(false);

    // B站数量同步有延迟：分几次回查，数量对上了就自动更新界面
    if (results.some((item) => item.success)) {
      CLEAN_SYNC_DELAYS.forEach((delay) => {
        setTimeout(async () => {
          if (cleanRunRef.current !== runId) return;

          const refreshed = await loadFavoriteFolders(true);
          if (cleanRunRef.current !== runId) return;

          setCleanResults((current) =>
            current.length === 0
              ? current
              : resolveCounts(refreshed, current, beforeCounts)
          );
        }, delay);
      });
    }

    if (rateLimited) {
      setError(
        '已触发 B 站接口限流，剩余收藏夹已跳过。建议等待 5-30 分钟后再试，期间避免频繁刷新。'
      );
    }
  };

  /* ---- Render: Loading skeleton ---- */
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bili-pink-50">
              <Trash2 className="h-5 w-5 text-bili-pink" />
            </div>
            <div>
              <CardTitle>清理失效视频</CardTitle>
              <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
                选择收藏夹，批量清理其中的失效视频
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-4 text-gray-600">
            <Spinner className="h-5 w-5" />
            <span className="text-sm">正在加载收藏夹...</span>
          </div>
          <SkeletonList />
        </CardContent>
      </Card>
    );
  }

  /* ---- Render: Error state ---- */
  if (error && favoriteFolders.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bili-pink-50">
              <Trash2 className="h-5 w-5 text-bili-pink" />
            </div>
            <div>
              <CardTitle>清理失效视频</CardTitle>
              <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
                选择收藏夹，批量清理其中的失效视频
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ErrorState message={error} onRetry={loadFavoriteFolders} />
        </CardContent>
      </Card>
    );
  }

  /* ---- Render: Main UI ---- */
  return (
    <>
      <Card className="flex h-full w-full flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bili-pink-50">
                <Trash2 className="h-5 w-5 text-bili-pink" />
              </div>
              <div>
                <CardTitle>清理失效视频</CardTitle>
                <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
                  选择收藏夹，批量清理其中的失效视频
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadFavoriteFolders()}
              title="刷新列表"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-6 pt-0">
          {/* Results banner */}
          {cleanResults.length > 0 && (
            <div className="shrink-0">
              <ResultBanner
                results={cleanResults}
                onDismiss={() => setCleanResults([])}
              />
            </div>
          )}

          {/* Inline error */}
          {error && favoriteFolders.length > 0 && (
            <Alert variant="error" className="shrink-0">
              {error}
            </Alert>
          )}

          {/* Progress bar during cleaning */}
          {cleaning && (
            <div className="shrink-0">
              <ProgressBar
                current={cleanProgress.current}
                total={cleanProgress.total}
              />
            </div>
          )}

          {/* Search + Actions bar */}
          {favoriteFolders.length > 0 && (
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索收藏夹..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-bili-pink/40 focus:outline-none focus:ring-2 focus:ring-bili-pink/20 transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleToggleAll}
                  variant="outline"
                  size="sm"
                  disabled={cleaning}
                >
                  {isAllSelected ? '取消全选' : '全选'}
                </Button>

                <Button
                  variant="bili"
                  size="sm"
                  disabled={selectedCount === 0 || cleaning}
                  onClick={() => setConfirmOpen(true)}
                  className={`transition-all duration-200 ${
                    selectedCount > 0
                      ? ''
                      : 'opacity-50'
                  }`}
                >
                  {cleaning ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      清理中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      清理选中{selectedCount > 0 ? ` (${selectedCount})` : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Folder list（只有这一块滚动） */}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {favoriteFolders.length > 0 ? (
              filteredFolders.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {filteredFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      selected={selectedFolders.has(folder.id)}
                      onToggle={() => handleToggleFolder(folder.id)}
                      disabled={cleaning}
                    />
                  ))}
                  {searchQuery && filteredFolders.length < favoriteFolders.length && (
                    <p className="col-span-full py-2 text-center text-xs text-gray-500">
                      显示 {filteredFolders.length} / {favoriteFolders.length} 个收藏夹
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <Search className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-600">
                    未找到匹配「{searchQuery}」的收藏夹
                  </p>
                </div>
              )
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Bottom info */}
          {favoriteFolders.length > 0 && (
            <div className="shrink-0 space-y-1 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  共 {favoriteFolders.length} 个收藏夹
                  {selectedCount > 0 && `，已选 ${selectedCount} 个`}
                </p>
                <p className="text-xs text-gray-500">
                  总计{' '}
                  {formatNumber(
                    favoriteFolders.reduce((s, f) => s + f.media_count, 0)
                  )}{' '}
                  个内容
                </p>
              </div>
              <p className="text-[11px] text-gray-400">
                批量清理会逐个执行并自动限速（约 3 秒/个），以规避 B
                站风控；命中限流会立即停止剩余任务。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => !cleaning && setConfirmOpen(false)}
        onConfirm={handleClean}
        title="确认清理失效视频"
        description={`即将清理 ${selectedCount} 个收藏夹中的失效视频，此操作不可撤销。为避免触发 B 站风控，任务会逐个执行，预计约 ${Math.ceil(
          selectedCount * 3.3
        )} 秒。`}
        confirmText={`确认清理 (${selectedCount})`}
        loading={cleaning}
      />
    </>
  );
}
