import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(url, serviceKey);

// Product details aligned with schema
const products = [
  // Mogador Woodcraft Products
  {
    store_id: '78f254da-064b-41df-95ab-80e194d80171',
    category_id: '01462087-0b58-4297-a9a5-a26396523f2a', // Wood Carvings
    name: 'Handcrafted Thuya Wood Jewelry Box',
    name_ar: 'علبة مجوهرات من خشب الثويا المصنوعة يدويًا',
    name_fr: 'Boîte à bijoux en bois de Thuya artisanale',
    description: 'Beautiful jewelry box handcrafted from authentic Thuya wood, featuring traditional Moroccan designs and patterns. Polished with natural oils for a stunning glossy finish.',
    description_ar: 'علبة مجوهرات جميلة مصنوعة يدويًا من خشب الثويا الأصيل، تتميز بتصاميم ونقوش مغربية تقليدية. مصقولة بالزيوت الطبيعية للحصول على لمسة نهائية لامعة ومذهلة.',
    description_fr: 'Superbe boîte à bijoux fabriquée à la main en bois de Thuya authentique, ornée de motifs marocains traditionnels. Polie aux huiles naturelles pour une finition brillante et élégante.',
    price: 350.00,
    images: ['https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=600'],
    type: 'physical',
    status: 'active',
    stock: 15,
    is_featured: true
  },
  {
    store_id: '78f254da-064b-41df-95ab-80e194d80171',
    category_id: '01462087-0b58-4297-a9a5-a26396523f2a', // Wood Carvings
    name: 'Thuya Wood Chess Set',
    name_ar: 'طاولة شطرنج كاملة من خشب الثويا',
    name_fr: 'Jeu d\'échecs complet en bois de Thuya',
    description: 'Full chess board and set carved by hand. High quality craftsmanship with rich fragrance and beautiful wood grain textures.',
    description_ar: 'لوحة شطرنج كاملة مع قطعها منحوتة يدويًا. حرفية عالية الجودة مع رائحة عطرية غنية وقوام خشبي مذهل.',
    description_fr: 'Échiquier complet avec pièces sculptées entièrement à la main. Artisanat de haute qualité avec un parfum boisé riche et des textures de grain magnifiques.',
    price: 850.00,
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600'],
    type: 'physical',
    status: 'active',
    stock: 5,
    is_featured: true
  },
  {
    store_id: '78f254da-064b-41df-95ab-80e194d80171',
    category_id: '01462087-0b58-4297-a9a5-a26396523f2a', // Wood Carvings
    name: 'Traditional Thuya Coaster Set',
    name_ar: 'مجموعة قواعد كؤوس تقليدية من خشب الثويا',
    name_fr: 'Ensemble de sous-verres traditionnels en Thuya',
    description: 'Set of 6 natural wooden coasters inside a beautiful round storage box. Highly durable and heat resistant.',
    description_ar: 'مجموعة من 6 قواعد أكواب خشبية طبيعية داخل علبة دائرية أنيقة للحفظ. متينة للغاية ومقاومة للحرارة.',
    description_fr: 'Jeu de 6 sous-verres en bois naturel rangés dans une boîte ronde. Très résistant et élégant sur votre table.',
    price: 150.00,
    images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600'],
    type: 'physical',
    status: 'active',
    stock: 30,
    is_featured: false
  },

  // Argan Gold Cooperative Products
  {
    store_id: '2022d65c-3ada-4e1c-81c7-cdff5e1ab8d8',
    category_id: '93bebcaa-f81d-4f99-9041-5ecd6e54413c', // Oils & Cosmetics
    name: '100% Pure Organic Cosmetic Argan Oil',
    name_ar: 'زيت أركان التجميلي العضوي الطبيعي 100%',
    name_fr: 'Huile d\'Argan cosmétique 100% pure et biologique',
    description: 'Pure cold-pressed cosmetic Argan oil. Extracted ethically by women\'s cooperatives. Nourishes hair, skin, and nails.',
    description_ar: 'زيت أركان التجميلي النقي والمعصور على البارد. مستخلص بطرق أخلاقية من قبل تعاونيات نسائية محلية. يغذي الشعر والبشرة والأظافر.',
    description_fr: 'Huile d\'Argan cosmétique pure extraite par pression à froid. Produite de façon éthique par des coopératives de femmes. Nourrit les cheveux, la peau et les ongles.',
    price: 200.00,
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600'],
    type: 'physical',
    status: 'active',
    stock: 50,
    is_featured: true
  },
  {
    store_id: '2022d65c-3ada-4e1c-81c7-cdff5e1ab8d8',
    category_id: '93bebcaa-f81d-4f99-9041-5ecd6e54413c', // Oils & Cosmetics
    name: 'Organic Culinary Argan Oil',
    name_ar: 'زيت أركان الغذائي العضوي المحمص',
    name_fr: 'Huile d\'Argan culinaire torréfiée bio',
    description: 'Rich culinary Argan oil roasted for a unique nutty flavor. Perfect for dressing salads, dipping bread, or cooking traditional Moroccan dishes.',
    description_ar: 'زيت أركان غذائي غني ومحمص لنكهة مكسرات فريدة. مثالي لتتبيل السلطات وتغميس الخبز أو طبخ الأطباق المغربية التقليدية.',
    description_fr: 'Huile d\'Argan culinaire riche, légèrement torréfiée pour une saveur de noisette unique. Idéale pour salades, pain ou plats traditionnels marocains.',
    price: 250.00,
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'],
    type: 'physical',
    status: 'active',
    stock: 40,
    is_featured: true
  },

  // WaveBound Surf Craft Products
  {
    store_id: '12743437-70a5-4285-a122-1308b51c373e',
    category_id: 'f15578e4-b54d-4a13-96b1-8e5c0bcd7cc5', // Surf & Water Sports
    name: 'Beginner Surf Lesson in Essaouira Beach',
    name_ar: 'حصة ركوب أمواج للمبتدئين في شاطئ الصويرة',
    name_fr: 'Cours de surf débutant à la plage d\'Essaouira',
    description: 'Learn to surf with certified local instructors. Includes complete gear hire (board and wetsuit) and 2 hours of coaching in the safe waves of Essaouira beach.',
    description_ar: 'تعلم ركوب الأمواج مع مدربين محليين معتمدين. تشمل تأجير المعدات بالكامل (اللوح وبدلة الغوص) وساعتين من التدريب في أمواج شاطئ الصويرة الآمنة.',
    description_fr: 'Apprenez à surfer avec des moniteurs certifiés. Comprend la location complète du matériel (planche et combinaison) et 2 heures de cours dans les vagues sûres de la plage d\'Essaouira.',
    price: 300.00,
    images: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600'],
    type: 'experience',
    status: 'active',
    stock: 100,
    is_featured: true
  },
  {
    store_id: '12743437-70a5-4285-a122-1308b51c373e',
    category_id: 'f15578e4-b54d-4a13-96b1-8e5c0bcd7cc5', // Surf & Water Sports
    name: 'Advanced Kitesurfing Session in Sidi Kaouki',
    name_ar: 'جلسة ركوب أمواج شراعية متقدمة في سيدي كاوكي',
    name_fr: 'Session de kitesurf avancée à Sidi Kaouki',
    description: 'Experience the strong winds of Sidi Kaouki with our professional guides. Rent high-end kitesurfing equipment and ride the waves with safety support.',
    description_ar: 'استمتع بالرياح القوية في سيدي كاوكي مع مرشدينا المحترفين. استأجر معدات ركوب أمواج شراعية عالية الجودة واركب الأمواج مع توفر دعم السلامة.',
    description_fr: 'Découvrez les vents forts de Sidi Kaouki avec nos guides professionnels. Louez du matériel de kitesurf haut de gamme et glissez en toute sécurité.',
    price: 600.00,
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'],
    type: 'experience',
    status: 'active',
    stock: 50,
    is_featured: false
  }
];

async function seed() {
  console.log('--- Seeding Products ---');
  for (const product of products) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        store_id: product.store_id,
        category_id: product.category_id,
        name: product.name,
        name_ar: product.name_ar,
        name_fr: product.name_fr,
        description: product.description,
        description_ar: product.description_ar,
        description_fr: product.description_fr,
        price: product.price,
        images: product.images,
        type: product.type,
        status: product.status,
        stock: product.stock,
        is_featured: product.is_featured
      })
      .select('id, name')
      .single();

    if (error) {
      console.error(`Failed to insert product ${product.name}:`, error);
    } else {
      console.log(`Successfully seeded product: ${data.name} (ID: ${data.id})`);
      
      // Seed initial inventory
      const { error: invError } = await supabaseAdmin
        .from('product_inventory')
        .insert({
          product_id: data.id,
          variant_id: null,
          quantity: product.stock,
          reserved: 0
        });
      
      if (invError) {
        console.error(`Failed to seed inventory for product ${data.name}:`, invError);
      } else {
        console.log(`  Seeded inventory of ${product.stock} units.`);
      }
    }
  }
  console.log('--- Seeding Done ---');
}

seed();
