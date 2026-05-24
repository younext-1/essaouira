import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function useAuthSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    async function syncUser() {
      if (!user) return;
      try {
        setSyncStatus('syncing');

        // Call the server-side sync API instead of writing directly to Supabase
        // from the browser. Direct writes fail because Supabase RLS requires
        // an authenticated session that the anon client doesn't have.
        const response = await fetch('/api/v1/users/sync-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.message || `Sync failed with status ${response.status}`);
        }

        setSyncStatus('success');
      } catch (err) {
        console.error('Error syncing Clerk user to Supabase:', err);
        setSyncStatus('error');
      }
    }

    syncUser();
  }, [user, isLoaded, isSignedIn]);

  return { syncStatus };
}
