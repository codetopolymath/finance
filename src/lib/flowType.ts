export type ColorRole = 'success' | 'destructive' | 'neutral'

export interface FlowTypeMeta {
  label: string
  /** How this flow type affects net worth: 1 = adds, -1 = subtracts, 0 = unknown, excluded from totals. */
  sign: 1 | -1 | 0
  colorRole: ColorRole
}

// Known flow_type values today: income, spend, p2p_out, debt_repayment.
// p2p_in/refund are included defensively since the ingestion pipeline may
// start emitting them.
const FLOW_TYPE_MAP: Record<string, FlowTypeMeta> = {
  income: { label: 'Income', sign: 1, colorRole: 'success' },
  refund: { label: 'Refund', sign: 1, colorRole: 'success' },
  spend: { label: 'Spend', sign: -1, colorRole: 'destructive' },
  p2p_out: { label: 'Sent', sign: -1, colorRole: 'neutral' },
  p2p_in: { label: 'Received', sign: 1, colorRole: 'neutral' },
  debt_repayment: { label: 'Debt Repayment', sign: -1, colorRole: 'neutral' },
}

/** Falls back to a neutral, zero-sign entry for any flow_type the pipeline
 * hasn't been taught yet, so new values render sensibly instead of crashing
 * or silently corrupting totals. */
export function getFlowTypeMeta(flowType: string): FlowTypeMeta {
  return (
    FLOW_TYPE_MAP[flowType] ?? {
      label: flowType.replace(/_/g, ' '),
      sign: 0,
      colorRole: 'neutral',
    }
  )
}
