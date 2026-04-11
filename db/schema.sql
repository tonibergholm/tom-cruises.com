-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create tables
CREATE TABLE IF NOT EXISTS boats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  model VARCHAR(100),
  type VARCHAR(100),
  year_built VARCHAR(20),
  length VARCHAR(50),
  material VARCHAR(100),
  description TEXT,
  features TEXT,
  cover_image VARCHAR(255),
  api_key VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  boat_id INTEGER REFERENCES boats(id),
  must_change_password BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boat_images (
  id SERIAL PRIMARY KEY,
  boat_id INTEGER NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  alt VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  boat_id INTEGER REFERENCES boats(id),
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boat_tracking (
  id SERIAL PRIMARY KEY,
  boat_id INTEGER NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  note VARCHAR(255),
  speed DECIMAL(5,2),
  heading INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_boats_slug ON boats(slug);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_boat_id ON users(boat_id);
CREATE INDEX IF NOT EXISTS idx_boat_images_boat_id ON boat_images(boat_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_boat_id ON blog_posts(boat_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_boat_tracking_boat_id ON boat_tracking(boat_id);

-- Seed boats
INSERT INTO boats (name, slug, model, type, year_built, length, material, description, features, api_key)
VALUES
  ('Lyyli', 'lyyli', 'Albatross 26', 'Sailing Yacht', '1977', '26 feet', 'Fiberglass',
   'Lyyli is an Albatross 26, a classic sailing yacht known for its performance and elegance. It features a sturdy hull, comfortable cabin, and is perfect for both day sailing and longer coastal voyages.',
   'Spacious cockpit, modern rigging',
   encode(gen_random_bytes(32), 'hex')),
  ('Pamela', 'pamela', NULL, 'Self-built Wooden Yacht', '1974–1978', '35+ feet', 'Pine, Mahogany & Teak Wood',
   'Pamela is a lovingly self-built wooden yacht, crafted with passion and attention to detail. This yacht combines traditional craftsmanship with timeless beauty, offering a unique sailing experience.',
   'Handcrafted interior, classic design',
   encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (slug) DO NOTHING;
