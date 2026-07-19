# Admin Panel Gaps — Backlog (2026-06-04)

Brainstormed gaps in `/admin` public CMS panel. Tabled for later.

## What Already Exists in /admin
- Hero section settings (eyebrow, tagline, CTA)
- Gallery / hero slides
- Achievements
- Divisions
- Testimonials
- Partners / sponsor logos
- Join Us section
- Footer settings

## Hardcoded Content — Future Admin Pages Needed

### A. `/admin/about` — About Page Content
- Vision / Mission / Values cards → hardcoded in `app/about/page.tsx` (`CARDS` array)
- Alumni / team members section → hardcoded in `app/about/page.tsx` (`TEAM_MEMBERS` array)
- Fix: move to `site_settings` table or new `about_content` table, add admin UI

### B. `/admin/seo` — SEO / Meta Tags Manager
- Set meta title, description, OG image per public page
- Important for social sharing previews

### C. Header / Navigation Settings
- Nav links currently static in component
- Low priority — rarely changes
