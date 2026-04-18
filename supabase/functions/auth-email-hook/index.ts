import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { parseEmailWebhookPayload } from 'npm:@lovable.dev/email-js'
import { WebhookError, verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Your verification code',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Your password reset code',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// Configuration
const SITE_NAME = 'Toolsmandu'
const ROOT_DOMAIN = 'web.toolsmandu.com'
const FROM_EMAIL = 'support@toolsmandu.com'
const FROM_NAME = 'Toolsmandu'
const ZEPTOMAIL_API_URL = Deno.env.get('ZEPTOMAIL_API_URL') || 'https://api.zeptomail.eu/v1.1/email'

// Sample data for preview mode ONLY
const SAMPLE_PROJECT_URL = 'https://toolsmandu-pro-suite.lovable.app'
const SAMPLE_EMAIL = 'user@example.test'
const SAMPLE_DATA: Record<string, object> = {
  signup: { siteName: SITE_NAME, siteUrl: SAMPLE_PROJECT_URL, recipient: SAMPLE_EMAIL, token: '123456' },
  magiclink: { siteName: SITE_NAME, confirmationUrl: SAMPLE_PROJECT_URL, token: '123456' },
  recovery: { siteName: SITE_NAME, token: '123456' },
  invite: { siteName: SITE_NAME, siteUrl: SAMPLE_PROJECT_URL, confirmationUrl: SAMPLE_PROJECT_URL },
  email_change: { siteName: SITE_NAME, email: SAMPLE_EMAIL, newEmail: SAMPLE_EMAIL, confirmationUrl: SAMPLE_PROJECT_URL },
  reauthentication: { token: '123456' },
}

// Send via ZeptoMail API
async function sendViaZeptoMail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ ok: boolean; status: number; body: string }> {
  let token = Deno.env.get('ZEPTOMAIL_TOKEN')
  if (!token) {
    throw new Error('ZEPTOMAIL_TOKEN not configured')
  }
  // Strip prefix if user pasted full Authorization value
  token = token.trim().replace(/^Zoho-enczapikey\s+/i, '')

  const res = await fetch(ZEPTOMAIL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-enczapikey ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      from: { address: FROM_EMAIL, name: FROM_NAME },
      to: [{ email_address: { address: opts.to } }],
      subject: opts.subject,
      htmlbody: opts.html,
      textbody: opts.text,
    }),
  })

  const body = await res.text()
  if (!res.ok) {
    const headerObj: Record<string, string> = {}
    res.headers.forEach((v, k) => { headerObj[k] = v })
    console.error('ZeptoMail raw response', {
      url: ZEPTOMAIL_API_URL,
      status: res.status,
      bodyLen: body.length,
      bodyPreview: body.slice(0, 300),
      headers: headerObj,
    })
  }
  return { ok: res.ok, status: res.status, body }
}

// Preview endpoint
async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const authHeader = req.headers.get('Authorization')

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]
  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// Webhook handler — verify signature, render template, send via ZeptoMail
async function handleWebhook(req: Request): Promise<Response> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')

  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: any
  let run_id = ''
  try {
    const verified = await verifyWebhookRequest({
      req,
      secret: apiKey,
      parser: parseEmailWebhookPayload,
    })
    payload = verified.payload
    run_id = payload.run_id
  } catch (error) {
    if (error instanceof WebhookError) {
      switch (error.code) {
        case 'invalid_signature':
        case 'missing_timestamp':
        case 'invalid_timestamp':
        case 'stale_timestamp':
          console.error('Invalid webhook signature', { error: error.message })
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        case 'invalid_payload':
        case 'invalid_json':
          console.error('Invalid webhook payload', { error: error.message })
          return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
      }
    }

    console.error('Webhook verification failed', { error })
    return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!run_id || payload.version !== '1') {
    return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailType = payload.data.action_type
  console.log('Received auth event', { emailType, email: payload.data.email, run_id })

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type', { emailType, run_id })
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Init supabase client + fetch logo URL from site_settings
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let logoUrl: string | undefined
  try {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('key,value')
      .in('key', ['email_logo_url', 'logo_url'])
    const map = (settings || []).reduce((acc: Record<string, string>, s: any) => {
      if (s?.value) acc[s.key] = s.value
      return acc
    }, {})
    logoUrl = map['email_logo_url'] || map['logo_url']
  } catch (e) {
    console.error('Failed to fetch logo from site_settings', e)
  }

  // Fetch admin-editable text overrides + subject for this auth email type
  let dbTexts: Record<string, string> = {}
  let dbSubject: string | undefined
  try {
    const { data: tmplRow } = await supabase
      .from('email_templates')
      .select('fields')
      .eq('template_key', emailType)
      .maybeSingle()
    if (tmplRow?.fields && typeof tmplRow.fields === 'object') {
      const f = tmplRow.fields as Record<string, string>
      dbSubject = f.subject
      const { subject: _omit, ...rest } = f
      dbTexts = rest
    }
  } catch (e) {
    console.error('Failed to fetch email_templates row', { emailType, error: e })
  }

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: payload.data.email,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: payload.data.email,
    newEmail: payload.data.new_email,
    logoUrl,
    texts: dbTexts,
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })

  const messageId = crypto.randomUUID()

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: payload.data.email,
    status: 'pending',
  })

  try {
    const result = await sendViaZeptoMail({
      to: payload.data.email,
      subject: EMAIL_SUBJECTS[emailType] || 'Notification',
      html,
      text,
    })

    if (!result.ok) {
      console.error('ZeptoMail send failed', { status: result.status, body: result.body, run_id })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: emailType,
        recipient_email: payload.data.email,
        status: 'failed',
        error_message: `ZeptoMail ${result.status}: ${result.body.slice(0, 500)}`,
      })
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: emailType,
      recipient_email: payload.data.email,
      status: 'sent',
    })

    console.log('Auth email sent via ZeptoMail', { emailType, email: payload.data.email, run_id })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('ZeptoMail send error', { error: errorMsg, run_id })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: emailType,
      recipient_email: payload.data.email,
      status: 'failed',
      error_message: errorMsg.slice(0, 1000),
    })
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  try {
    return await handleWebhook(req)
  } catch (error) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
