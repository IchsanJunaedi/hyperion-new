-- Update all backfilled 'Season 13' entries to 'Season 41'
UPDATE meta_patches 
SET season = 'Season 41' 
WHERE season = 'Season 13';
