import type { Product, Store, Review } from '@/types';

// ============================================================================
// MOCK CATEGORIES
// ============================================================================
export const MOCK_CATEGORIES = [
  {
    id: 'cat-wood',
    name: 'Wood Carvings',
    name_ar: 'نحت خشب الثويا',
    name_fr: 'Sculptures en bois de Thuya',
    slug: 'wood-carvings',
  },
  {
    id: 'cat-oil',
    name: 'Oils & Cosmetics',
    name_ar: 'زيوت ومستحضرات تجميل',
    name_fr: 'Huiles & Cosmétiques',
    slug: 'oils-cosmetics',
  },
  {
    id: 'cat-rugs',
    name: 'Rugs & Tapestries',
    name_ar: 'زرابي ومنسوجات أمازيغية',
    name_fr: 'Tapis & Tapisseries',
    slug: 'rugs-tapestries',
  },
  {
    id: 'cat-surf',
    name: 'Surf & Water Sports Lessons',
    name_ar: 'ركوب الأمواج والرياضات البحرية',
    name_fr: 'Surf & Sports nautiques',
    slug: 'surf-water-sports',
  },
  {
    id: 'cat-leather',
    name: 'Leather Goods',
    name_ar: 'مصنوعات جلدية أصيلة',
    name_fr: 'Maroquinerie artisanale',
    slug: 'leather-goods',
  },
  {
    id: 'cat-culinary',
    name: 'Culinary Arts & Cooking Classes',
    name_ar: 'فنون الطهي وورشات الطبخ',
    name_fr: 'Arts culinaires & Ateliers cuisine',
    slug: 'culinary-arts',
  },
  {
    id: 'cat-tours',
    name: 'Excursions & Guided Tours',
    name_ar: 'رحلات واستكشاف الصويرة',
    name_fr: 'Excursions & Visites guidées',
    slug: 'excursions-guided-tours',
  },
  {
    id: 'cat-pottery',
    name: 'Pottery & Ceramic',
    name_ar: 'فخار وخزف تقليدي',
    name_fr: 'Poterie & Céramique',
    slug: 'pottery-ceramic',
  },
];

// ============================================================================
// MOCK STORES
// ============================================================================
export const MOCK_STORES: (Store & { profiles?: { full_name: string | null }; products?: { id: string; name: string; price: number; images: string[]; thumbnail_url?: string }[] })[] = [
  {
    id: 'store-woodcraft',
    owner_id: 'user-amine',
    name: 'Mogador Woodcraft Workshop',
    slug: 'mogador-woodcraft',
    description: 'Master craftsmen sculpting sacred Thuya burl wood and aromatic Moroccan cedar in the heart of Essaouira Medina for over 25 years.',
    logo_url: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=400',
    banner_url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    category: 'Artisanal Woodcraft',
    location: 'Rue Laalouj, Medina, Essaouira',
    rating: 4.9,
    total_sales: 1420,
    total_reviews: 184,
    review_count: 184,
    is_active: true,
    is_verified: true,
    profiles: {
      full_name: 'المعلم أمين الصويري (Amine Al-Mogadori)'
    },
    products: []
  },
  {
    id: 'store-argan',
    owner_id: 'user-fatima',
    name: 'Argan Gold Cooperative',
    slug: 'argan-gold',
    description: 'Women-led ethical cooperative producing cold-pressed, 100% pure organic cosmetic & culinary Argan oil from the UNESCO Biosphere Reserve.',
    logo_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    banner_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    category: 'Oils & Cosmetics',
    location: 'Avenue Sidi Mohamed Ben Abdallah, Essaouira',
    rating: 5.0,
    total_sales: 2890,
    total_reviews: 312,
    review_count: 312,
    is_active: true,
    is_verified: true,
    profiles: {
      full_name: 'تعاونية سيدات الأركان (Fatima Zahra)'
    },
    products: []
  },
  {
    id: 'store-surf',
    owner_id: 'user-youssef',
    name: 'WaveBound Surf & Kitesurf Academy',
    slug: 'wavebound-surf',
    description: 'Atlantic wind and ocean specialists offering high-performance coaching, handcrafted custom surfboards, and rental gear on Essaouira Bay & Sidi Kaouki.',
    logo_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400',
    banner_url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    category: 'Surf & Coastal Sports',
    location: 'Boulevard Mohamed V, Essaouira Beachfront',
    rating: 4.95,
    total_sales: 980,
    total_reviews: 142,
    review_count: 142,
    is_active: true,
    is_verified: true,
    profiles: {
      full_name: 'الكابتن يوسف البحري (Youssef Al-Amwaj)'
    },
    products: []
  },
  {
    id: 'store-carpets',
    owner_id: 'user-hassan',
    name: 'Atlas Berber Weaving Guild',
    slug: 'atlas-carpets',
    description: 'Ancestral hand-knotted Beni Ourain, Azilal, and vintage Taznakht rugs handcrafted with 100% natural virgin mountain wool.',
    logo_url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400',
    banner_url: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    category: 'Rugs & Tapestries',
    location: 'Souk Jdid, Medina, Essaouira',
    rating: 4.88,
    total_sales: 640,
    total_reviews: 95,
    review_count: 95,
    is_active: true,
    is_verified: true,
    profiles: {
      full_name: 'المعلم حسن التازي (Hassan El-Atlas)'
    },
    products: []
  },
  {
    id: 'store-leather',
    owner_id: 'user-rachid',
    name: 'Medina Leather Masters',
    slug: 'medina-leather',
    description: 'Vegetable-tanned full-grain leather bags, traditional Babouche slippers, and bohemian living room poufs crafted by hereditary tanners.',
    logo_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    banner_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
    category: 'Leather Goods',
    location: 'Bab Marrakech, Essaouira',
    rating: 4.85,
    total_sales: 1120,
    total_reviews: 138,
    review_count: 138,
    is_active: true,
    is_verified: true,
    profiles: {
      full_name: 'رشيد الدباغ (Rachid Leather)'
    },
    products: []
  },
  {
    id: 'store-culinary',
    owner_id: 'user-khadija',
    name: 'Mogador Culinary & Spices',
    slug: 'mogador-culinary',
    description: 'Rare saffron from Taliouine, authentic 35-spice Ras El Hanout, organic argan culinary pastes (Amlou), and hands-on rooftop cooking classes.',
    logo_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    banner_url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    category: 'Culinary Arts & Spices',
    location: 'Place Moulay Hassan, Essaouira',
    rating: 4.96,
    total_sales: 1850,
    total_reviews: 210,
    review_count: 210,
    is_active: true,
    is_verified: true,
    profiles: {
      full_name: 'الشيف خديجة الموكادورية (Chef Khadija)'
    },
    products: []
  }
];

