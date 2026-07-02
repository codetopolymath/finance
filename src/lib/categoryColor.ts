const CHART_COLOR_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

/** Deterministic category -> chart color, so a given category always gets
 * the same color across the dashboard and insights charts without needing
 * a hardcoded map of every category the ingestion pipeline might produce. */
export function getCategoryColor(category: string): string {
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0
  }
  return CHART_COLOR_VARS[hash % CHART_COLOR_VARS.length]
}
