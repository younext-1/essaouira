import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface DatabaseContext {
  artisans: ArtisanContext[]
  products: ProductContext[]
  services: ServiceContext[]
  posts: PostContext[]
  summary: string
}

interface ArtisanContext {
  id: string
  username: string
  full_name: string
  title: string | null
  craft_category: string | null
  location: string | null
  bio: string | null
  avg_rating: number
  whatsapp: string | null
  instagram: string | null
  languages: string[]
  profile_url: string
}

interface ProductContext {
  id: string
  title: string
  description: string | null
  price_mad: number
  category: string | null
  seller_name: string
  seller_username: string
  product_url: string
}

interface ServiceContext {
  id: string
  title: string
  description: string | null
  duration: string | null
  price: string | null
  price_mad: number | null
  artisan_name: string
  artisan_username: string
  profile_url: string
}

interface PostContext {
  id: string
  title: string | null
  content: string | null
  category: string | null
  location: string | null
  author_name: string | null
  author_username: string
  post_url: string
}

// Fetch fresh context from DB — called once per user message
export async function fetchDatabaseContext(
  userQuery?: string
): Promise<DatabaseContext> {
  const [artisansResult, productsResult, servicesResult, postsResult] =
    await Promise.allSettled([
      supabaseAdmin
        .from('profiles')
        .select('id, username, full_name, title, craft_category, location, bio, whatsapp, instagram, languages')
        .eq('is_artisan', true)
        .eq('onboarding_done', true)
        .order('created_at', { ascending: false })
        .limit(20),

      supabaseAdmin
        .from('products')
        .select('id, title, description, price_mad, category, seller_id, profiles!inner(full_name, username)')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(30),

      supabaseAdmin
        .from('services')
        .select('id, title, description, duration, price, price_mad, profile_id, profiles!inner(full_name, username)')
        .eq('is_available', true)
        .limit(20),

      supabaseAdmin
        .from('posts_with_counts')
        .select('id, title, content, category, location, full_name, username')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(15),
    ])

  const rawArtisans = artisansResult.status === 'fulfilled' ? (artisansResult.value.data ?? []) : []
  const rawProducts = productsResult.status === 'fulfilled' ? (productsResult.value.data ?? []) : []
  const rawServices = servicesResult.status === 'fulfilled' ? (servicesResult.value.data ?? []) : []
  const rawPosts    = postsResult.status    === 'fulfilled' ? (postsResult.value.data    ?? []) : []

  const artisans: ArtisanContext[] = rawArtisans.map((a: any) => ({
    id: a.id,
    username: a.username,
    full_name: a.full_name,
    title: a.title,
    craft_category: a.craft_category,
    location: a.location,
    bio: a.bio,
    avg_rating: 0, // computed by trigger in DB; not always present on profiles table
    whatsapp: a.whatsapp,
    instagram: a.instagram,
    languages: a.languages || ['ar'],
    profile_url: `/profile/${a.username}`,
  }))

  const products: ProductContext[] = rawProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price_mad: p.price_mad,
    category: p.category,
    seller_name: p.profiles?.full_name || '',
    seller_username: p.profiles?.username || '',
    product_url: `/marketplace/products/${p.id}`,
  }))

  const services: ServiceContext[] = rawServices.map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    duration: s.duration,
    price: s.price,
    price_mad: s.price_mad,
    artisan_name: s.profiles?.full_name || '',
    artisan_username: s.profiles?.username || '',
    profile_url: `/profile/${s.profiles?.username}`,
  }))

  const posts: PostContext[] = rawPosts.map((p: any) => ({
    id: p.id,
    title: p.title,
    content: p.content?.slice(0, 200),
    category: p.category,
    location: p.location,
    author_name: p.full_name,
    author_username: p.username,
    post_url: `/posts/${p.id}`,
  }))

  const categories = [...new Set(artisans.map(a => a.craft_category).filter(Boolean))]
  const prices = products.map(p => p.price_mad).filter(Boolean)

  const summary = [
    `PLATFORM DATA SUMMARY:`,
    `- Total Artisans: ${artisans.length}`,
    `- Total Products: ${products.length}`,
    `- Total Services: ${services.length}`,
    `- Recent Posts: ${posts.length}`,
    `- Craft Categories: ${categories.length > 0 ? categories.join(', ') : 'N/A'}`,
    prices.length > 0
      ? `- Price range: ${Math.min(...prices)} – ${Math.max(...prices)} MAD`
      : '',
  ].filter(Boolean).join('\n')

  return { artisans, products, services, posts, summary }
}

