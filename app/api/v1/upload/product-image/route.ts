import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Allowed image formats
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/v1/upload/product-image
 * Authenticated seller file upload to Supabase 'products' Storage Bucket.
 * Enforces JPG/PNG/WebP, max 5MB constraints.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    // 1. Parse Multipart Form Data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, data: null, message: 'Upload rejected. Form field "file" is required.' },
        { status: 400 }
      )
    }

    // 2. Validate File Size Constraint
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { 
          success: false, 
          data: null, 
          message: `Upload rejected. File size exceeds the 5MB maximum limit. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
        },
        { status: 400 }
      )
    }

    // 3. Validate Mime Type Format
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          data: null, 
          message: `Upload rejected. Format '${file.type}' is unsupported. Only JPG, PNG, and WebP files are allowed.` 
        },
        { status: 400 }
      )
    }

    // 4. Generate unique path name in Storage Bucket
    const fileExt = file.name.split('.').pop() || 'jpg'
    const uniqueId = Math.random().toString(36).substring(2, 15)
    const timestamp = Date.now()
    const filePath = `${profile.id}_${timestamp}_${uniqueId}.${fileExt}`

    // 5. Connect as active authenticated user client
    const supabase = await createClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 6. Upload directly to storage 'products' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload storage failure:', uploadError)
      return NextResponse.json(
        { success: false, data: null, message: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 7. Generate direct public URL link
    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to fetch public URL from storage bucket.')
    }

    return NextResponse.json({
      success: true,
      data: {
        path: filePath,
        url: publicUrlData.publicUrl
      },
      message: 'Product image uploaded successfully.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/upload/product-image API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during file upload.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
