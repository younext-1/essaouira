'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthSync } from '@/hooks/useAuthSync';

function SyncTrigger({ children }: { children: React.ReactNode }) {
  useAuthSync(); // Triggers sync silently when authenticated
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds stale time
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SyncTrigger>{children}</SyncTrigger>
    </QueryClientProvider>
  );
}
