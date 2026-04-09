'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/use-app-store';
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

      setFavoriteFolders(result.data.list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载收藏夹失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userConfig, setFavoriteFolders]);

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

    setCleaning(true);
    setCleanResults([]);
    setError('');

    const folderIds = Array.from(selectedFolders);
    setCleanProgress({ current: 0, total: folderIds.length });

    try {
      const results: CleanResult[] = [];

      for (let i = 0; i < folderIds.length; i++) {
        const folderId = folderIds[i];
        const folder = favoriteFolders.find((f) => f.id === folderId);
        if (!folder) continue;

        setCleanProgress({ current: i + 1, total: folderIds.length });

        try {
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

          results.push({
            id: folderId,
            title: folder.title,
            count: result.data || 0,
            success: result.success,
            message: result.success
              ? `清理了 ${result.data || 0} 个失效视频`
              : result.error || '清理失败',
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

      setCleanResults(results);
      setSelectedFolders(new Set());
      loadFavoriteFolders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '清理失败';
      setError(errorMessage);
    } finally {
      setCleaning(false);
      setConfirmOpen(false);
    }
  };

  /* ---- Render: Loading skeleton ---- */
  if (loading) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bili-pink-50">
              <Trash2 className="h-5 w-5 text-bili-pink" />
            </div>
            <div>
              <CardTitle>清理失效视频</CardTitle>
              <p className="mt-0.5 text-sm text-gray-600">
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
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bili-pink-50">
              <Trash2 className="h-5 w-5 text-bili-pink" />
            </div>
            <div>
              <CardTitle>清理失效视频</CardTitle>
              <p className="mt-0.5 text-sm text-gray-600">
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
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bili-pink-50">
                <Trash2 className="h-5 w-5 text-bili-pink" />
              </div>
              <div>
                <CardTitle>清理失效视频</CardTitle>
                <p className="mt-0.5 text-sm text-gray-600">
                  选择收藏夹，批量清理其中的失效视频
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadFavoriteFolders}
              title="刷新列表"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Results banner */}
          {cleanResults.length > 0 && (
            <ResultBanner
              results={cleanResults}
              onDismiss={() => setCleanResults([])}
            />
          )}

          {/* Inline error */}
          {error && favoriteFolders.length > 0 && (
            <Alert variant="error">{error}</Alert>
          )}

          {/* Progress bar during cleaning */}
          {cleaning && (
            <ProgressBar
              current={cleanProgress.current}
              total={cleanProgress.total}
            />
          )}

          {/* Search + Actions bar */}
          {favoriteFolders.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Folder list */}
          {favoriteFolders.length > 0 ? (
            filteredFolders.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

          {/* Bottom info */}
          {favoriteFolders.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">
                共 {favoriteFolders.length} 个收藏夹
                {selectedCount > 0 && `，已选 ${selectedCount} 个`}
              </p>
              <p className="text-xs text-gray-500">
                总计 {formatNumber(favoriteFolders.reduce((s, f) => s + f.media_count, 0))} 个内容
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
        description={`即将清理 ${selectedCount} 个收藏夹中的失效视频，此操作不可撤销。是否继续？`}
        confirmText={`确认清理 (${selectedCount})`}
        loading={cleaning}
      />
    </>
  );
}
