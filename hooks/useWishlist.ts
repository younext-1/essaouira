import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { WishlistItem } from '@/types';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

const LOCAL_WISHLIST_KEY = 'mogador_local_wishlist';

function getLocalWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save wishlist to localStorage:', e);
  }
}

export function useWishlist() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // 1. Fetch Wishlist Items
  const { data: wishlist = [], isLoading: wishlistLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist', user?.id || 'anonymous'],
    queryFn: async () => {
      return getLocalWishlist();
    },
    staleTime: 5000,
  });

  // 2. Toggle Wishlist Mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const current = getLocalWishlist();
      const existingIdx = current.findIndex((item) => item.product_id === productId);

      let updated: WishlistItem[];
      let added = false;

      if (existingIdx >= 0) {
        // Remove
        updated = current.filter((item) => item.product_id !== productId);
        added = false;
      } else {
        // Add
        const prod = MOCK_PRODUCTS.find(p => p.id === productId);
        const newItem: WishlistItem = {
          id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          user_id: user?.id || 'guest',
          product_id: productId,
          created_at: new Date().toISOString(),
          products: prod || undefined,
        };
        updated = [newItem, ...current];
        added = true;
      }

      saveLocalWishlist(updated);
      return { productId, added, updated };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['wishlist', user?.id || 'anonymous'], result.updated);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.product_id === productId);
  };

  return {
    wishlist,
    loading: wishlistLoading,
    toggleWishlist: toggleWishlistMutation.mutateAsync,
    toggleWishlistLoading: toggleWishlistMutation.isPending,
    isInWishlist,
  };
}
