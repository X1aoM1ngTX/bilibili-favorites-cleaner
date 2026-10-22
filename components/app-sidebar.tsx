'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/use-app-store';
import {
  ArrowRightLeft,
  ArrowUpDown,
  ChartColumn,
  Gauge,
  Heart,
  LogIn,
  LogOut,
  Trash2,
  User,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: '登录配置', hint: '扫码 / Cookie', icon: LogIn },
  { href: '/clean', label: '清理收藏夹', hint: '批量清理失效视频', icon: Trash2 },
  { href: '/move', label: '移动视频', hint: '跨收藏夹转移', icon: ArrowRightLeft },
  { href: '/sort', label: '收藏夹排序', hint: '拖拽调整顺序', icon: ArrowUpDown },
  { href: '/overview', label: '数据概览', hint: '容量分布与占用', icon: ChartColumn },
] as const;

/** B站单个收藏夹上限 */
const FOLDER_CAPACITY = 1000;
/** 超过这个比例视为「接近上限」 */
const CAPACITY_WARN_RATIO = 0.9;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-bili-pink to-bili-pink-dark shadow-md shadow-bili-pink/25">
        <Heart className="h-4 w-4 text-white" fill="currentColor" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block font-semibold leading-tight text-gray-900',
            compact ? 'text-sm' : 'text-[15px]'
          )}
        >
          收藏夹清理
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">
          Bilibili Favorites
        </span>
      </span>
    </Link>
  );
}

/** 侧栏的容量监控：B站每个收藏夹上限 1000，接近上限才需要处理 */
function CapacityMonitor() {
  const { favoriteFolders } = useAppStore();

  // 只统计「即将到上限但还没满」的收藏夹；已满(1000)的单独计数
  const nearLimit = favoriteFolders
    .filter(
      (folder) =>
        folder.media_count >= FOLDER_CAPACITY * CAPACITY_WARN_RATIO &&
        folder.media_count < FOLDER_CAPACITY
    )
    .sort((a, b) => b.media_count - a.media_count)
    .slice(0, 3);

  const fullCount = favoriteFolders.filter(
    (folder) => folder.media_count >= FOLDER_CAPACITY
  ).length;

  return (
    <Link
      href="/overview"
      className="mt-6 block rounded-xl border border-gray-100 bg-gray-50/80 p-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
    >
      <p className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        <span className="flex items-center gap-1.5">
          <Gauge className="h-3 w-3" />
          容量监控
        </span>
        <span aria-hidden className="text-gray-300">
          →
        </span>
      </p>

      {nearLimit.length === 0 && fullCount === 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          所有收藏夹都还在安全水位
        </p>
      ) : (
        <>
          {nearLimit.length > 0 && (
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
              <span className="font-semibold text-amber-600">
                {nearLimit.length}
              </span>{' '}
              个即将到上限
            </p>
          )}
          <ul className="mt-2 space-y-2">
            {nearLimit.map((folder) => {
              const ratio = Math.min(1, folder.media_count / FOLDER_CAPACITY);

              return (
                <li key={folder.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] text-gray-600">
                      {folder.title}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-amber-600">
                      {formatNumber(folder.media_count)}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {fullCount > 0 && (
            <p className="mt-2 text-[11px] text-gray-400">
              另有{' '}
              <span className="font-medium text-amber-600">{fullCount}</span>{' '}
              个已满，无法再收藏
            </p>
          )}
        </>
      )}
    </Link>
  );
}

function AccountBlock() {
  const router = useRouter();
  const { userConfig, isLoggedIn, logout } = useAppStore();

  if (!isLoggedIn || !userConfig) {
    return (
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <LogIn className="h-3.5 w-3.5" />
        </span>
        未登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bili-pink-100 text-bili-pink-dark">
        <User className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-wide text-gray-400">
          UID
        </span>
        <span className="block truncate text-xs font-medium tabular-nums text-gray-700">
          {userConfig.up_mid}
        </span>
      </span>
      <button
        type="button"
        title="退出登录"
        aria-label="退出登录"
        onClick={() => {
          logout();
          router.push('/');
        }}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function navItemClasses(active: boolean, disabled: boolean) {
  return cn(
    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
    active
      ? 'bg-bili-pink-50 font-medium text-bili-pink-dark'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
    disabled && 'pointer-events-none opacity-40'
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isLoggedIn, favoriteFolders } = useAppStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200/70 bg-white/85 backdrop-blur-xl lg:flex">
      <div className="px-5 pb-5 pt-6">
        <Brand />
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          工作台
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const disabled = item.href !== '/' && !isLoggedIn;

            const content = (
              <>
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-bili-pink" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </>
            );

            return (
              <li key={item.href}>
                {disabled ? (
                  <span className={navItemClasses(false, true)}>{content}</span>
                ) : (
                  <Link
                    href={item.href}
                    className={navItemClasses(active, false)}
                    title={item.hint}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {isLoggedIn && favoriteFolders.length > 0 && <CapacityMonitor />}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <AccountBlock />
        <p className="px-2 pt-2 text-[10px] text-gray-300">
          仅供学习交流使用
        </p>
      </div>
    </aside>
  );
}

/** 窄屏用的顶部导航 */
export function MobileNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAppStore();

  return (
    <div className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Brand compact />
        <AccountBlock />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const disabled = item.href !== '/' && !isLoggedIn;

          const className = cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
            active
              ? 'bg-bili-pink-50 font-medium text-bili-pink-dark'
              : 'text-gray-500 hover:bg-gray-50',
            disabled && 'pointer-events-none opacity-40'
          );

          return disabled ? (
            <span key={item.href} className={className}>
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </span>
          ) : (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
