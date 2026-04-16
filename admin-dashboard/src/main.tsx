import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './index.css';
import { AppShell } from '@/components/layout/AppShell';
import { OverviewPage } from '@/pages/OverviewPage';
import { StationsPage } from '@/pages/StationsPage';
import { ChargersPage } from '@/pages/ChargersPage';
import { SchedulesPage } from '@/pages/SchedulesPage';
import { BulkPage } from '@/pages/BulkPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="/stations" element={<StationsPage />} />
            <Route path="/chargers" element={<ChargersPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/schedules/:chargerId" element={<SchedulesPage />} />
            <Route path="/bulk" element={<BulkPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" theme="dark" />
    </QueryClientProvider>
  </StrictMode>,
);
