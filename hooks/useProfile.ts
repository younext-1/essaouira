'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

/**
 * Hook to manage fetching and updating a specific user profile
 */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const isClerkId = userId.startsWith('user_');
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq(isClerkId ? 'clerk_id' : 'id', userId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    const isClerkId = userId.startsWith('user_');
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq(isClerkId ? 'clerk_id' : 'id', userId)
      .select()
      .single();

    if (updateError) {
      return { error: updateError.message };
    }

    setProfile(data);
    return { data };
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}

