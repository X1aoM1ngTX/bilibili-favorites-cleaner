'use client';

import { Heart } from 'lucide-react';
import { NavBar } from '@/components/nav-bar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

        {/* Navigation */}
        <NavBar />

        {/* Page content */}
        {children}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-400">
          <p>Bilibili Favorites Cleaner &mdash; 仅供学习交流使用</p>
        </footer>
      </div>
    </div>
  );
}
