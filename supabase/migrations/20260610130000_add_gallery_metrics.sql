-- Add metric columns to gallery_entries
ALTER TABLE gallery_entries ADD COLUMN metric_value text;
ALTER TABLE gallery_entries ADD COLUMN metric_label text;

-- Seed initial data with metrics matching their achievements
UPDATE gallery_entries 
SET metric_value = '#1', 
    metric_label = 'National Student Esport League' 
WHERE slug = 'liga-esport-nasional-pelajar-2024';

UPDATE gallery_entries 
SET metric_value = '3-1', 
    metric_label = 'Grand Final win against SMAK Yos Sudarso' 
WHERE slug = 'rrq-mabar-esports-tournament-season-4';

UPDATE gallery_entries 
SET metric_value = 'IESF 2023', 
    metric_label = 'Qualified to Seleknas after 4.0 win' 
WHERE slug = 'h3ro-rookie-tournament-4';
