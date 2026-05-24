import { NextResponse } from 'next/server'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/database.types'

export interface CategoryNode extends Category {
  children: CategoryNode[]
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/categories
 * Returns the hierarchical tree structure of active catalog categories.
 */
export async function GET() {
  try {
    const supabase = createPublicSupabaseClient()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    // Build the recursive hierarchy tree
    const categoryMap: Record<string, CategoryNode> = {}
    const rootNodes: CategoryNode[] = []

    // 1. Initialize nodes map
    categories.forEach((cat: Category) => {
      categoryMap[cat.id] = {
        ...cat,
        children: []
      }
    })

    // 2. Link children to their parent node
    categories.forEach((cat: Category) => {
      const node = categoryMap[cat.id]
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(node)
      } else {
        rootNodes.push(node)
      }
    })

    return NextResponse.json({
      success: true,
      data: rootNodes,
      message: 'Hierarchical category tree retrieved successfully.'
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/categories error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching categories.'
      },
      { status: 500 }
    )
  }
}
