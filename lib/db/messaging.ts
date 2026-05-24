// Database Helpers: lib/db/messaging.ts
// Handles database CRUD operations for the multi-vendor Messaging & Chat System (P1).

import { createClient } from '@/lib/supabase/server';
import type { ChatThread, ChatMessage, CreateMessageInput } from '@/types/messaging.types';

/**
 * Fetches a specific chat thread by ID, including hydrated buyer, seller, and store data.
 */
export async function getThreadById(threadId: string): Promise<ChatThread | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_threads')
    .select(`
      id,
      buyer_id,
      seller_id,
      store_id,
      child_order_id,
      created_at,
      updated_at,
      buyer:profiles!buyer_id(id, full_name, avatar_url, role),
      seller:profiles!seller_id(id, full_name, avatar_url, role),
      store:stores(id, name, slug, logo_url)
    `)
    .eq('id', threadId)
    .maybeSingle();

  if (error) {
    console.error('🔴 Error in getThreadById:', error);
    throw new Error(`Failed to retrieve chat thread: ${error.message}`);
  }

  return data as unknown as ChatThread | null;
}

/**
 * Gets an existing thread for a buyer and store (with optional order context),
 * or creates a new one if it doesn't exist.
 */
export async function getOrCreateThread(
  buyerId: string,
  storeId: string,
  sellerId: string,
  childOrderId: string | null = null
): Promise<ChatThread> {
  const supabase = await createClient();

  // 1. Try to find an existing thread with the matching context
  let query = supabase
    .from('chat_threads')
    .select(`
      id,
      buyer_id,
      seller_id,
      store_id,
      child_order_id,
      created_at,
      updated_at,
      buyer:profiles!buyer_id(id, full_name, avatar_url, role),
      seller:profiles!seller_id(id, full_name, avatar_url, role),
      store:stores(id, name, slug, logo_url)
    `)
    .eq('buyer_id', buyerId)
    .eq('store_id', storeId);

  if (childOrderId) {
    query = query.eq('child_order_id', childOrderId);
  } else {
    query = query.is('child_order_id', null);
  }

  const { data: existing, error: findError } = await query.maybeSingle();

  if (findError) {
    console.error('🔴 Error finding thread in getOrCreateThread:', findError);
    throw new Error(`Failed to query thread: ${findError.message}`);
  }

  if (existing) {
    return existing as unknown as ChatThread;
  }

  // 2. If it doesn't exist, insert a new thread
  const insertPayload = {
    buyer_id: buyerId,
    store_id: storeId,
    seller_id: sellerId,
    child_order_id: childOrderId || null
  };

  const { data: created, error: insertError } = await supabase
    .from('chat_threads')
    .insert(insertPayload)
    .select(`
      id,
      buyer_id,
      seller_id,
      store_id,
      child_order_id,
      created_at,
      updated_at,
      buyer:profiles!buyer_id(id, full_name, avatar_url, role),
      seller:profiles!seller_id(id, full_name, avatar_url, role),
      store:stores(id, name, slug, logo_url)
    `)
    .single();

  if (insertError) {
    console.error('🔴 Error inserting thread in getOrCreateThread:', insertError);
    throw new Error(`Failed to create thread: ${insertError.message}`);
  }

  return created as unknown as ChatThread;
}

/**
 * Retrieves all chat threads for a specific profile (buyer or seller),
 * sorted by updated_at DESC, with hydrated details and last message details.
 */
export async function getThreadsForUser(profileId: string): Promise<ChatThread[]> {
  const supabase = await createClient();

  // 1. Fetch threads where the user is buyer or seller
  const { data: threads, error: threadsError } = await supabase
    .from('chat_threads')
    .select(`
      id,
      buyer_id,
      seller_id,
      store_id,
      child_order_id,
      created_at,
      updated_at,
      buyer:profiles!buyer_id(id, full_name, avatar_url, role),
      seller:profiles!seller_id(id, full_name, avatar_url, role),
      store:stores(id, name, slug, logo_url)
    `)
    .or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`)
    .order('updated_at', { ascending: false });

  if (threadsError) {
    console.error('🔴 Error fetching threads in getThreadsForUser:', threadsError);
    throw new Error(`Failed to retrieve threads: ${threadsError.message}`);
  }

  if (!threads || threads.length === 0) {
    return [];
  }

  const threadIds = threads.map(t => t.id);

  // 2. Fetch the latest message for each thread
  const { data: lastMessages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('id, thread_id, sender_id, content, is_read, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false });

  if (messagesError) {
    console.error('🔴 Error fetching last messages in getThreadsForUser:', messagesError);
    throw new Error(`Failed to retrieve thread messages: ${messagesError.message}`);
  }

  // Map messages to their threads (take the latest one because query is sorted DESC)
  const lastMessageMap: Record<string, ChatMessage> = {};
  if (lastMessages) {
    for (const msg of lastMessages) {
      if (!lastMessageMap[msg.thread_id]) {
        lastMessageMap[msg.thread_id] = msg as unknown as ChatMessage;
      }
    }
  }

  // 3. Fetch unread counts for each thread where current user is NOT the sender
  const { data: unreadCounts, error: unreadError } = await supabase
    .from('chat_messages')
    .select('thread_id')
    .in('thread_id', threadIds)
    .eq('is_read', false)
    .neq('sender_id', profileId);

  if (unreadError) {
    console.error('🔴 Error fetching unread counts in getThreadsForUser:', unreadError);
    throw new Error(`Failed to retrieve unread message counts: ${unreadError.message}`);
  }

  // Group unread counts by thread_id
  const unreadCountMap: Record<string, number> = {};
  if (unreadCounts) {
    for (const msg of unreadCounts) {
      unreadCountMap[msg.thread_id] = (unreadCountMap[msg.thread_id] || 0) + 1;
    }
  }

  // 4. Hydrate threads with last_message and unread_count
  const hydratedThreads: ChatThread[] = threads.map(t => {
    const thread = t as unknown as ChatThread;
    return {
      ...thread,
      last_message: lastMessageMap[thread.id] || null,
      unread_count: unreadCountMap[thread.id] || 0
    };
  });

  return hydratedThreads;
}

/**
 * Fetches chronologically sorted, paginated messages for a specific thread.
 */
export async function getThreadMessages(
  threadId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      id,
      thread_id,
      sender_id,
      content,
      is_read,
      created_at,
      sender:profiles!sender_id(id, full_name, avatar_url, role)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('🔴 Error fetching messages in getThreadMessages:', error);
    throw new Error(`Failed to retrieve messages: ${error.message}`);
  }

  return data as unknown as ChatMessage[];
}

/**
 * Inserts a new chat message into a thread and updates the thread's timestamp.
 */
export async function createMessage(input: CreateMessageInput): Promise<ChatMessage> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: input.threadId,
      sender_id: input.senderId,
      content: input.content.trim()
    })
    .select(`
      id,
      thread_id,
      sender_id,
      content,
      is_read,
      created_at,
      sender:profiles!sender_id(id, full_name, avatar_url, role)
    `)
    .single();

  if (error) {
    console.error('🔴 Error inserting message in createMessage:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data as unknown as ChatMessage;
}

/**
 * Marks all incoming messages in a thread as read for a specific recipient user.
 */
export async function markMessagesAsRead(threadId: string, readerId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('thread_id', threadId)
    .neq('sender_id', readerId)
    .eq('is_read', false);

  if (error) {
    console.error('🔴 Error marking messages as read in markMessagesAsRead:', error);
    throw new Error(`Failed to mark messages as read: ${error.message}`);
  }

  return true;
}
