-- Fix broken image URLs for testimonials and partners (replace production storage URLs with working CDN URLs)

-- Testimonials: replace hyperionteam.id storage URLs with working Unsplash portraits
UPDATE testimonials
SET avatar_url = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80'
WHERE author_name = 'RRQ Kaeya';

UPDATE testimonials
SET avatar_url = 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&q=80'
WHERE author_name = 'Evos Rendyy';

UPDATE testimonials
SET avatar_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
WHERE author_name = 'Pajajaran Firlyboy';

-- Partners: replace placeholder names + broken storage URLs with real gaming brands + simpleicons CDN
UPDATE partners SET name = 'NVIDIA',      logo_url = 'https://cdn.simpleicons.org/nvidia'    WHERE name = 'Partner 1';
UPDATE partners SET name = 'AMD',         logo_url = 'https://cdn.simpleicons.org/amd'       WHERE name = 'Partner 2';
UPDATE partners SET name = 'Razer',       logo_url = 'https://cdn.simpleicons.org/razer'     WHERE name = 'Partner 3';
UPDATE partners SET name = 'Logitech',    logo_url = 'https://cdn.simpleicons.org/logitech'  WHERE name = 'Partner 4';
UPDATE partners SET name = 'Corsair',     logo_url = 'https://cdn.simpleicons.org/corsair'   WHERE name = 'Partner 5';
UPDATE partners SET name = 'ASUS',        logo_url = 'https://cdn.simpleicons.org/asus'      WHERE name = 'Partner 6';
UPDATE partners SET name = 'Samsung',     logo_url = 'https://cdn.simpleicons.org/samsung'   WHERE name = 'Partner 7';
UPDATE partners SET name = 'Intel',       logo_url = 'https://cdn.simpleicons.org/intel'     WHERE name = 'Partner 8';
