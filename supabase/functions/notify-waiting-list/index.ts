import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { productId, siteOrigin } = await req.json()
    if (!productId || typeof productId !== 'string') {
      return new Response(JSON.stringify({ error: 'productId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('id, name, slug, stock_status')
      .eq('id', productId)
      .single()

    if (pErr || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (product.stock_status === 'out_of_stock') {
      return new Response(JSON.stringify({ skipped: true, reason: 'still out of stock' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: waiters, error: wErr } = await supabase
      .from('waiting_list')
      .select('id, email')
      .eq('product_id', productId)
      .eq('status', 'waiting')

    if (wErr) throw wErr

    const productUrl = `${siteOrigin || 'https://toolsmandu.com'}/item/${product.slug}`
    let sent = 0
    const failures: Array<{ email: string; error: string }> = []

    for (const w of waiters || []) {
      try {
        const { error: invokeErr } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'stock-available',
            recipientEmail: w.email,
            idempotencyKey: `stock-available-${w.id}`,
            templateData: {
              productName: product.name,
              productUrl,
            },
          },
        })
        if (invokeErr) throw invokeErr

        await supabase
          .from('waiting_list')
          .update({ status: 'notified', notified_at: new Date().toISOString() })
          .eq('id', w.id)
        sent++
      } catch (e: any) {
        failures.push({ email: w.email, error: e?.message || String(e) })
      }
    }

    return new Response(
      JSON.stringify({ sent, totalWaiting: waiters?.length || 0, failures }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e: any) {
    console.error('notify-waiting-list error:', e)
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
