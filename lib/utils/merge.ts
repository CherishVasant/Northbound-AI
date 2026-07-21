/**
 * Merges a patch into a record without dropping anything the patch omits.
 *
 * Plain objects are merged one level deeper rather than replaced, so a patch
 * like `{ panelHeights: { aboutCompany: 120 } }` keeps the other saved heights
 * instead of blanking them. Arrays are replaced wholesale — `history` is an
 * ordered log the caller has already rebuilt, and merging it index-by-index
 * would resurrect rounds the user just deleted.
 *
 * A key the patch does not mention is never touched. A key it sets to `''`, `0`
 * or `null` IS applied — clearing a field is a legitimate edit; only *not
 * knowing a field exists* must be unable to erase it.
 */
export function deepMerge<T>(target: T, src: Partial<T>): T {
  if (!src || typeof src !== 'object') return target;

  const out: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const key of Object.keys(src) as (keyof T & string)[]) {
    // Guard against a patch that arrived from JSON.parse carrying __proto__.
    if (key === '__proto__' || key === 'constructor') continue;

    const val = (src as Record<string, unknown>)[key];
    const prev = out[key];

    if (
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      prev !== null &&
      typeof prev === 'object' &&
      !Array.isArray(prev)
    ) {
      out[key] = deepMerge(prev, val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }

  return out as T;
}
