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

interface NewOrderProps {
  customerEmail?: string
  customerPhone?: string
  productName?: string
  paymentMethod?: string
  orderId?: string | number
  amount?: string | number
  logoUrl?: string
  texts?: {
    eyebrow?: string
    heading?: string
    sub_message?: string
    support_title?: string
    support_text?: string
  }
}

const DEFAULT_TEXTS = {
  eyebrow: 'ORDER CONFIRMATION',
  heading: 'Thank you for your order',
  sub_message: "We've received your order and it's being prepared. A separate email with your product details will follow shortly.",
  support_title: 'Need help with your order?',
  support_text: 'Our team is one tap away on WhatsApp.',
}

const DetailRow = ({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) => (
  <tr>
    <td style={{ ...detailLabel, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{label}</td>
    <td style={{ ...detailValue, borderBottom: last ? 'none' : '1px solid #eef0f3' }}>{value}</td>
  </tr>
)

const NewOrderEmail = ({
  customerEmail,
  customerPhone,
  productName,
  paymentMethod,
  orderId,
  amount,
  logoUrl,
  texts,
}: NewOrderProps) => {
  const t = { ...DEFAULT_TEXTS, ...(texts || {}) }
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

        <div style={hero}>
          <Text style={eyebrow}>{t.eyebrow}</Text>
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={heroSub}>{t.sub_message}</Text>
        </div>

        <div style={amountCard}>
          <Text style={amountLabel}>Order ID</Text>
          <Text style={amountValue}>#{orderId ?? '—'}</Text>
        </div>

        <div style={detailsWrap}>
          <Text style={sectionTitle}>Order Details</Text>
          <table style={detailsTable} cellPadding={0} cellSpacing={0}>
            <tbody>
              <DetailRow label="Email" value={
                customerEmail ? <Link href={`mailto:${customerEmail}`} style={link}>{customerEmail}</Link> : '—'
              } />
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
  component: NewOrderEmail,
  subject: (data: Record<string, any>) => {
    const base = data?.texts?.subject || 'Your Toolsmandu order has been received!'
    return data?.orderId ? `${base} (#${data.orderId})` : base
  },
  displayName: 'New Order',
  previewData: {
    customerEmail: 'prashannapradhan@gmail.com',
    customerPhone: '+9779768970959',
    productName: 'IPTV - 1 Month 1 Screen',
    paymentMethod: 'Khalti',
    orderId: '20760',
    amount: '600',
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

const hero = { padding: '8px 40px 28px', textAlign: 'center' as const }
const eyebrow = {
  fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.18em',
  color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase' as const,
}
const h1 = {
  fontSize: '16px', fontWeight: 700 as const, color: '#0b1220',
  margin: '0 0 12px', lineHeight: '1.2',
}
const heroSub = { fontSize: '15px', color: '#5b6473', lineHeight: '1.6', margin: '0 0 20px' }

const amountCard = {
  margin: '0 0 24px', padding: '22px 24px',
  background: '#0b1220',
  textAlign: 'center' as const,
}
const amountLabel = {
  fontSize: '11px', color: '#a8b0bd', margin: '0 0 6px',
  fontWeight: 600 as const, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
}
const amountValue = { fontSize: '32px', color: '#ffffff', fontWeight: 700 as const, margin: 0 }

const detailsWrap = { padding: '0 32px 8px' }
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
  padding: '14px 16px', fontSize: '14px', color: '#0b1220', fontWeight: 500 as const,
}
const link = { color: '#0b1220', textDecoration: 'underline' }

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
