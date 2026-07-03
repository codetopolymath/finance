// Server-side proxy for firing the DAILY SPENDCHECK Claude Code routine on
// demand. This exists because the app is a public static SPA (GitHub Pages)
// with nowhere to hide the routine's bearer token — it must live here as a
// Supabase secret instead, and this function is the only thing allowed to
// read it. Set secrets with:
//   supabase secrets set SPENDCHECK_ROUTINE_ID=trig_... \
//     SPENDCHECK_ROUTINE_TOKEN=sk-ant-oat01-... \
//     SPENDCHECK_ALLOWED_EMAIL=code.to.polymath@gmail.com
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_EMAIL = Deno.env.get('SPENDCHECK_ALLOWED_EMAIL')!
const ROUTINE_ID = Deno.env.get('SPENDCHECK_ROUTINE_ID')!
const ROUTINE_TOKEN = Deno.env.get('SPENDCHECK_ROUTINE_TOKEN')!

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
      body: JSON.stringify({ text: `Manual run triggered by ${user.email} from the Spendcheck app.` }),
    },
  )

  const body = await routineResponse.json()
  return json(body, routineResponse.status)
})
