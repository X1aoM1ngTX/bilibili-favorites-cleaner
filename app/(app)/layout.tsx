import { AppSidebar, MobileNav } from '@/components/app-sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <AppSidebar />
      <MobileNav />

      <main className="min-h-0 flex-1 overflow-hidden lg:pl-64">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1320px] flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
