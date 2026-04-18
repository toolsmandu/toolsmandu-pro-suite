/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toolsmandu.com'
const SUPPORT_WHATSAPP = '+9779864484274'
const WHATSAPP_LINK = 'https://wa.me/9779864484274'
const WHATSAPP_ICON = 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png'

interface OrderCompletedProps {
  customerEmail?: string
  customerPhone?: string
  productName?: string
  orderId?: string | number
  amount?: string | number
  paymentMethod?: string
  adminMessage?: string
  logoUrl?: string
  texts?: {
    eyebrow?: string
    heading?: string
    reminder_text?: string
    support_title?: string
    support_text?: string
  }
}

const DEFAULT_TEXTS = {
  eyebrow: 'ORDER COMPLETED',
  heading: 'Your order is complete',
  reminder_text: 'For your reminder, here is your order details:',
  support_title: 'Need help with your order?',
  support_text: 'Our team is one tap away on WhatsApp.',
}

// Sanitize admin-message HTML: keep a small whitelist of tags, strip all
// attributes except href on <a>. This keeps the rendered email lean and
// avoids bloat from rich-text editor inline styles.
const ALLOWED_TAGS = new Set(['p', 'strong', 'b', 'em', 'i', 'u', 'a', 'br', 'ul', 'ol', 'li', 'span'])
function sanitizeAdminHtml(html: string): string {
  // Remove script/style blocks entirely
  let out = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  // Strip all attributes except href on <a>
  out = out.replace(/<([a-zA-Z0-9]+)([^>]*)>/g, (_m, tag: string, attrs: string) => {
    const lower = tag.toLowerCase()
    if (!ALLOWED_TAGS.has(lower)) return ''
    if (lower === 'a') {
      const href = attrs.match(/\shref\s*=\s*"([^"]*)"/i) || attrs.match(/\shref\s*=\s*'([^']*)'/i)
      return href ? `<a href="${href[1]}">` : '<a>'
    }
    return `<${lower}>`
  })
  // Strip closing tags not in whitelist
  out = out.replace(/<\/([a-zA-Z0-9]+)>/g, (_m, tag: string) => {
    const lower = tag.toLowerCase()
    return ALLOWED_TAGS.has(lower) ? `</${lower}>` : ''
  })
  return out
}

