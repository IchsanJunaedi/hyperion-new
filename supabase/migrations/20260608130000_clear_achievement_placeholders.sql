-- Clear /brand/logo.jpg placeholder so gradient fallback shows until real images uploaded via /admin
UPDATE achievements SET image_url = NULL WHERE image_url = '/brand/logo.jpg';
