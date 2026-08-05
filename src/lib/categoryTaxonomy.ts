export interface CategoryGroup {
  group: string
  categories: string[]
}

// Shared with the "spendcheck" SMS-tracker skill (outside this repo) — keep
// group/category names in sync; don't rename without updating that skill too.
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    group: 'Income',
    categories: ['Salary', 'Interest', 'Dividends / Investment Income', 'Income (Other)', 'Crypto Income', 'Refund'],
  },
  {
    group: 'Loan',
    categories: [
      'Loan EMI (Personal)',
      'Loan EMI (Vehicle)',
      'Loan EMI (Home)',
      'Credit Card Payment',
      'BNPL Payment',
    ],
  },
  {
    group: 'Bills & Housing',
    categories: ['Electricity', 'Water', 'Mobile & Internet', 'Gas / LPG', 'Rent', 'Maintenance / Society'],
  },
  { group: 'Food', categories: ['Food & Dining', 'Groceries', 'Alcohol & Beverages'] },
  { group: 'Transport', categories: ['Transport', 'Fuel', 'Parking & Tolls', 'Vehicle Maintenance'] },
  {
    group: 'Shopping',
    categories: [
      'Shopping & Other',
      'Clothing & Accessories',
      'Electronics',
      'Health & Medical',
      'Personal Care',
      'Pets',
      'Home & Furniture',
    ],
  },
  { group: 'Subscriptions', categories: ['Subscriptions'] },
  { group: 'Entertainment & Travel', categories: ['Entertainment', 'Travel'] },
  { group: 'Cash', categories: ['Cash Withdrawal', 'Cash Deposit'] },
  { group: 'Bank Fees', categories: ['Bank Fees'] },
  { group: 'Transfers', categories: ['P2P Transfer'] },
  {
    group: 'Investment',
    categories: ['Property / Investment', 'Mutual Funds / Stocks / SIP', 'Gold / Other Investment'],
  },
  { group: 'Education', categories: ['Education / Courses'] },
  { group: 'Insurance', categories: ['Insurance Premium'] },
  { group: 'Other', categories: ['Donations', 'Government Fees', 'Gifts', 'Taxes'] },
]

const CATEGORY_TO_GROUP: Record<string, string> = Object.fromEntries(
  CATEGORY_GROUPS.flatMap(({ group, categories }) => categories.map((category) => [category, group])),
)

/** Falls back to "Other" for any category string not in the canonical
 * taxonomy (legacy/unmapped data), mirroring getFlowTypeMeta's fallback. */
export function getCategoryGroup(category: string): string {
  return CATEGORY_TO_GROUP[category] ?? 'Other'
}
