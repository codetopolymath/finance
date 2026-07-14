// Server-side write path for the receipt-capture feature. This is the ONLY
// place allowed to write amount/vendor/utr/txn_at/flow_type/account — the
// client-facing Supabase column grant stays exactly as restrictive as it is
// today (category+note only, see src/lib/queries.ts's useUpdateTransaction
// comment). This function uses the service-role key (bypasses RLS/grants by
// design, standard for trusted server code) instead of widening that grant —
// so the existing lockdown is untouched; this function's own auth check is
// the entire trust boundary. Set secrets with:
//   supabase secrets set SPENDCHECK_ALLOWED_EMAIL=code.to.polymath@gmail.com
// (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPABASE_ANON_KEY are already
// available as default Edge Function secrets.)
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_EMAIL = Deno.env.get('SPENDCHECK_ALLOWED_EMAIL')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface CommitBody {
  matchedId?: number
  txn_at: string
  flow_type: string
  amount: number
  account: string
  category: string
  utr: string | null
  vendor: string | null
  note: string | null
}

const REQUIRED_FIELDS: (keyof CommitBody)[] = ['txn_at', 'flow_type', 'amount', 'account', 'category']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // Re-validate the caller's Supabase session and check *who* it belongs to —
  // the platform-level JWT check only proves the token is valid, not that it
  // belongs to the account owner. This uses the anon-key client purely for
  // identity verification, never for the actual write below.
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser()
  if (authError || !user || user.email !== ALLOWED_EMAIL) {
    return json({ error: 'Forbidden' }, 403)
  }

  const body = (await req.json().catch(() => null)) as CommitBody | null
  if (!body) return json({ error: 'Invalid JSON body' }, 400)

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return json({ error: `Missing required field: ${field}` }, 400)
    }
  }

  // Service-role client — the only place in this app that can touch columns
  // beyond category/note. Never expose this key to the client.
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const row = {
    txn_at: body.txn_at,
    flow_type: body.flow_type,
    amount: body.amount,
    account: body.account,
    category: body.category,
    utr: body.utr ?? null,
    vendor: body.vendor ?? null,
    note: body.note ?? null,
  }

  if (body.matchedId) {
    // A manual pick (or a confirmed UTR auto-match) always wins over any
    // further UTR-based conflict handling — this is a direct, targeted update.
    const { error } = await adminClient.from('transactions').update(row).eq('id', body.matchedId)
    if (error) return json({ error: error.message }, 500)
    return json({ id: body.matchedId, action: 'updated' }, 200)
  }

  if (row.utr) {
    const { data, error } = await adminClient
      .from('transactions')
      .upsert(row, { onConflict: 'utr' })
      .select('id')
      .single()
    if (error) return json({ error: error.message }, 500)
    return json({ id: data.id, action: 'upserted' }, 200)
  }

  const { data, error } = await adminClient.from('transactions').insert(row).select('id').single()
  if (error) return json({ error: error.message }, 500)
  return json({ id: data.id, action: 'inserted' }, 200)
})