// Builds the Gemini system prompt injected with real DB data
export function buildSystemPrompt(
  dbContext: DatabaseContext,
  userName?: string
): string {
  const artisansText = dbContext.artisans.length > 0
    ? dbContext.artisans.map(a =>
        `• ${a.full_name} (@${a.username}) — ${a.title || 'حرفي'}
   Category: ${a.craft_category || 'General'}
   Location: ${a.location || 'Essaouira'}
   Bio: ${a.bio?.slice(0, 120) || 'No bio'}
   Languages: ${a.languages.join(', ')}
   Profile: ${a.profile_url}
   ${a.whatsapp ? `WhatsApp: ${a.whatsapp}` : ''}
   ${a.instagram ? `Instagram: ${a.instagram}` : ''}`
      ).join('\n\n')
    : 'No artisans registered yet.'

  const productsText = dbContext.products.length > 0
    ? dbContext.products.map(p =>
        `• ${p.title} — ${p.price_mad} MAD (~$${Math.round(p.price_mad / 10)})
   By: ${p.seller_name} | Category: ${p.category}
   ${p.description?.slice(0, 100) || ''}
   Link: ${p.product_url}`
      ).join('\n\n')
    : 'No products listed yet.'

  const servicesText = dbContext.services.length > 0
    ? dbContext.services.map(s =>
        `• ${s.title} — ${s.price || (s.price_mad ? s.price_mad + ' MAD' : 'N/A')}
   Duration: ${s.duration || 'Flexible'} | By: ${s.artisan_name}
   ${s.description?.slice(0, 100) || ''}
   Book at: ${s.profile_url}`
      ).join('\n\n')
    : 'No services listed yet.'

  return `
You are "مرشد موكادور" (Mogador Guide), the official AI tourism assistant for Mogador Connect — a platform connecting tourists with local artisans and experiences in Essaouira (Mogador), Morocco.

${userName ? `The tourist you are helping is: ${userName}` : ''}

YOUR PERSONALITY:
- Warm, welcoming, like a knowledgeable local friend
- Speak in the SAME language the user writes in (Arabic → Arabic, French → French, English → English)
- Use emojis naturally but not excessively
- Be specific — always suggest REAL artisans from the data below
- Be concise — max 3 paragraphs per response
- Always include actionable suggestions (links, contacts)

ESSAOUIRA FACTS:
- UNESCO World Heritage Medina on Morocco's Atlantic coast, 175km from Marrakech
- Famous for: Thuya wood artisans (unique to Essaouira), wind sports (kitesurf/windsurf — "Wind City of Africa"), Gnaoua World Music Festival (June), argan oil, fresh seafood at the harbor, blue & white Portuguese-style architecture
- Best time to visit: March–May, September–November | Weather: windy year-round, mild 18–25°C
- Currency: Moroccan Dirham (MAD). 1 USD ≈ 10 MAD
- Languages: Arabic (Darija), French, some English/Spanish
- Getting there: From Marrakech 2.5h (CTM/Supratours bus or taxi), from Agadir 2.5h, nearest airports: Essaouira Mogador (ESU) or Marrakech Menara (RAK)
- Must-dos: Walk ramparts at sunset, harbor fresh fish grills, Plage Sidi Kaouki kite surfing, artisan workshops (thuya, silver, weaving), tagine/bastilla/sardines, Moulay Hassan square evenings
- Safety: Very safe. Petty theft possible in busy medina. Modest dress recommended.

${dbContext.summary}

ARTISANS ON THE PLATFORM:
${artisansText}

PRODUCTS AVAILABLE:
${productsText}

SERVICES & EXPERIENCES:
${servicesText}

STRICT RULES:
1. ONLY answer about Essaouira tourism, culture, history, artisans, products, services, and travel tips.
2. If asked about ANYTHING ELSE (politics, other cities, general knowledge, coding, math, etc.), respond: "أنا متخصص فقط في مساعدة السياح في الصويرة. هل يمكنني مساعدتك في اكتشاف جمال موكادور؟ 🌊" (adapted to user's language)
3. Always suggest SPECIFIC artisans/products from the data with profile links.
4. When suggesting a product/service: mention artisan name, price in MAD, WhatsApp if available, and profile link.
5. If the user wants to buy: find matching products in data, suggest 1–3 most relevant with direct links.
6. Never invent artisans, products, or prices. Only reference what's in the database.
7. Keep responses concise with bullet points when listing options.
8. End each response with a relevant follow-up question.
  `.trim()
}
