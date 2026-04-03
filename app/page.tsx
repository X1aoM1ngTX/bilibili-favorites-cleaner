'use client';

import { useAppStore } from '@/store/use-app-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoginPanel } from '@/components/login-panel';
import { CleanPanel } from '@/components/clean-panel';
import { MovePanel } from '@/components/move-panel';
import { SortPanel } from '@/components/sort-panel';
import {
  LogIn,
  Trash2,
  ArrowRightLeft,
  ArrowUpDown,
  Heart,
} from 'lucide-react';

const tabs = [
  { value: 'login', label: '登录配置', icon: LogIn },
  { value: 'clean', label: '清理收藏夹', icon: Trash2 },
  { value: 'move', label: '移动视频', icon: ArrowRightLeft },
  { value: 'sort', label: '收藏夹排序', icon: ArrowUpDown },
] as const;

export default function HomePage() {
  const { isLoggedIn } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-bili-pink-50 via-white to-purple-50/30">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-bili-pink/5 blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-purple-200/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-bili-pink to-bili-pink-dark shadow-lg shadow-bili-pink/25">
              <Heart className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              哔哩哔哩收藏夹清理工具
            </h1>
          </div>
          <p className="text-sm text-gray-500 sm:text-base">
            批量清理失效视频，轻松管理您的收藏夹
          </p>
        </header>

        {/* Navigation Tabs */}
        <Tabs defaultValue={isLoggedIn ? 'clean' : 'login'}>
          <div className="mb-8 flex justify-center">
            <TabsList>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const disabled =
                  tab.value !== 'login' && !isLoggedIn;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    disabled={disabled}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="login">
            <LoginPanel />
          </TabsContent>

          <TabsContent value="clean">
            <CleanPanel />
          </TabsContent>

          <TabsContent value="move">
            <MovePanel />
          </TabsContent>

          <TabsContent value="sort">
            <SortPanel />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-400">
          <p>Bilibili Favorites Cleaner &mdash; 仅供学习交流使用</p>
        </footer>
      </div>
    </div>
  );
}
