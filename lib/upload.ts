import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Compresses an image file client-side using the Canvas API.
 * This is 100% dependency-free, lightweight, and works seamlessly in the browser.
 * Converts heavy files (e.g., 5MB+ smartphone captures) to optimized high-fidelity JPEGs (around 150KB - 300KB).
 * 
 * @param file The original image file from the user's device
 * @param maxWidth The maximum width of the output image (default: 1200px)
 * @param maxHeight The maximum height of the output image (default: 1200px)
 * @param quality Quality coefficient between 0 and 1 (default: 0.8 / 80%)
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving the aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get 2D context from canvas'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas compression resulted in an empty blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Creates an authenticated Supabase client for storage upload requests.
 * Uses the Supabase anon key directly — bucket RLS policies handle access control.
 * NOTE: The Clerk JWT template 'supabase' integration is NOT required for storage uploads
 * as long as bucket policies allow authenticated or public uploads.
 */
function createAuthSupabaseClient(getToken?: (options?: { template?: string }) => Promise<string | null>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
        const token = getToken ? await getToken({ template: "supabase" }) : null;
        const headers = new Headers(options?.headers);
        headers.set('apikey', supabaseAnonKey);
        headers.set('Authorization', token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`);

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

/**
 * Uploads an optimized image blob to Supabase Storage and returns its Public URL.
 * Generates unique file paths to prevent collisions in the bucket.
 * 
 * @param compressedBlob The compressed image blob to upload
 * @param originalFilename The original name of the file to preserve the file type extension
 * @param getToken Clerk getToken callback function
 */
export async function uploadProductImage(
  compressedBlob: Blob,
  originalFilename: string,
  getToken?: (options?: { template?: string }) => Promise<string | null>
): Promise<{ publicUrl: string | null; error: string | null }> {
  try {
    // 1. Generate a unique name for the file using timestamp and random string
    const fileExt = originalFilename.split('.').pop() || 'jpg';
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const filePath = `product_${timestamp}_${uniqueId}.${fileExt}`;

    // 2. Determine which Supabase client to use based on token presence
    const activeClient = getToken ? createAuthSupabaseClient(getToken) : supabase;

    // 3. Upload the compressed blob directly to the 'products' bucket
    const { data, error: uploadError } = await activeClient.storage
      .from('products')
      .upload(filePath, compressedBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 4. Retrieve the generated Public URL
    const { data: publicUrlData } = activeClient.storage
      .from('products')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to retrieve Public URL from Supabase storage.');
    }

    return { publicUrl: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Error during image upload:', err);
    return { publicUrl: null, error: err.message || 'An error occurred during upload.' };
  }
}

/**
 * Backwards-compatible upload wrapper utilized by existing wizards and forms in this project.
 * Automatically compresses image files client-side before sending to Supabase Storage.
 */
export async function uploadImage(
  file: File,
  bucket = 'products',
  userId?: string,
  getToken?: (options?: { template?: string }) => Promise<string | null>
): Promise<string> {
  // 1. Client-side canvas compression
  const compressedBlob = await compressImage(file, 1200, 1200, 0.85);

  // 2. Map bucket names cleanly (we default to the active 'products' database bucket)
  const actualBucket = (bucket === 'store-assets' || bucket === 'product-images' || bucket === 'products') ? 'products' : bucket;

  // 3. Generate unique file paths to prevent name conflicts
  const fileExt = file.name.split('.').pop() || 'jpg';
  const uniqueId = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  const filePath = `${userId || 'anon'}_${timestamp}_${uniqueId}.${fileExt}`;

  // 4. Determine which Supabase client to use based on token presence
  const activeClient = getToken ? createAuthSupabaseClient(getToken) : supabase;

  // 5. Upload to storage bucket
  const { error: uploadError } = await activeClient.storage
    .from(actualBucket)
    .upload(filePath, compressedBlob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // 6. Retrieve and return public URL
  const { data: publicUrlData } = activeClient.storage
    .from(actualBucket)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to retrieve public URL from Supabase storage.');
  }

  return publicUrlData.publicUrl;
}
