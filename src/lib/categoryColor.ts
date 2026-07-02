import type { CategoryTotal } from '@/lib/selectors'

/** Fixed, validated 8-hue categorical set (see index.css for the source
 * values and validation note). Order is fixed and never cycled. */
const CATEGORY_COLOR_VARS = [
  'var(--category-1)',
  'var(--category-2)',
  'var(--category-3)',
  'var(--category-4)',
  'var(--category-5)',
  'var(--category-6)',
  'var(--category-7)',
  'var(--category-8)',
]

const OTHER_COLOR_VAR = 'var(--category-other)'
const OTHER_LABEL = 'Other'

export interface ColoredCategoryTotal extends CategoryTotal {
  color: string
  /** True only for the synthetic "Other" bucket — it doesn't correspond to a
   * single real category value, so callers shouldn't treat it as filterable. */
  isOther?: boolean
}

/** Assigns each of the top 8 categories (by total, already sorted by
 * categoryBreakdown) a fixed, distinct slot color. Categories beyond the 8th
 * are folded into a single "Other" bucket rather than reusing or generating
 * hues — an unbounded category count can otherwise collide or crowd the
 * legend. */
export function assignCategoryColors(categories: CategoryTotal[]): ColoredCategoryTotal[] {
  const visible = categories.slice(0, CATEGORY_COLOR_VARS.length).map((item, index) => ({
    ...item,
    color: CATEGORY_COLOR_VARS[index],
  }))

  const rest = categories.slice(CATEGORY_COLOR_VARS.length)
  if (rest.length === 0) return visible

  const other: ColoredCategoryTotal = {
    category: OTHER_LABEL,
    total: rest.reduce((sum, item) => sum + item.total, 0),
    count: rest.reduce((sum, item) => sum + item.count, 0),
    color: OTHER_COLOR_VAR,
    isOther: true,
  }

  return [...visible, other]
}