// ============================================================================
// MOCK PRODUCTS
// ============================================================================
export const MOCK_PRODUCTS: Product[] = [
  // 1. Handcrafted Thuya Wood Jewelry Box
  {
    id: 'prod-thuya-jewelry-box',
    store_id: 'store-woodcraft',
    category_id: 'cat-wood',
    name: 'Handcrafted Thuya Wood Jewelry Box',
    name_ar: 'علبة مجوهرات من خشب الثويا المصنوعة يدويًا',
    name_fr: 'Boîte à bijoux en bois de Thuya artisanale',
    slug: 'handcrafted-thuya-wood-jewelry-box',
    description: 'Exquisite jewelry chest handcrafted from ancient Thuya burr wood found exclusively in the Essaouira region. Features intricate mother-of-pearl inlays, secret lock mechanism, velvet interior, and natural cedar oil polish with a lingering exotic scent.',
    description_ar: 'علبة مجوهرات فاخرة مصنوعة يدويًا من خشب جذر الثويا النادر، تتميز بترصيعات صدفية دقيقة وقفل مخفي تقليدي مع بطانة مخملية فاخرة ورائحة عطرية أصلية تدوم لسنوات.',
    description_fr: 'Superbe coffret à bijoux façonné à la main dans de la loupe de Thuya naturelle d’Essaouira. Incrustations fines en nacre, compartiments doublés de velours et parfum boisé envoûtant.',
    price: 350,
    compare_price: 490,
    compare_at_price: 490,
    images: [
      'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=400',
    image_url: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=600',
    type: 'physical',
    status: 'active',
    stock: 18,
    weight_grams: 850,
    rating: 4.9,
    avg_rating: 4.9,
    total_reviews: 48,
    total_sales: 320,
    is_featured: true,
    tags: ['thuya', 'wood', 'artisan', 'jewelry box', 'morocco', 'decor'],
    category: MOCK_CATEGORIES[0],
    stores: {
      id: 'store-woodcraft',
      name: 'Mogador Woodcraft Workshop',
      slug: 'mogador-woodcraft',
      location: 'Rue Laalouj, Medina, Essaouira',
      rating: 4.9,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    variants: [
      { id: 'var-box-sm', product_id: 'prod-thuya-jewelry-box', name: 'Size', value: 'Medium (18x12x8 cm)', stock: 12 },
      { id: 'var-box-lg', product_id: 'prod-thuya-jewelry-box', name: 'Size', value: 'Large (24x16x10 cm)', stock: 6, price_override: 450 }
    ],
    created_at: '2026-01-15T10:00:00.000Z'
  },

  // 2. Thuya Wood Deluxe Chess Set
  {
    id: 'prod-thuya-chess-set',
    store_id: 'store-woodcraft',
    category_id: 'cat-wood',
    name: 'Thuya Wood Deluxe Chess Set & Board',
    name_ar: 'طاولة وشطرنج كامل فاخر من خشب الثويا',
    name_fr: 'Jeu d\'échecs complet de luxe en bois de Thuya',
    slug: 'thuya-wood-deluxe-chess-set',
    description: 'Tournament-size chess table and pieces entirely hand-turned and carved from Moroccan Thuya and contrasting lemon tree wood. Each square showcases hypnotic natural wood eyes and burls, folding into a portable carrying box.',
    description_ar: 'طقم شطرنج كامل بمقاس احترافي منحوت يدويًا بالكامل من خشب الثويا وخشب الليمون المتباين، يطوى في صندوق أنيق مزود بقفل نحاسي ومخزن مبطن لكل قطعة.',
    description_fr: 'Échiquier de tournoi pliable avec toutes ses pièces sculptées à la main en bois de Thuya et citronnier. Finition miroir naturelle lustrée aux huiles essentielles.',
    price: 850,
    compare_price: 1200,
    compare_at_price: 1200,
    images: [
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
      'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',
    image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600',
    type: 'physical',
    status: 'active',
    stock: 7,
    weight_grams: 2400,
    rating: 5.0,
    avg_rating: 5.0,
    total_reviews: 29,
    total_sales: 110,
    is_featured: true,
    tags: ['chess', 'woodcraft', 'thuya', 'games', 'collector'],
    category: MOCK_CATEGORIES[0],
    stores: {
      id: 'store-woodcraft',
      name: 'Mogador Woodcraft Workshop',
      slug: 'mogador-woodcraft',
      location: 'Rue Laalouj, Medina, Essaouira',
      rating: 4.9,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    variants: [
      { id: 'var-chess-reg', product_id: 'prod-thuya-chess-set', name: 'Finish', value: 'Traditional Glossy', stock: 5 },
      { id: 'var-chess-mat', product_id: 'prod-thuya-chess-set', name: 'Finish', value: 'Matte Satin Natural', stock: 2 }
    ],
    created_at: '2026-01-20T11:00:00.000Z'
  },

  // 3. Traditional Thuya Coaster Set (6 Pcs)
  {
    id: 'prod-thuya-coasters',
    store_id: 'store-woodcraft',
    category_id: 'cat-wood',
    name: 'Traditional Thuya Coaster Set (6 Pieces)',
    name_ar: 'مجموعة 6 قواعد كؤوس تقليدية من خشب الثويا',
    name_fr: 'Ensemble de 6 sous-verres traditionnels en Thuya',
    slug: 'traditional-thuya-coaster-set',
    description: 'Set of 6 heat-resistant coasters turned from rich burl Thuya wood, housed inside a matching spherical container with a tight lid. Perfect addition to Moroccan mint tea ceremonies.',
    description_ar: 'طقم من 6 قواعد أكواب شاي وقهوة مقاومة للحرارة داخل علبة أسطوانية مزخرفة بنقوش هندسية دقيقة من خشب الثويا العطري.',
    description_fr: 'Set de 6 sous-verres résistants à la chaleur logés dans une élégante boîte ronde ouvragée en bois précieux de Thuya.',
    price: 150,
    compare_price: 210,
    compare_at_price: 210,
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800',
      'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400',
    image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600',
    type: 'physical',
    status: 'active',
    stock: 45,
    weight_grams: 400,
    rating: 4.8,
    avg_rating: 4.8,
    total_reviews: 62,
    total_sales: 580,
    is_featured: false,
    tags: ['coasters', 'tableware', 'thuya', 'tea', 'gifts'],
    category: MOCK_CATEGORIES[0],
    stores: {
      id: 'store-woodcraft',
      name: 'Mogador Woodcraft Workshop',
      slug: 'mogador-woodcraft',
      location: 'Rue Laalouj, Medina, Essaouira',
      rating: 4.9,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    created_at: '2026-02-01T09:00:00.000Z'
  },

  // 4. 100% Pure Organic Cosmetic Argan Oil (100ml)
  {
    id: 'prod-pure-argan-cosmetic',
    store_id: 'store-argan',
    category_id: 'cat-oil',
    name: '100% Pure Organic Cosmetic Argan Oil (100ml)',
    name_ar: 'زيت أركان التجميلي العضوي الطبيعي 100% (100 مل)',
    name_fr: 'Huile d\'Argan cosmétique 100% pure et biologique (100ml)',
    slug: 'pure-organic-cosmetic-argan-oil',
    description: 'First cold-pressed virgin cosmetic Argan oil, harvested exclusively from the sunny argan groves outside Essaouira. Rich in vitamin E, Omega 6, and antioxidants to deeply hydrate skin, prevent wrinkles, and revitalize hair shine.',
    description_ar: 'زيت أركان أصيل معصور على البارد بالعصرة الأولى، مستخلص من أشجار الأركان المحمية بالصويرة. غني بفيتامين هـ والأوميغا 6 لتجديد نضارة البشرة، مكافحة التجاعيد وتقوية الشعر.',
    description_fr: 'Huile d’Argan cosmétique extra vierge de première pression à froid. Certifiée biologique, riche en vitamine E et acides gras essentiels pour nourrir le visage et les cheveux.',
    price: 200,
    compare_price: 280,
    compare_at_price: 280,
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600',
    type: 'physical',
    status: 'active',
    stock: 80,
    weight_grams: 220,
    rating: 5.0,
    avg_rating: 5.0,
    total_reviews: 145,
    total_sales: 1250,
    is_featured: true,
    tags: ['argan oil', 'cosmetics', 'organic', 'skincare', 'haircare', 'bio'],
    category: MOCK_CATEGORIES[1],
    stores: {
      id: 'store-argan',
      name: 'Argan Gold Cooperative',
      slug: 'argan-gold',
      location: 'Avenue Sidi Mohamed Ben Abdallah, Essaouira',
      rating: 5.0,
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    },
    variants: [
      { id: 'var-argan-100', product_id: 'prod-pure-argan-cosmetic', name: 'Volume', value: '100ml Glass Dropper', stock: 50 },
      { id: 'var-argan-250', product_id: 'prod-pure-argan-cosmetic', name: 'Volume', value: '250ml Amber Bottle', stock: 30, price_override: 380 }
    ],
    created_at: '2026-01-10T12:00:00.000Z'
  },

  // 5. Organic Roasted Culinary Argan Oil (250ml)
  {
    id: 'prod-culinary-argan-oil',
    store_id: 'store-argan',
    category_id: 'cat-oil',
    name: 'Organic Roasted Culinary Argan Oil (250ml)',
    name_ar: 'زيت أركان الغذائي العضوي المحمص (250 مل)',
    name_fr: 'Huile d\'Argan culinaire torréfiée bio (250ml)',
    slug: 'organic-roasted-culinary-argan-oil',
    description: 'Lightly roasted kernels pressed traditionally to create an extraordinary golden oil with an incomparable hazelnut and praline flavor profile. Ideal for Moroccan tagines, couscous, dipping warm barley bread, and making Amlou.',
    description_ar: 'زيت أركان غذائي فاخر محمص بعناية لنكهة لوز وبندق فريدة، لا غنى عنه في موائد الإفطار مع الخبز الساخن وإعداد طبق أملو التقليدي وتنكيه الطواجن المغربية الأصيلة.',
    description_fr: 'Huile d’Argan alimentaire pressée à partir d’amandons légèrement torréfiés. Arôme de noisette sublime pour sublimer vos salades, poissons et tajines.',
    price: 250,
    compare_price: 330,
    compare_at_price: 330,
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
    type: 'physical',
    status: 'active',
    stock: 45,
    weight_grams: 550,
    rating: 4.9,
    avg_rating: 4.9,
    total_reviews: 78,
    total_sales: 640,
    is_featured: true,
    tags: ['argan culinary', 'food', 'organic', 'amlou', 'moroccan food'],
    category: MOCK_CATEGORIES[1],
    stores: {
      id: 'store-argan',
      name: 'Argan Gold Cooperative',
      slug: 'argan-gold',
      location: 'Avenue Sidi Mohamed Ben Abdallah, Essaouira',
      rating: 5.0,
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    },
    created_at: '2026-01-18T14:30:00.000Z'
  },

  // 6. Cold-Pressed Prickly Pear Seed Elixir (30ml)
  {
    id: 'prod-prickly-pear-oil',
    store_id: 'store-argan',
    category_id: 'cat-oil',
    name: 'Rare Prickly Pear Seed Elixir Oil (30ml)',
    name_ar: 'زيت بذور التين الشوكي المركز الملكي (30 مل)',
    name_fr: 'Huile précieuse de pépins de figue de barbarie (30ml)',
    slug: 'rare-prickly-pear-seed-elixir',
    description: 'The world\'s most precious natural anti-aging oil. Requiring over 1 ton of cactus figs to produce a single liter. Rich in sterols and Vitamin K, erasing dark circles and lifting skin elasticity naturally.',
    description_ar: 'أثمن زيت طبيعي لمكافحة علامات التقدم في السن في العالم. يتطلب استخلاص لتر واحد عصر طن كامل من حبوب التين الشوكي الملكي لتفتيح الهالات وتجديد خلايا البشرة.',
    description_fr: 'Véritable trésor de la cosmétique naturelle, l’huile de pépins de figue de barbarie offre une teneur record en vitamine E et stérols pour un effet liftant immédiat.',
    price: 450,
    compare_price: 650,
    compare_at_price: 650,
    images: [
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400',
    image_url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600',
    type: 'physical',
    status: 'active',
    stock: 22,
    weight_grams: 110,
    rating: 5.0,
    avg_rating: 5.0,
    total_reviews: 36,
    total_sales: 190,
    is_featured: true,
    tags: ['prickly pear', 'anti-aging', 'elixir', 'luxury', 'bio'],
    category: MOCK_CATEGORIES[1],
    stores: {
      id: 'store-argan',
      name: 'Argan Gold Cooperative',
      slug: 'argan-gold',
      location: 'Avenue Sidi Mohamed Ben Abdallah, Essaouira',
      rating: 5.0,
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    },
    created_at: '2026-02-05T15:00:00.000Z'
  },

  // 7. Authentic Handwoven Berber Wool Rug (Beni Ourain)
  {
    id: 'prod-berber-wool-rug',
    store_id: 'store-carpets',
    category_id: 'cat-rugs',
    name: 'Authentic Handwoven Berber Wool Rug (180x120 cm)',
    name_ar: 'زربية أمازيغية بني ورين منسوجة يدويًا (180×120 سم)',
    name_fr: 'Tapis berbère Beni Ouarain fait main en pure laine (180x120 cm)',
    slug: 'authentic-handwoven-berber-wool-rug',
    description: 'Masterpiece woven by indigenous Berber artisan women using pure unbleached high-Atlas sheep wool. Thick, incredibly plush 4cm pile featuring timeless geometric diamond motifs that integrate seamlessly into modern and bohemian interiors.',
    description_ar: 'تحفة صوفية منسوجة على النول اليدوي التقليدي بأنامل نساء الأطلس. صوف طبيعي غير مبيض بسمك 4 سم ناعم ودافئ، مع نقوش هندسية كلاسيكية تضفي فخامة مطلقة لأي صالون.',
    description_fr: 'Tapis authentique Beni Ouarain tissé à la main avec de la laine vierge de l’Atlas. Moelleux exceptionnel, motifs géométriques sobres et élégance intemporelle.',
    price: 1850,
    compare_price: 2500,
    compare_at_price: 2500,
    images: [
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
      'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400',
    image_url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600',
    type: 'physical',
    status: 'active',
    stock: 4,
    weight_grams: 5200,
    rating: 4.9,
    avg_rating: 4.9,
    total_reviews: 19,
    total_sales: 45,
    is_featured: true,
    tags: ['rug', 'carpet', 'berber', 'beni ourain', 'wool', 'decor'],
    category: MOCK_CATEGORIES[2],
    stores: {
      id: 'store-carpets',
      name: 'Atlas Berber Weaving Guild',
      slug: 'atlas-carpets',
      location: 'Souk Jdid, Medina, Essaouira',
      rating: 4.88,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
    },
    created_at: '2026-01-25T16:00:00.000Z'
  },

  // 8. Vintage Azilal Tribal Wall Tapestry
  {
    id: 'prod-azilal-tapestry',
    store_id: 'store-carpets',
    category_id: 'cat-rugs',
    name: 'Vintage Azilal Tribal Wall Tapestry & Runner',
    name_ar: 'لوحة جدارية وسجادة كليم أزيلال القبلية الملونة',
    name_fr: 'Tapisserie murale et descente de lit Azilal vintage',
    slug: 'vintage-azilal-tribal-wall-tapestry',
    description: 'Bursting with spontaneous storytelling and dyed using natural pomegranate rind, saffron, and indigo. Each piece is one-of-a-kind and serves as both a warm floor runner or wall art.',
    description_ar: 'قطعة فنية فريدة ومبهجة مصبوغة بمستخلصات الزعفران والرمان والنيلة الطبيعية، تحكي قصص التراث الأمازيغي العريق كتحفة جدارية أو سجادة أرضية حيوية.',
    description_fr: 'Tapis Azilal vintage aux couleurs éclatantes issues de teintures végétales naturelles. Une œuvre d’art textile unique chargée d’histoire.',
    price: 750,
    compare_price: 1050,
    compare_at_price: 1050,
    images: [
      'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=800',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=400',
    image_url: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=600',
    type: 'physical',
    status: 'active',
    stock: 9,
    weight_grams: 1800,
    rating: 4.8,
    avg_rating: 4.8,
    total_reviews: 22,
    total_sales: 85,
    is_featured: false,
    tags: ['kilim', 'azilal', 'tapestry', 'tribal', 'vintage', 'rug'],
    category: MOCK_CATEGORIES[2],
    stores: {
      id: 'store-carpets',
      name: 'Atlas Berber Weaving Guild',
      slug: 'atlas-carpets',
      location: 'Souk Jdid, Medina, Essaouira',
      rating: 4.88,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
    },
    created_at: '2026-02-02T13:00:00.000Z'
  },

  // 9. Beginner Surf Coaching Lesson in Essaouira Bay
  {
    id: 'prod-surf-lesson-beginner',
    store_id: 'store-surf',
    category_id: 'cat-surf',
    name: 'Beginner Surf Coaching Session in Essaouira Bay (2 Hours)',
    name_ar: 'حصة تدريبية لركوب الأمواج للمبتدئين بشاطئ الصويرة (ساعتان)',
    name_fr: 'Cours de surf débutant dans la baie d\'Essaouira (2 Heures)',
    slug: 'beginner-surf-coaching-session',
    description: 'Catch your first green waves under the guidance of ISA-certified local Moroccan instructors. Complete premium package includes foam training board, thermal 4/3mm wetsuit, ocean safety briefing, and on-water photos.',
    description_ar: 'تعلم ركوب أمواج المحيط الأطلسي مع مدربين معتمدين دوليًا في مياه الصويرة الهادئة والآمنة. يشمل الدرس لوح التزلج، البدلة الحرارية الكاملة، إرشادات السلامة وصور تذكارية أثناء ركوب الأمواج.',
    description_fr: 'Apprenez à glisser sur les vagues en toute sécurité avec nos moniteurs diplômés. Matériel complet fourni (planche en mousse et combinaison néoprène) avec débriefing vidéo.',
    price: 300,
    compare_price: 420,
    compare_at_price: 420,
    images: [
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800',
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400',
    image_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
    type: 'experience',
    status: 'active',
    stock: 60,
    rating: 5.0,
    avg_rating: 5.0,
    total_reviews: 94,
    total_sales: 730,
    is_featured: true,
    tags: ['surf', 'lesson', 'ocean', 'sports', 'essaouira', 'experience'],
    category: MOCK_CATEGORIES[3],
    stores: {
      id: 'store-surf',
      name: 'WaveBound Surf & Kitesurf Academy',
      slug: 'wavebound-surf',
      location: 'Boulevard Mohamed V, Essaouira Beachfront',
      rating: 4.95,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    },
    variants: [
      { id: 'var-surf-morning', product_id: 'prod-surf-lesson-beginner', name: 'Time Slot', value: 'Morning Session (10:00 AM)', stock: 30 },
      { id: 'var-surf-afternoon', product_id: 'prod-surf-lesson-beginner', name: 'Time Slot', value: 'Sunset Session (03:30 PM)', stock: 30 }
    ],
    created_at: '2026-01-12T08:00:00.000Z'
  },

  // 10. Advanced Kitesurfing Session at Sidi Kaouki
  {
    id: 'prod-kitesurf-sidi-kaouki',
    store_id: 'store-surf',
    category_id: 'cat-surf',
    name: 'Advanced Kitesurfing & Wind Session at Sidi Kaouki',
    name_ar: 'جلسة كايت سورف متقدمة في شاطئ سيدي كاوكي العالمي',
    name_fr: 'Session kitesurf & vent avancé sur le spot de Sidi Kaouki',
    slug: 'advanced-kitesurfing-sidi-kaouki',
    description: 'Ride the world-renowned Atlantic trade winds (Alizés) in Sidi Kaouki. Includes state-of-the-art Duotone kite gear rental, VHF radio helmet communication, and rescue boat monitoring support.',
    description_ar: 'استمتع بقوة رياح الأطلسي الشهيرة في شاطئ سيدي كاوكي مع معدات كايت سورف ديوتون الحديثة، مع خوذة متصلة باللاسلكي لمتابعة المدرب ودعم قارب الإنقاذ.',
    description_fr: 'Profitez des légendaires alizés d’Essaouira avec du matériel kitesurf haut de gamme et assistance radio en temps réel sur les vagues de Sidi Kaouki.',
    price: 600,
    compare_price: 800,
    compare_at_price: 800,
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    type: 'experience',
    status: 'active',
    stock: 25,
    rating: 4.9,
    avg_rating: 4.9,
    total_reviews: 41,
    total_sales: 260,
    is_featured: false,
    tags: ['kitesurf', 'sidi kaouki', 'windsurfing', 'adventure', 'waves'],
    category: MOCK_CATEGORIES[3],
    stores: {
      id: 'store-surf',
      name: 'WaveBound Surf & Kitesurf Academy',
      slug: 'wavebound-surf',
      location: 'Boulevard Mohamed V, Essaouira Beachfront',
      rating: 4.95,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    },
    created_at: '2026-02-08T11:00:00.000Z'
  },

  // 11. Hand-Stitched Medina Leather Backpack
  {
    id: 'prod-leather-backpack',
    store_id: 'store-leather',
    category_id: 'cat-leather',
    name: 'Hand-Stitched Medina Genuine Leather Backpack',
    name_ar: 'حقيبة ظهر من الجلد الطبيعي الأصيل محاكة يدويًا',
    name_fr: 'Sac à dos en cuir véritable cousu main de la Médina',
    slug: 'hand-stitched-medina-leather-backpack',
    description: 'Rugged vintage travel backpack crafted from thick Moroccan cowhide, naturally vegetable-tanned without chemicals. Features solid brass buckles, padded shoulder straps, and a 15-inch laptop compartment that patinas gracefully with age.',
    description_ar: 'حقيبة ظهر للمغامرات والأسفار مصنوعة من جلد البقر المغربي المدبوغ نباتياً بدون مواد كيميائية. مزودة بأبازيم نحاسية متينة ومكان مخصص للكمبيوتر المحمول (15 بوصة).',
    description_fr: 'Sac à dos de voyage vintage fabriqué à partir de cuir pleine fleur tanné naturellement. Boucles en laiton massif et compartiment ordinateur renforcé.',
    price: 520,
    compare_price: 720,
    compare_at_price: 720,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
    type: 'physical',
    status: 'active',
    stock: 14,
    weight_grams: 1450,
    rating: 4.9,
    avg_rating: 4.9,
    total_reviews: 53,
    total_sales: 380,
    is_featured: true,
    tags: ['leather', 'backpack', 'vintage', 'bag', 'travel', 'handmade'],
    category: MOCK_CATEGORIES[4],
    stores: {
      id: 'store-leather',
      name: 'Medina Leather Masters',
      slug: 'medina-leather',
      location: 'Bab Marrakech, Essaouira',
      rating: 4.85,
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'
    },
    variants: [
      { id: 'var-leather-tan', product_id: 'prod-leather-backpack', name: 'Color', value: 'Desert Cognac Tan', stock: 8 },
      { id: 'var-leather-dark', product_id: 'prod-leather-backpack', name: 'Color', value: 'Vintage Dark Chocolate', stock: 6 }
    ],
    created_at: '2026-01-28T09:30:00.000Z'
  },

  // 12. Traditional Embossed Moroccan Leather Pouf
  {
    id: 'prod-leather-pouf',
    store_id: 'store-leather',
    category_id: 'cat-leather',
    name: 'Traditional Embossed Moroccan Leather Pouf (Unstuffed)',
    name_ar: 'بوف جلدي مغربي تقليدي أصيل مزخرف يدويًا',
    name_fr: 'Pouf marocain traditionnel en cuir brodé à la main',
    slug: 'traditional-embossed-moroccan-leather-pouf',
    description: 'Iconic Moroccan bohemian ottoman handmade with genuine goat leather. Features delicate medallion embroidery on top and heavy-duty bottom zipper. Easy to stuff with recycled cotton fabrics or cushions.',
    description_ar: 'بوف صالون مغربي شهير من جلد الماعز الخالص المزين بزهور التطريز اليدوي البديع. يضفي لمسة شرقية دافئة لأي ركن جلوس ومزود بسحاب سفلي متين لتعبئته بسهولة.',
    description_fr: 'Pouf en cuir véritable orné de broderies artisanales traditionnelles. Fermeture zippée robuste en dessous pour un rembourrage personnalisé.',
    price: 380,
    compare_price: 520,
    compare_at_price: 520,
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
    type: 'physical',
    status: 'active',
    stock: 35,
    weight_grams: 800,
    rating: 4.8,
    avg_rating: 4.8,
    total_reviews: 67,
    total_sales: 610,
    is_featured: false,
    tags: ['pouf', 'leather', 'moroccan living', 'boho', 'furniture'],
    category: MOCK_CATEGORIES[4],
    stores: {
      id: 'store-leather',
      name: 'Medina Leather Masters',
      slug: 'medina-leather',
      location: 'Bab Marrakech, Essaouira',
      rating: 4.85,
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'
    },
    variants: [
      { id: 'var-pouf-tan', product_id: 'prod-leather-pouf', name: 'Color', value: 'Camel Natural', stock: 20 },
      { id: 'var-pouf-white', product_id: 'prod-leather-pouf', name: 'Color', value: 'Terracotta Red', stock: 15 }
    ],
    created_at: '2026-02-04T10:15:00.000Z'
  },

  // 13. Market Tour & Authentic Tagine Cooking Masterclass
  {
    id: 'prod-tagine-cooking-class',
    store_id: 'store-culinary',
    category_id: 'cat-culinary',
    name: 'Medina Market Tour & Authentic Tagine Masterclass (4 Hours)',
    name_ar: 'جولة بالسوق الشعبي وورشة تحضير الطاجين الصويري الأصيل (4 ساعات)',
    name_fr: 'Visite du marché & Atelier cuisine du Tajine traditionnel (4 Heures)',
    slug: 'medina-market-tour-tagine-masterclass',
    description: 'Immersive culinary masterclass starting with a guided spice and seafood tour through Essaouira fish auction and old souks, followed by a hands-on rooftop cooking session preparing fish or lamb tagine with traditional bread.',
    description_ar: 'تجربة طهي حية تبدأ بجولة في سوق السمك وأزقة التوابل العتيقة لاختيار المكونات الطازجة، ثم الصعود لسطح يطل على البحر لتعلم أسرار الطاجين المغربي وخبز المقلاة.',
    description_fr: 'Visite guidée des souks d’épices et de la criée au poisson suivie d’un atelier pratique de cuisine sur un magnifique rooftop face à l’océan.',
    price: 400,
    compare_price: 550,
    compare_at_price: 550,
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600',
    type: 'experience',
    status: 'active',
    stock: 40,
    rating: 5.0,
    avg_rating: 5.0,
    total_reviews: 82,
    total_sales: 520,
    is_featured: true,
    tags: ['cooking class', 'tagine', 'food tour', 'culinary', 'essaouira'],
    category: MOCK_CATEGORIES[5],
    stores: {
      id: 'store-culinary',
      name: 'Mogador Culinary & Spices',
      slug: 'mogador-culinary',
      location: 'Place Moulay Hassan, Essaouira',
      rating: 4.96,
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'
    },
    variants: [
      { id: 'var-cook-fish', product_id: 'prod-tagine-cooking-class', name: 'Menu', value: 'Atlantic Fresh Seafood Tagine', stock: 20 },
      { id: 'var-cook-lamb', product_id: 'prod-tagine-cooking-class', name: 'Menu', value: 'Lamb & Prune Almond Tagine', stock: 20 }
    ],
    created_at: '2026-01-08T09:00:00.000Z'
  },

  // 14. Luxury Royal Spice Box (Ras El Hanout & Saffron)
  {
    id: 'prod-royal-spice-box',
    store_id: 'store-culinary',
    category_id: 'cat-culinary',
    name: 'Luxury Royal Spice Collection Box (Ras El Hanout & Pure Saffron)',
    name_ar: 'صندوق التوابل الملكية المغربية الفاخرة (رأس الحانوت وزعفران تاليوين)',
    name_fr: 'Coffret d\'épices royales marocaines (Ras El Hanout & Safran pur)',
    slug: 'luxury-royal-moroccan-spice-box',
    description: 'A gourmet collection including 35-botanical secret blend Ras El Hanout, 5 grams of Grade-A red gold Taliouine Saffron threads, smoked sweet paprika, and organic Essaouira sea salt crystals.',
    description_ar: 'تشكيلة استثنائية من التوابل المغربية النادرة: خلطة رأس الحانوت بـ 35 عشبة عطرية، 5 غرامات من زعفران تاليوين الأصيل، تحميرة مدخنة وبلورات ملح الصويرة البحري.',
    description_fr: 'Sélection d’exception comprenant notre Ras El Hanout artisanal aux 35 épices rares et 5 grammes de safran rouge pur de Taliouine dans un coffret en bois.',
    price: 220,
    compare_price: 310,
    compare_at_price: 310,
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400',
    image_url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600',
    type: 'physical',
    status: 'active',
    stock: 50,
    weight_grams: 600,
    rating: 4.95,
    avg_rating: 4.95,
    total_reviews: 44,
    total_sales: 410,
    is_featured: false,
    tags: ['spices', 'saffron', 'ras el hanout', 'gourmet', 'culinary'],
    category: MOCK_CATEGORIES[5],
    stores: {
      id: 'store-culinary',
      name: 'Mogador Culinary & Spices',
      slug: 'mogador-culinary',
      location: 'Place Moulay Hassan, Essaouira',
      rating: 4.96,
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'
    },
    created_at: '2026-02-06T14:00:00.000Z'
  },

  // 15. Sunset Camel Caravan Ride on Essaouira Ocean Dunes
  {
    id: 'prod-sunset-camel-ride',
    store_id: 'store-surf',
    category_id: 'cat-tours',
    name: 'Sunset Camel Caravan Ride on Essaouira Ocean Dunes (90 Min)',
    name_ar: 'جولة قافلة الجمال عند غروب الشمس فوق شاطئ وكثبان الصويرة',
    name_fr: 'Balade à dos de chameau au coucher du soleil sur les dunes d\'Essaouira',
    slug: 'sunset-camel-caravan-ride',
    description: 'Ride gentle, well-cared camels along the sweeping Atlantic beaches past the historic ruins of the Portuguese castle and Dar Sultan sand palace as the sunset reflects over the waves.',
    description_ar: 'استمتع بجولة ساحرة على ظهور الجمال على طول شواطئ الصويرة الرملية مروراً ببرج البارود وأطلال قصر دار السلطان التاريخي وسط ألوان الغروب الأطلسي الخلابة.',
    description_fr: 'Échappée inoubliable au pas des dromadaires le long de l’océan et à travers les dunes sauvages avec thé à la menthe offert en fin de parcours.',
    price: 250,
    compare_price: 360,
    compare_at_price: 360,
    images: [
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400',
    image_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600',
    type: 'experience',
    status: 'active',
    stock: 50,
    rating: 4.9,
    avg_rating: 4.9,
    total_reviews: 73,
    total_sales: 690,
    is_featured: true,
    tags: ['camel', 'sunset', 'tour', 'beach', 'excursion', 'nature'],
    category: MOCK_CATEGORIES[6],
    stores: {
      id: 'store-surf',
      name: 'WaveBound Surf & Kitesurf Academy',
      slug: 'wavebound-surf',
      location: 'Boulevard Mohamed V, Essaouira Beachfront',
      rating: 4.95,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    },
    created_at: '2026-01-16T17:00:00.000Z'
  },

  // 16. Hand-Painted Glazed Safi Ceramic Tagine (Serving)
  {
    id: 'prod-ceramic-tagine-serving',
    store_id: 'store-woodcraft',
    category_id: 'cat-pottery',
    name: 'Hand-Painted Glazed Ceramic Tagine for Serving (28 cm)',
    name_ar: 'طاجين خزفي أصيل مزخرف يدويًا لتقديم المأكولات (28 سم)',
    name_fr: 'Plat à tajine de service artisanal en céramique émaillée (28 cm)',
    slug: 'hand-painted-glazed-ceramic-tagine',
    description: 'Decorative serving tagine with intricate floral Islamic arabesque motifs, wheel-thrown by master potters and glazed with vibrant royal blue and ochre minerals.',
    description_ar: 'طاجين خزفي للتقديم مزين بنقوش وزخارف أرابيسك إسلامية دقيقة باللون الأزرق الموكادوري الملكي، مصقول يدويًا بمينا لامعة وخالية من الرصاص.',
    description_fr: 'Magnifique plat à tajine traditionnel peint à la main aux motifs arabesques bleu kobalt et ocre. Idéal pour présenter couscous et plats chauds avec élégance.',
    price: 160,
    compare_price: 240,
    compare_at_price: 240,
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'
    ],
    thumbnail_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400',
    image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
    type: 'physical',
    status: 'active',
    stock: 28,
    weight_grams: 1600,
    rating: 4.85,
    avg_rating: 4.85,
    total_reviews: 38,
    total_sales: 340,
    is_featured: false,
    tags: ['pottery', 'tagine', 'ceramic', 'decor', 'tableware'],
    category: MOCK_CATEGORIES[7],
    stores: {
      id: 'store-woodcraft',
      name: 'Mogador Woodcraft Workshop',
      slug: 'mogador-woodcraft',
      location: 'Rue Laalouj, Medina, Essaouira',
      rating: 4.9,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    created_at: '2026-02-03T11:45:00.000Z'
  }
];

// Link products back into their respective stores
MOCK_STORES.forEach(store => {
  store.products = MOCK_PRODUCTS.filter(p => p.store_id === store.id).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    images: p.images,
    thumbnail_url: p.thumbnail_url || p.images[0]
  }));
});

// ============================================================================
// MOCK REVIEWS FOR PRODUCTS
// ============================================================================
export const MOCK_REVIEWS: Record<string, Review[]> = {
  'prod-thuya-jewelry-box': [
    {
      id: 'rev-1',
      product_id: 'prod-thuya-jewelry-box',
      user_id: 'user-sophie',
      rating: 5,
      title: 'Incroyable travail d’artisanat !',
      body: 'La boîte est absolument magnifique, le bois de Thuya dégage une odeur très agréable qui parfume toute la chambre. La finition et le secret pour l’ouvrir sont bluffants !',
      created_at: '2026-02-14T14:30:00Z',
      helpful_count: 14,
      profiles: {
        full_name: 'Sophie Martin',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
      }
    },
    {
      id: 'rev-2',
      product_id: 'prod-thuya-jewelry-box',
      user_id: 'user-karim',
      rating: 5,
      title: 'تحفة تقليدية تبارك الله',
      body: 'جودة خشب الثويا ممتازة والنقوش دقيقة جداً. تعامل الحرفي كان في غاية الرقي والتوصيل كان سريعاً.',
      created_at: '2026-02-10T19:00:00Z',
      helpful_count: 8,
      profiles: {
        full_name: 'كريم المنصوري',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
      }
    },
    {
      id: 'rev-3',
      product_id: 'prod-thuya-jewelry-box',
      user_id: 'user-david',
      rating: 5,
      title: 'Authentic Essaouira treasure',
      body: 'Bought this after our trip to Mogador. Arrived in pristine condition. The burl wood patterns are stunning.',
      created_at: '2026-01-29T11:20:00Z',
      helpful_count: 5,
      profiles: {
        full_name: 'David Wilson',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
      }
    }
  ],
  'prod-pure-argan-cosmetic': [
    {
      id: 'rev-4',
      product_id: 'prod-pure-argan-cosmetic',
      user_id: 'user-leila',
      rating: 5,
      title: 'زيت أركان نقي 100% بدون أي إضافات',
      body: 'بشرتي تغيرت تماماً خلال أسبوعين من الاستخدام. خفيف ويمتصه الجلد بسرعة بدون أي إحساس دهني مزعج.',
      created_at: '2026-02-18T10:15:00Z',
      helpful_count: 22,
      profiles: {
        full_name: 'ليلى بناني',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'
      }
    },
    {
      id: 'rev-5',
      product_id: 'prod-pure-argan-cosmetic',
      user_id: 'user-claire',
      rating: 5,
      title: 'Best argan oil I have ever tested',
      body: 'Non-greasy, absorbs immediately and leaves hair shiny and soft. Very proud to support a local women cooperative.',
      created_at: '2026-02-04T16:40:00Z',
      helpful_count: 11,
      profiles: {
        full_name: 'Claire Dupont',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      }
    }
  ]
};

// Generic fallback reviews generator for any product
export function getMockReviewsForProduct(productId: string): Review[] {
  if (MOCK_REVIEWS[productId]) {
    return MOCK_REVIEWS[productId];
  }

  const p = MOCK_PRODUCTS.find(item => item.id === productId);
  const prodName = p ? p.name : 'Ce produit';

  return [
    {
      id: `rev-gen-${productId}-1`,
      product_id: productId,
      user_id: 'user-gen-1',
      rating: 5,
      title: 'منتج رائع وجودة ممتازة جدًا',
      body: `اشتريت هذا المنتج ووصلني كما هو موصوف تماماً. جودة الحرفية والاهتمام بالتفاصيل يشرف الصانع المغربي. أنصح به بشدة!`,
      created_at: '2026-02-12T16:00:00Z',
      helpful_count: 9,
      profiles: {
        full_name: 'ياسين العلمي (Yassine)',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
      }
    },
    {
      id: `rev-gen-${productId}-2`,
      product_id: productId,
      user_id: 'user-gen-2',
      rating: 5,
      title: 'Superbe expérience d\'achat !',
      body: `Très satisfait de ${prodName}. L\'emballage était très soigné et l\'artisanat d\'Essaouira est au rendez-vous. Bravo !`,
      created_at: '2026-02-05T09:20:00Z',
      helpful_count: 6,
      profiles: {
        full_name: 'Sarah B.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
      }
    },
    {
      id: `rev-gen-${productId}-3`,
      product_id: productId,
      user_id: 'user-gen-3',
      rating: 4,
      title: 'Top quality & fast delivery',
      body: 'Excellent item matching the photos and descriptions. Fast shipping to Casablanca. Will order again from this workshop.',
      created_at: '2026-01-22T13:45:00Z',
      helpful_count: 3,
      profiles: {
        full_name: 'Mark Taylor',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
      }
    }
  ];
}
