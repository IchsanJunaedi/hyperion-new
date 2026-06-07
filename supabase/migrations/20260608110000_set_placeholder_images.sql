-- Set /brand/logo.jpg as placeholder for all missing/broken images

-- Achievements: update all entries (broken production URLs)
UPDATE achievements SET image_url = '/brand/logo.jpg';

-- Testimonials: update all entries
UPDATE testimonials SET avatar_url = '/brand/logo.jpg';
