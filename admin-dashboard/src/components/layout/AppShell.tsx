import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';

export const AppShell = () => {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background bg-gradient-brand">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar onOpenCommand={() => setCmdOpen(true)} />
        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
};
