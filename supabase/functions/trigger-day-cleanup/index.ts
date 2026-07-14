// Server-side proxy for firing the TRANSACTION DAY CLEANUP Claude Code
// routine on demand. Same shape as trigger-spendcheck: the app is a public
// static SPA with nowhere to hide the routine's bearer token, so it lives
// here as a Supabase secret instead. Set secrets with:
//   supabase secrets set CLEANUP_ROUTINE_ID=trig_... \
//     CLEANUP_ROUTINE_TOKEN=sk-ant-oat01-... \
//     SPENDCHECK_ALLOWED_EMAIL=code.to.polymath@gmail.com
// (reuses SPENDCHECK_ALLOWED_EMAIL — same allow-listed owner, no need for a
// second copy of the same value.)
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_EMAIL = Deno.env.get('SPENDCHECK_ALLOWED_EMAIL')!
const ROUTINE_ID = Deno.env.get('CLEANUP_ROUTINE_ID')!
const ROUTINE_TOKEN = Deno.env.get('CLEANUP_ROUTINE_TOKEN')!

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

// Yesterday's calendar date in Asia/Kolkata, as YYYY-MM-DD.
function defaultTargetDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  const todayIst = new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00Z`)
  todayIst.setUTCDate(todayIst.getUTCDate() - 1)
  return todayIst.toISOString().slice(0, 10)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // Re-validate the caller's Supabase session and check *who* it belongs to —
  // the platform-level JWT check only proves the token is valid, not that it
  // belongs to the account owner.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user || user.email !== ALLOWED_EMAIL) {
    return json({ error: 'Forbidden' }, 403)
  }

  const body = await req.json().catch(() => ({}))
  const requestedDate = typeof body?.date === 'string' && DATE_RE.test(body.date) ? body.date : null
  const targetDate = requestedDate ?? defaultTargetDate()

  const routineResponse = await fetch(
    `https://api.anthropic.com/v1/claude_code/routines/${ROUTINE_ID}/fire`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ROUTINE_TOKEN}`,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `Fix transactions for ${targetDate}, triggered by ${user.email} from the Finance app.`,
      }),
    },
  )

  const routineBody = await routineResponse.json()
  return json(routineBody, routineResponse.status)
})
