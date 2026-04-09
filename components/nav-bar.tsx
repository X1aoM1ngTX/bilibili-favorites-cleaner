'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/use-app-store';
import {
  LogIn,
  Trash2,
  ArrowRightLeft,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '登录配置', icon: LogIn },
  { href: '/clean', label: '清理收藏夹', icon: Trash2 },
  { href: '/move', label: '移动视频', icon: ArrowRightLeft },
  { href: '/sort', label: '收藏夹排序', icon: ArrowUpDown },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const { isLoggedIn } = useAppStore();

  return (
    <div className="mb-8 flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-2xl bg-white/70 backdrop-blur-xl border border-gray-200/60 p-1.5 shadow-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const disabled = item.href !== '/' && !isLoggedIn;

          if (disabled) {
            return (
              <span
                key={item.href}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-gray-400 opacity-40 cursor-not-allowed select-none"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bili-pink/40',
                isActive
                  ? 'bg-bili-pink text-white shadow-md shadow-bili-pink/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
