/**
 * Normalize an arbitrary string to a URL-safe slug.
 *
 * Rules:
 *  - lowercase
 *  - strip diacritics
 *  - replace whitespace and underscores with `-`
 *  - drop characters that aren't `[a-z0-9-]`
 *  - collapse repeated dashes
 *  - trim leading/trailing dashes
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slug must be 3–32 chars, lowercase letters / digits / dashes,
 * and cannot start or end with a dash.
 */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}