const DetailRow = ({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) => (
  <tr>
    <td style={{ ...detailLabel, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{label}</td>
    <td style={{ ...detailValue, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{value}</td>
  </tr>
)

const OrderCompletedEmail = ({
  customerEmail,
  customerPhone,
  productName,
  orderId,
  amount,
  paymentMethod,
  adminMessage,
  logoUrl,
  texts,
}: OrderCompletedProps) => {
  const t = { ...DEFAULT_TEXTS, ...(texts || {}) }
  const cleanAdminMessage = adminMessage ? sanitizeAdminHtml(adminMessage) : ''
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Body style={main}>
      <Container style={shell}>
        <div style={brandBar}>
          {logoUrl ? (
            <Img src={logoUrl} alt={SITE_NAME} style={logoImg} />
          ) : (
            <Text style={brandText}>{SITE_NAME}</Text>
          )}
        </div>

        <div style={orderIdCard}>
          <Text style={orderIdLabel}>Order ID</Text>
          <Text style={orderIdValue}>#{orderId ?? '—'}</Text>
        </div>

        <div style={hero}>
          <Text style={eyebrow}>{t.eyebrow}</Text>
        </div>

        {cleanAdminMessage && (
          <div style={messageWrap}>
            <div style={messageBox}>
              <div style={messageText} dangerouslySetInnerHTML={{ __html: cleanAdminMessage }} />
            </div>
          </div>
        )}

        <div style={reminderWrap}>
          <Text style={reminderText}>{t.reminder_text}</Text>
        </div>

        <div style={detailsWrap}>
          <table style={detailsTable} cellPadding={0} cellSpacing={0}>
            <tbody>
              <DetailRow label="Email" value={customerEmail || '—'} />
              <DetailRow label="Phone" value={customerPhone || '—'} />
              <DetailRow label="Product" value={productName || '—'} />
              <DetailRow label="Amount" value={`Rs ${amount ?? '—'}`} />
              <DetailRow label="Payment Method" value={paymentMethod || '—'} last />
            </tbody>
          </table>
        </div>

        <div style={divider} />

        <div style={supportSection}>
          <Text style={supportTitle}>{t.support_title}</Text>
          <Text style={supportText}>{t.support_text}</Text>
          <Link href={WHATSAPP_LINK} style={supportNumber}>
            <Img src={WHATSAPP_ICON} alt="" width="18" height="18" style={waIcon} />
            <span style={{ verticalAlign: 'middle' }}>{SUPPORT_WHATSAPP}</span>
          </Link>
        </div>

        <div style={footer}>
          <Text style={footerBrand}>{SITE_NAME}</Text>
          <Text style={footerText}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
        </div>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: OrderCompletedEmail,
  subject: (data: Record<string, any>) => {
    return data?.texts?.subject || 'Your Toolsmandu order is now completed!'
  },
  displayName: 'Order Completed',
  previewData: {
    customerEmail: 'uddheshyastudio@gmail.com',
    customerPhone: '+9779803356474',
    productName: 'En-vato Elements - 1 Month Shared',
    orderId: '19525',
    amount: '1200',
    paymentMethod: 'Khalti',
    adminMessage: '<p><em>Congratulations! Your order is complete now.</em></p><p><strong>How to find login details of purchased services?</strong></p><p>✅ Login into <a href="https://toolsmandu.com">toolsmandu.com</a></p><p>✅ Then, Go to <strong>Profile &gt; Orders</strong> to find login details of purchased services.</p>',
  },
} satisfies TemplateEntry

/* ---------- styles ---------- */
const main = {
  backgroundColor: '#f4f5f7',
  fontFamily: 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 0',
}
const shell = {
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden' as const,
}
const brandBar = { padding: '28px 32px 8px', textAlign: 'center' as const }
const logoImg = { maxHeight: '44px', width: 'auto', display: 'inline-block', margin: '0 auto' }
const brandText = { color: '#0b1220', fontSize: '20px', fontWeight: 700 as const, margin: 0 }

const hero = { padding: '8px 40px 21px', textAlign: 'center' as const }
const eyebrow = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.18em',
  color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase' as const,
}
const h1 = {
  fontSize: '16px', fontWeight: 700 as const, color: '#0b1220',
  margin: '0 0 12px', lineHeight: '1.2',
}
const heroSub = { fontSize: '15px', color: '#5b6473', lineHeight: '1.6', margin: 0 }

const messageWrap = { padding: '0 32px 8px' }
const messageBox = {
  backgroundColor: '#fbfbfc', border: '1px solid #eef0f3',
  borderRadius: '12px', padding: '18px 20px',
}
const messageText = { fontSize: '14px', color: '#0b1220', lineHeight: '1.7' }
const orderIdCard = {
  margin: '16px 0', padding: '22px 24px',
  background: '#0b1220',
  textAlign: 'center' as const,
}
const orderIdLabel = {
  fontSize: '11px', color: '#a8b0bd', margin: '0 0 6px',
  fontWeight: 600 as const, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
}
const orderIdValue = { fontSize: '32px', color: '#ffffff', fontWeight: 700 as const, margin: 0 }
const reminderWrap = { padding: '12px 32px 0', textAlign: 'center' as const }
const reminderText = { fontSize: '14px', color: '#0b1220', margin: 0, fontWeight: 700 as const }

const detailsWrap = { padding: '16px 32px 8px' }
const sectionTitle = {
  fontSize: '12px', fontWeight: 700 as const, color: '#6b7280',
  letterSpacing: '0.14em', textTransform: 'uppercase' as const, margin: '0 0 12px',
}
const detailsTable = {
  width: '100%', borderCollapse: 'collapse' as const,
  border: '1px solid #eef0f3', borderRadius: '12px', overflow: 'hidden' as const,
  backgroundColor: '#fbfbfc',
}
const detailLabel = {
  padding: '14px 16px', fontSize: '13px', fontWeight: 500 as const,
  color: '#6b7280', width: '40%',
}
const detailValue = {
  padding: '14px 16px', fontSize: '14px', color: '#0b1220',
}

const divider = { borderTop: '1px solid #eef0f3', margin: '24px 32px' }

const supportSection = { padding: '4px 32px 28px', textAlign: 'center' as const }
const supportTitle = { fontSize: '16px', fontWeight: 600 as const, color: '#0b1220', margin: '16px 0 4px' }
const supportText = { fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }
const supportNumber = {
  display: 'inline-block', fontSize: '15px', fontWeight: 600 as const,
  color: '#ffffff', textDecoration: 'none', padding: '10px 18px',
  backgroundColor: '#25D366', borderRadius: '999px',
}
const waIcon = { display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }

const footer = {
  padding: '20px 32px 28px', textAlign: 'center' as const,
  backgroundColor: '#fafbfc', borderTop: '1px solid #eef0f3',
}
const footerBrand = { fontSize: '13px', fontWeight: 700 as const, color: '#0b1220', margin: '0 0 4px' }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: 0 }
