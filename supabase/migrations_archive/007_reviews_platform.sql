-- Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  avg_rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Create Helpful Votes Table
CREATE TABLE IF NOT EXISTS helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id)
);

-- Auto-update avg_rating and review_count after insert/update/delete on reviews:
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1) 
      FROM reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*) 
      FROM reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ), 0)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_rating ON reviews;

-- Create Trigger
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR DELETE OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Seed Premium Products
INSERT INTO products (name, description, image_url, category) VALUES
(
  'The Voyager Leather Duffle',
  'Crafted from heritage full-grain leather, this duffle features custom brass hardware, a dedicated shoe compartment, and a timeless silhouette designed to age beautifully over decades of travel.',
  'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=800&q=80',
  'Fashion'
),
(
  'Aether Noise-Cancelling Headphones',
  'Immerse yourself in acoustic perfection. Featuring active hybrid noise cancellation, studio-grade bespoke titanium drivers, 40 hours of battery life, and ear cups lined with luxurious glove leather.',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'Electronics'
),
(
  'Monolith Obsidian Espresso Machine',
  'An editorial masterpiece for the modern kitchen. Built from solid black volcanic obsidian rock and marine-grade stainless steel. Delivers dual-boiler pressure profiling and custom volumetric extraction.',
  'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
  'Home'
),
(
  'Luminescence Radiant Peptide Serum',
  'Unlock cellular youth. Formulated with a highly concentrated 8-peptide complex, pure white truffle extract, and micro-encapsulated hyaluronic acid to instantly restore structural elasticity and hydration.',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  'Beauty'
),
(
  'Aero Carbon Gravel Bicycle',
  'Engage any terrain with premium speed. Utilizing ultra-light monocoque Toray T1000 carbon fiber framesets, wireless electronic groupsets, and integrated hydraulic cockpit systems.',
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  'Sports'
),
(
  'Bespoke Single Estate Match Kit',
  'Curated from first-harvest stone-ground tencha leaves from Uji, Kyoto. Accompanied by a handcrafted golden bamboo whisk and a sand-glazed porcelain matcha bowl.',
  'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
  'Food'
);
